import { query } from "./db.js";
import { restockFailedOrder } from "./orderLifecycle.js";

// Shared by the webhook and the verify redirect.
// Must be idempotent — Paystack retries webhooks and both paths
// may run for the same payment.
export async function confirmPayment(reference, paidAmountInSubunit) {
  const { rows } = await query(
    `SELECT id, status, total_cents
     FROM orders WHERE paystack_reference = $1`,
    [reference]
  );
  const order = rows[0];

  if (!order) {
    console.warn(`Payment confirmation for unknown reference: ${reference}`);
    return;
  }

  // Idempotency guard — if already processed, do nothing
  if (order.status !== "pending") {
    console.log(
      `Duplicate confirmation for ${reference}, already ${order.status}`
    );
    return;
  }

  // Amount verification — never approve if the paid amount differs
  if (paidAmountInSubunit !== order.total_cents) {
    console.error(
      `Amount mismatch for order ${order.id}: ` +
      `expected ${order.total_cents}, got ${paidAmountInSubunit}`
    );
    await query(
      "UPDATE orders SET status = 'failed', updated_at = NOW() WHERE id = $1",
      [order.id]
    );
    await restockFailedOrder(order.id);
    return;
  }

  // All checks pass — mark as paid
  await query(
    "UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1",
    [order.id]
  );
}

// Called when Paystack reports failure or the customer abandons payment.
// The WHERE clause's AND status = 'pending' makes this idempotent —
// if the order is already failed (or paid), RETURNING returns nothing.
export async function markPaymentFailed(reference) {
  const { rows } = await query(
    `UPDATE orders
     SET status = 'failed', updated_at = NOW()
     WHERE paystack_reference = $1 AND status = 'pending'
     RETURNING id`,
    [reference]
  );
  if (rows[0]) {
    await restockFailedOrder(rows[0].id);
  }
}