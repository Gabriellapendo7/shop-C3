import { Router } from "express";
import { asyncHandler } from "#middleware/asyncHandler.js";
import * as productRepository from "#repositories/productRepository.js";

// These reads carry no business logic, so they go straight to the repository —
// a pass-through service would only add indirection.
export const productsRouter = Router();

// IMPORTANT: This route must be registered BEFORE "/:slug".
// Express matches routes in the order they are defined.
// Without this, a request to /api/products/categories would be caught
// by /:slug and treated as a product lookup for slug "categories".
productsRouter.get("/categories", asyncHandler(async (req, res) => {
  const categories = await productRepository.findCategories();
  res.json({ categories });
}));

// Supports ?category= filter, used by /products/category/[cat]
productsRouter.get("/", asyncHandler(async (req, res) => {
  const products = await productRepository.findAll({
    category: req.query.category,
  });
  res.json({ products });
}));

// Single product by slug — must come AFTER /categories
productsRouter.get("/:slug", asyncHandler(async (req, res) => {
  const product = await productRepository.findBySlug(req.params.slug);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
}));
