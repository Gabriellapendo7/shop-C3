import { Router } from "express";
import crypto from "node:crypto";
import { pool, query } from "../db.js";
import { initializeTransaction } from "../paystack.js";
import { asyncHandler } from "../asyncHandler.js";

export const checkoutRouter = Router();

// Maps our UI's payment choice to the Paystack channels array.
// "mobile_money" is one Paystack channel covering both M-Pesa and Airtel Money —
// the customer picks their specific network on Paystack's own hosted page.
const CHANNELS_BY_PAYMENT_CHANNEL = {
  card: ["card"],
  mobile_money: ["mobile_money"],
};

checkoutRouter.post("/", asyncHandler(async (req, res) => {
  const { items, customer, paymentChannel } = req.body;

  // ── Step 1: Validate incoming data ─────────────────────────────────────────
  const name = customer?.name?.trim();
  const email = customer?.email?.trim();
  const phone = customer?.phone?.trim();
  const address = customer?.address?.trim();

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!CHANNELS_BY_PAYMENT_CHANNEL[paymentChannel]) {
    return res.status(400).json({ error: "Choose a valid payment option" });
  }

  // ── Step 2: Generate a unique reference for this transaction ───────────────
  const reference = `order_${crypto.randomUUID()}`;

  // ── Step 3: Database transaction ───────────────────────────────────────────
  // We use pool.connect() here (not query()) because BEGIN, COMMIT, and ROLLBACK
  // are connection-scoped. All three must run on the same connection.
  const client = await pool.connect();
  let orderId;
  let subtotalCents;

  try {
    await client.query("BEGIN");

    // Re-price server-side — never trust client-sent prices.
    // FOR UPDATE locks these rows: a concurrent checkout for the same products
    // will block here until this transaction commits or rolls back.
    const ids = items.map((i) => i.productId);
    const { rows: products } = await client.query(
      "SELECT id, name, price_cents, stock FROM products WHERE id = ANY($1) FOR UPDATE",
      [ids]
    );

    // Build line items using server prices, not client prices
    const lines = items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          product,
          quantity: item.quantity,
          unitPriceCents: product.price_cents,
        };
      })
      .filter(Boolean);

    if (lines.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No valid items in cart" });
    }

    // Check every line against current stock
    const insufficient = lines.find((l) => l.quantity > l.product.stock);
    if (insufficient) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: `Not enough stock for ${insufficient.product.name} — ${insufficient.product.stock} available, ${insufficient.quantity} requested`,
      });
    }

    // Calculate total
    subtotalCents = lines.reduce(
      (sum, l) => sum + l.unitPriceCents * l.quantity,
      0
    );

    // Insert the parent order record
    const { rows } = await client.query(
      `INSERT INTO orders
         (paystack_reference, customer_email, customer_name,
          customer_phone, shipping_address, payment_channel, total_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [reference, email, name, phone || null, address || null, paymentChannel, subtotalCents]
    );
    orderId = rows[0].id;

    // Insert one order_item row per line and decrement stock atomically
    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4)`,
        [orderId, line.product.id, line.quantity, line.unitPriceCents]
      );

      await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2",
        [line.quantity, line.product.id]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    // Always release — even if COMMIT or ROLLBACK itself throws
    client.release();
  }

  // ── Step 4: Initialise Paystack transaction ────────────────────────────────
  // This runs AFTER the database transaction commits. If Paystack fails here,
  // the order exists in the DB as 'pending' with stock reserved. We must
  // restock and mark it failed.
  try {
    const { authorization_url } = await initializeTransaction({
      email,
      amountInSubunit: subtotalCents,
      reference,
      // No query string here — Paystack appends ?trxref=…&reference=… itself.
      // Adding our own would make `reference` arrive twice and parse as an array.
      callbackUrl: `${process.env.API_URL}/api/paystack/verify`,
      channels: CHANNELS_BY_PAYMENT_CHANNEL[paymentChannel],
      metadata: { orderId },
    });

    res.json({ authorizationUrl: authorization_url, reference });
  } catch (err) {
    // Paystack failed — restock and mark the order failed
    await query(
      `UPDATE products p SET stock = p.stock + oi.quantity
       FROM order_items oi
       WHERE oi.product_id = p.id AND oi.order_id = $1`,
      [orderId]
    );
    await query(
      "UPDATE orders SET status = 'failed', updated_at = NOW() WHERE id = $1",
      [orderId]
    );
    throw err;
  }
}));