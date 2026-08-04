import { pool } from "#infrastructure/db.js";
import * as orderRepository from "#repositories/orderRepository.js";
import * as stockRepository from "#repositories/stockRepository.js";

// Valid transitions for admin-driven status changes.
// Payment-driven transitions (pending → paid/failed) are handled by
// paymentService.js — those come from Paystack, not a human.
export const TRANSITIONS = {
  pending: ["cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  failed: [],
};

// Used by paymentService.js when Paystack reports failure or an amount
// mismatch. Wraps the restock in its own transaction.
export async function restockFailedOrder(orderId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await stockRepository.restockOrder(orderId, client);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Admin-driven status updates with transition validation and automatic
// restocking when cancelling a paid or pending order.
// Business rejections come back as { error, httpStatus } so the caller maps them
// to a response; unexpected failures throw.
export async function updateOrderStatus(orderId, nextStatus) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const order = await orderRepository.findStatusByIdForUpdate(orderId, client);
    if (!order) {
      await client.query("ROLLBACK");
      return { error: "Order not found", httpStatus: 404 };
    }

    const allowed = TRANSITIONS[order.status] || [];
    if (!allowed.includes(nextStatus)) {
      await client.query("ROLLBACK");
      return {
        error: `Cannot move an order from "${order.status}" to "${nextStatus}"`,
        httpStatus: 409,
      };
    }

    // Cancelling restores stock — regardless of whether the order was
    // pending (reserved) or paid (stock already shipped)
    if (nextStatus === "cancelled") {
      await stockRepository.restockOrder(orderId, client);
    }

    await orderRepository.updateStatus(orderId, nextStatus, client);
    await client.query("COMMIT");
    return { status: nextStatus };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
