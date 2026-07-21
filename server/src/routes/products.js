import { Router } from "express";
import { query } from "../db.js";
import { asyncHandler } from "../asyncHandler.js";

export const productsRouter = Router();

// IMPORTANT: This route must be registered BEFORE "/:slug".
// Express matches routes in the order they are defined.
// Without this, a request to /api/products/categories would be caught
// by /:slug and treated as a product lookup for slug "categories".
productsRouter.get("/categories", asyncHandler(async (req, res) => {
  const { rows } = await query(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category"
  );
  res.json({ categories: rows.map((r) => r.category) });
}));

// Supports ?category= filter, used by /products/category/[cat]
productsRouter.get("/", asyncHandler(async (req, res) => {
  const { category } = req.query;
  const conditions = [];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query(
    `SELECT id, slug, name, price_cents, image_url, stock, category
     FROM products ${where} ORDER BY created_at DESC`,
    params
  );
  res.json({ products: rows });
}));

// Single product by slug — must come AFTER /categories
productsRouter.get("/:slug", asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, name, description, price_cents, image_url, stock, category
     FROM products WHERE slug = $1`,
    [req.params.slug]
  );
  const product = rows[0];
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
}));