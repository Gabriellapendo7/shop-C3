import { pool } from "#infrastructure/db.js";

// Transaction-only: an order and its items must be inserted atomically with the
// stock decrement, so the caller owns the transaction.
export async function insertOrder(order, client) {
  const { rows } = await client.query(
    `INSERT INTO orders
       (paystack_reference, customer_email, customer_name,
        customer_phone, shipping_address, payment_channel, total_cents)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      order.reference,
      order.email,
      order.name,
      // || not ?? — a blank form field arrives as "" and should store as NULL.
      order.phone || null,
      order.address || null,
      order.paymentChannel,
      order.totalCents,
    ]
  );
  return rows[0].id;
}

export async function insertOrderItem(item, client) {
  await client.query(
    `INSERT INTO order_items
       (order_id, product_id, quantity, unit_price_cents)
     VALUES ($1, $2, $3, $4)`,
    [item.orderId, item.productId, item.quantity, item.unitPriceCents]
  );
}

// Full order row for the customer-facing order page.
export async function findByReference(reference, executor = pool) {
  const { rows } = await executor.query(
    `SELECT id, paystack_reference, customer_name, customer_email,
            payment_channel, status, total_cents, created_at
     FROM orders
     WHERE paystack_reference = $1`,
    [reference]
  );
  return rows[0] ?? null;
}

// Just what the payment paths need: the id to update, the status for the
// idempotency guard, and the total to verify the paid amount against.
// Shared by the verify redirect and the webhook.
export async function findPaymentStateByReference(reference, executor = pool) {
  const { rows } = await executor.query(
    "SELECT id, status, total_cents FROM orders WHERE paystack_reference = $1",
    [reference]
  );
  return rows[0] ?? null;
}

export async function findItemsByOrderId(orderId, executor = pool) {
  const { rows } = await executor.query(
    `SELECT oi.quantity, oi.unit_price_cents, p.name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return rows;
}

// Batch lookup for the admin reconciliation view.
export async function findByReferences(references, executor = pool) {
  const { rows } = await executor.query(
    `SELECT paystack_reference, status, total_cents
     FROM orders WHERE paystack_reference = ANY($1)`,
    [references]
  );
  return rows;
}

// Locks the row so concurrent admin status updates serialise rather than
// racing on a stale read. Transaction-only.
export async function findStatusByIdForUpdate(orderId, client) {
  const { rows } = await client.query(
    "SELECT status FROM orders WHERE id = $1 FOR UPDATE",
    [orderId]
  );
  return rows[0] ?? null;
}

export async function updateStatus(orderId, status, executor = pool) {
  await executor.query(
    "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
    [status, orderId]
  );
}

// The AND status = 'pending' is what makes failure marking idempotent: a repeat
// call matches no rows and returns null, so the caller knows not to restock a
// second time.
export async function markPendingAsFailed(reference, executor = pool) {
  const { rows } = await executor.query(
    `UPDATE orders
     SET status = 'failed', updated_at = NOW()
     WHERE paystack_reference = $1 AND status = 'pending'
     RETURNING id`,
    [reference]
  );
  return rows[0]?.id ?? null;
}
