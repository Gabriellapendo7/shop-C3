import { pool } from "#infrastructure/db.js";
import * as orderRepository from "#repositories/orderRepository.js";
import * as productRepository from "#repositories/productRepository.js";
import * as stockRepository from "#repositories/stockRepository.js";
import {
  initializeTransaction,
  generateReference,
} from "#services/paystackService.js";

// Maps our UI's payment choice to the Paystack channels array.
// "mobile_money" is one Paystack channel covering both M-Pesa and Airtel Money —
// the customer picks their specific network on Paystack's own hosted page.
const CHANNELS_BY_PAYMENT_CHANNEL = {
  card: ["card"],
  mobile_money: ["mobile_money"],
};

export function isSupportedChannel(paymentChannel) {
  return Boolean(CHANNELS_BY_PAYMENT_CHANNEL[paymentChannel]);
}

// Reserves stock and creates the order, then hands off to Paystack.
// Business rejections come back as { error, httpStatus } so the route maps them
// to a response; anything unexpected throws to the error middleware.
export async function createCheckout({ items, customer, paymentChannel }) {
  const reference = generateReference();

  // BEGIN, COMMIT and ROLLBACK are connection-scoped, so all three must run on
  // the same client — hence pool.connect() rather than a pooled query.
  const client = await pool.connect();
  let orderId;
  let subtotalCents;

  try {
    await client.query("BEGIN");

    // Re-price server-side — never trust client-sent prices. findByIdsForUpdate
    // also locks the rows for the rest of this transaction.
    const ids = items.map((i) => i.productId);
    const products = await productRepository.findByIdsForUpdate(ids, client);

    // Build line items using server prices, not client prices
    const lines = items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          product,
          quantity: item.quantity,
          unitPriceCents: product.price_cents,
        };
      })
      .filter(Boolean);

    if (lines.length === 0) {
      await client.query("ROLLBACK");
      return { error: "No valid items in cart", httpStatus: 400 };
    }

    // Check every line against current stock
    const insufficient = lines.find((l) => l.quantity > l.product.stock);
    if (insufficient) {
      await client.query("ROLLBACK");
      return {
        error: `Not enough stock for ${insufficient.product.name} — ${insufficient.product.stock} available, ${insufficient.quantity} requested`,
        httpStatus: 409,
      };
    }

    subtotalCents = lines.reduce(
      (sum, l) => sum + l.unitPriceCents * l.quantity,
      0
    );

    orderId = await orderRepository.insertOrder(
      { reference, ...customer, paymentChannel, totalCents: subtotalCents },
      client
    );

    // One order_item row per line, decrementing stock as we go
    for (const line of lines) {
      await orderRepository.insertOrderItem(
        {
          orderId,
          productId: line.product.id,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        },
        client
      );
      await stockRepository.decrement(line.product.id, line.quantity, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    // Always release — even if COMMIT or ROLLBACK itself threw
    client.release();
  }

  // Runs AFTER the database transaction commits. If Paystack fails here the
  // order already exists as 'pending' with stock reserved, so we must restock
  // and mark it failed before propagating.
  try {
    const { authorization_url } = await initializeTransaction({
      email: customer.email,
      amountInSubunit: subtotalCents,
      reference,
      // No query string here — Paystack appends ?trxref=…&reference=… itself.
      // Adding our own would make `reference` arrive twice and parse as an array.
      callbackUrl: `${process.env.API_URL}/api/paystack/verify`,
      channels: CHANNELS_BY_PAYMENT_CHANNEL[paymentChannel],
      metadata: { orderId },
    });

    return { authorizationUrl: authorization_url, reference };
  } catch (err) {
    await stockRepository.restockOrder(orderId);
    await orderRepository.updateStatus(orderId, "failed");
    throw err;
  }
}
