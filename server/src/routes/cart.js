import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler } from "../asyncHandler.js";

export const cartRouter = Router();

// Prices a cart the client is holding in localStorage.
// Never trust client-sent prices — look up current price_cents
// from the products table for every line item.
cartRouter.post("/price", asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];

  if (items.length === 0) {
    return res.json({ lines: [], subtotalCents: 0 });
  }

  const ids = items.map((i) => i.productId);
  const { rows: products } = await query(
    "SELECT id, slug, name, price_cents, image_url, stock FROM products WHERE id = ANY($1)",
    [ids]
  );

  const lines = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        lineTotalCents: product.price_cents * item.quantity,
      };
    })
    .filter(Boolean);

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  res.json({ lines, subtotalCents });
}));