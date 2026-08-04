import * as orderRepository from "#repositories/orderRepository.js";
import { restockFailedOrder } from "#services/orderLifecycleService.js";

// Shared by the webhook and the verify redirect.
// Must be idempotent — Paystack retries webhooks and both paths
// may run for the same payment.
export async function confirmPayment(reference, paidAmountInSubunit) {
  const order = await orderRepository.findPaymentStateByReference(reference);

  if (!order) {
    console.warn(`Payment confirmation for unknown reference: ${reference}`);
    return;
  }

  // Idempotency guard — if already processed, do nothing
  if (order.status !== "pending") {
    console.log(
      `Duplicate confirmation for ${reference}, already ${order.status}`
    );
    return;
  }

  // Amount verification — never approve if the paid amount differs
  if (paidAmountInSubunit !== order.total_cents) {
    console.error(
      `Amount mismatch for order ${order.id}: ` +
      `expected ${order.total_cents}, got ${paidAmountInSubunit}`
    );
    await orderRepository.updateStatus(order.id, "failed");
    await restockFailedOrder(order.id);
    return;
  }

  // All checks pass — mark as paid
  await orderRepository.updateStatus(order.id, "paid");
}

// Called when Paystack reports failure or the customer abandons payment.
// markPendingAsFailed only matches orders still pending, so a repeat call
// returns no id and we do not restock twice.
export async function markPaymentFailed(reference) {
  const orderId = await orderRepository.markPendingAsFailed(reference);
  if (orderId) {
    await restockFailedOrder(orderId);
  }
}
