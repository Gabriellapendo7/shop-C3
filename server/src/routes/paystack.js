import { Router } from "express";
import { pool } from "../db.js";
import { verifyTransaction } from "../paystack.js";
import { asyncHandler } from "../asyncHandler.js";

export const paystackRouter = Router();

// Where the customer lands once we're done talking to Paystack.
function shopUrl(status, reference) {
  const base = process.env.SHOP_URL || "http://localhost:3000";
  const url = new URL("/checkout/complete", base);
  url.searchParams.set("status", status);
  if (reference) url.searchParams.set("reference", reference);
  return url.toString();
}

// Paystack appends its own ?trxref=…&reference=… to callback_url, so a param
// can arrive more than once. Express gives us an array in that case.
function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

// Settles the order for a reference. Guarded on status = 'pending' so that a
// customer refreshing the callback — or the webhook arriving later — can't
// restock the same order twice.
async function settleOrder(reference, nextStatus) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE orders SET status = $2, updated_at = NOW()
       WHERE paystack_reference = $1 AND status = 'pending'
       RETURNING id, total_cents`,
      [reference, nextStatus]
    );

    // Payment will never complete — give the reserved stock back.
    if (rows.length > 0 && nextStatus === "failed") {
      await client.query(
        `UPDATE products p SET stock = p.stock + oi.quantity
         FROM order_items oi
         WHERE oi.product_id = p.id AND oi.order_id = $1`,
        [rows[0].id]
      );
    }

    await client.query("COMMIT");
    return rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Paystack redirects the customer's browser here after payment. This endpoint
// is reached by a top-level navigation, so it must always answer with a
// redirect back to the shop — never JSON, and never an unhandled throw.
paystackRouter.get(
  "/verify",
  asyncHandler(async (req, res) => {
    const reference = firstValue(req.query.reference) || firstValue(req.query.trxref);

    if (!reference) {
      return res.redirect(shopUrl("invalid"));
    }

    let transaction;
    try {
      transaction = await verifyTransaction(reference);
    } catch (err) {
      // Couldn't reach Paystack or the reference is unknown. Leave the order
      // pending — the webhook or a retry can still settle it.
      console.error(`Paystack verify failed for ${reference}:`, err.message);
      return res.redirect(shopUrl("error", reference));
    }

    // 'success' is final. 'failed'/'abandoned'/'reversed' are final failures.
    // Anything else (mobile money often reports 'pending' or 'ongoing' at the
    // moment of redirect) is still in flight — don't touch stock yet.
    if (transaction.status === "success") {
      const order = await settleOrder(reference, "paid");

      // Confirm Paystack charged what we billed. A short payment is not a sale.
      if (order && transaction.amount !== order.total_cents) {
        console.error(
          `Amount mismatch for ${reference}: charged ${transaction.amount}, expected ${order.total_cents}`
        );
        return res.redirect(shopUrl("error", reference));
      }

      return res.redirect(shopUrl("success", reference));
    }

    if (["failed", "abandoned", "reversed"].includes(transaction.status)) {
      await settleOrder(reference, "failed");
      return res.redirect(shopUrl("failed", reference));
    }

    return res.redirect(shopUrl("pending", reference));
  })
);

// Read-only status lookup for the confirmation page, so a customer who lands
// on 'pending' can poll instead of being told to guess.
paystackRouter.get(
  "/status/:reference",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT status, total_cents, customer_email
       FROM orders WHERE paystack_reference = $1`,
      [req.params.reference]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(rows[0]);
  })
);
