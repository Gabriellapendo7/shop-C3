import { Router } from "express";
import { query } from "../db.js";
import { verifyTransaction, isValidWebhookSignature } from "../paystack.js";
import { confirmPayment, markPaymentFailed } from "../paymentConfirmation.js";
import { asyncHandler } from "../asyncHandler.js";

export const paystackRouter = Router();

// ── Verify redirect ─────────────────────────────────────────────────────────
// Paystack redirects the customer's browser here after checkout.
// This is the synchronous path — the customer is watching.
// The webhook below is the authoritative async fallback.
paystackRouter.get("/verify", asyncHandler(async (req, res) => {
  const { reference } = req.query;
  if (!reference) {
    return res.status(400).send("Missing reference");
  }

  // Check if we already have a result for this reference
  const { rows } = await query(
    "SELECT status FROM orders WHERE paystack_reference = $1",
    [reference]
  );
  if (!rows[0]) {
    return res.status(404).send("Order not found");
  }

  // Only call Paystack if the order is still pending
  // (webhook may have already confirmed it)
  if (rows[0].status === "pending") {
    const transaction = await verifyTransaction(reference);
    if (transaction.status === "success") {
      await confirmPayment(reference, transaction.amount);
    } else {
      await markPaymentFailed(reference);
    }
  }

  // Always redirect to the order page — let the UI show the current status
  res.redirect(`${process.env.SHOP_URL}/orders/${reference}`);
}));

// ── Webhook ─────────────────────────────────────────────────────────────────
// Paystack sends this server-to-server, independently of the browser.
// Mounted with express.raw() in index.js so req.body is the raw Buffer
// needed for HMAC-SHA512 signature verification.
paystackRouter.post("/webhook", asyncHandler(async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const rawBody = req.body; // Buffer, not parsed JSON

  if (!signature || !isValidWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(rawBody.toString("utf8"));

  if (event.event === "charge.success") {
    await confirmPayment(event.data.reference, event.data.amount);
  }

  if (event.event === "charge.failed") {
    await markPaymentFailed(event.data.reference);
  }

  // Always return 200 — Paystack retries webhooks on non-200 responses
  res.json({ received: true });
}));