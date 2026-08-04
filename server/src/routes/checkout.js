import { Router } from "express";
import { asyncHandler } from "#middleware/asyncHandler.js";
import {
  createCheckout,
  isSupportedChannel,
} from "#services/checkoutService.js";

export const checkoutRouter = Router();

checkoutRouter.post("/", asyncHandler(async (req, res) => {
  const { items, customer, paymentChannel } = req.body;

  // ── Validate incoming data ─────────────────────────────────────────────────
  const trimmed = {
    name: customer?.name?.trim(),
    email: customer?.email?.trim(),
    phone: customer?.phone?.trim(),
    address: customer?.address?.trim(),
  };

  if (!trimmed.name || !trimmed.email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!isSupportedChannel(paymentChannel)) {
    return res.status(400).json({ error: "Choose a valid payment option" });
  }

  // ── Reserve stock, create the order, initialise Paystack ────────────────────
  const result = await createCheckout({
    items,
    customer: trimmed,
    paymentChannel,
  });

  if (result.error) {
    return res.status(result.httpStatus).json({ error: result.error });
  }

  res.json({
    authorizationUrl: result.authorizationUrl,
    reference: result.reference,
  });
}));
