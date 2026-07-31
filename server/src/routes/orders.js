import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler } from "../asyncHandler.js";

export const ordersRouter = Router();

ordersRouter.get("/:reference", asyncHandler(async (req, res) => {
  // Fetch the order
  const { rows } = await query(
    `SELECT id, paystack_reference, customer_name, customer_email,
            payment_channel, status, total_cents, created_at
     FROM orders
     WHERE paystack_reference = $1`,
    [req.params.reference]
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: "Order not found" });

  // Fetch the order's line items with product names
  const { rows: items } = await query(
    `SELECT oi.quantity, oi.unit_price_cents, p.name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [order.id]
  );

  res.json({ order, items });
}));