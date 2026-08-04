import { Router } from "express";
import { asyncHandler } from "#middleware/asyncHandler.js";
import { priceCart } from "#services/cartService.js";

export const cartRouter = Router();

cartRouter.post("/price", asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  res.json(await priceCart(items));
}));
