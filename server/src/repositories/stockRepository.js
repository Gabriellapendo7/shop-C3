import { pool } from "#infrastructure/db.js";

// Reserves stock at checkout. Transaction-only: the caller must already hold the
// row lock taken by productRepository.findByIdsForUpdate, otherwise the read
// that justified this decrement could be stale.
export async function decrement(productId, quantity, client) {
  await client.query(
    "UPDATE products SET stock = stock - $1 WHERE id = $2",
    [quantity, productId]
  );
}

// Returns every line of an order to stock in one set-based statement, rather
// than a query per item. Used when an order is cancelled, when Paystack reports
// failure, and when a Paystack amount mismatch invalidates a paid order.
export async function restockOrder(orderId, executor = pool) {
  await executor.query(
    `UPDATE products p
     SET stock = p.stock + oi.quantity
     FROM order_items oi
     WHERE oi.product_id = p.id AND oi.order_id = $1`,
    [orderId]
  );
}
