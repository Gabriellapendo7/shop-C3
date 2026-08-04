import * as orderRepository from "#repositories/orderRepository.js";
import { listTransactions } from "#services/paystackService.js";

// Reconciles Paystack's record of recent transactions against ours.
// A mismatch means Paystack took the money but our order never reached 'paid' —
// usually a dropped webhook, occasionally a bug in the verification flow.
export async function reconcileTransactions({ perPage, page }) {
  const paystackTransactions = await listTransactions({ perPage, page });

  const references = paystackTransactions.map((t) => t.reference);
  const orders = references.length
    ? await orderRepository.findByReferences(references)
    : [];

  // Index by reference for O(1) lookup while merging
  const ordersByRef = Object.fromEntries(
    orders.map((o) => [o.paystack_reference, o])
  );

  return paystackTransactions.map((t) => {
    const order = ordersByRef[t.reference];
    return {
      reference: t.reference,
      email: t.customer?.email,
      paystackAmount: t.amount,
      paystackStatus: t.status,
      paidAt: t.paid_at,
      dbStatus: order?.status ?? null,
      dbTotal: order?.total_cents ?? null,
      mismatch: Boolean(
        order && t.status === "success" && order.status !== "paid"
      ),
    };
  });
}
