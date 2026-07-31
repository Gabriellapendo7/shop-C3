import { pool } from "./db.js";

// Valid transitions for admin-driven status changes.
// Payment-driven transitions (pending → paid/failed) are handled by
// paymentConfirmation.js — those come from Paystack, not a human.
export const TRANSITIONS = {
  pending: ["cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  failed: [],
};

// Shared internal function — restores product stock when an order
// is cancelled or fails after stock was reserved at checkout.
async function restockOrder(client, orderId) {
  await client.query(
    `UPDATE products p
     SET stock = p.stock + oi.quantity
     FROM order_items oi
     WHERE oi.product_id = p.id AND oi.order_id = $1`,
    [orderId]
  );
}

// Used by paymentConfirmation.js when Paystack reports failure or
// amount mismatch. Wraps restockOrder in its own transaction.
export async function restockFailedOrder(orderId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await restockOrder(client, orderId);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Admin-driven status updates with transition validation and
// automatic restocking when cancelling a paid or pending order.
export async function updateOrderStatus(orderId, nextStatus) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the row so concurrent admin updates do not conflict
    const { rows } = await client.query(
      "SELECT status FROM orders WHERE id = $1 FOR UPDATE",
      [orderId]
    );
    const order = rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return { error: "Order not found" };
    }

    const allowed = TRANSITIONS[order.status] || [];
    if (!allowed.includes(nextStatus)) {
      await client.query("ROLLBACK");
      return {
        error: `Cannot move an order from "${order.status}" to "${nextStatus}"`,
      };
    }

    // Cancelling restores stock — regardless of whether order was
    // pending (reserved) or paid (stock already shipped)
    if (nextStatus === "cancelled") {
      await restockOrder(client, orderId);
    }

    await client.query(
      "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
      [nextStatus, orderId]
    );
    await client.query("COMMIT");
    return { status: nextStatus };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}