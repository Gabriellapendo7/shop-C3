// Add this import at the top of admin.js
import { listTransactions } from "../services/paystackService.js";

// Add this route inside adminRouter (after the existing routes)
adminRouter.get("/transactions", requireAdmin, asyncHandler(async (req, res) => {
  const perPage = Math.min(parseInt(req.query.perPage, 10) || 10, 50);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  // Fetch from Paystack
  const paystackTransactions = await listTransactions({ perPage, page });

  // For each Paystack transaction, find the matching order in our database
  const references = paystackTransactions.map((t) => t.reference);
  const { rows: orders } = await query(
    `SELECT paystack_reference, status, total_cents
     FROM orders WHERE paystack_reference = ANY($1)`,
    [references]
  );

  // Map DB orders by reference for O(1) lookup
  const ordersByRef = Object.fromEntries(
    orders.map((o) => [o.paystack_reference, o])
  );

  // Merge Paystack data with DB data
  const transactions = paystackTransactions.map((t) => ({
    reference: t.reference,
    email: t.customer?.email,
    paystackAmount: t.amount,
    paystackStatus: t.status,
    paidAt: t.paid_at,
    dbStatus: ordersByRef[t.reference]?.status ?? null,
    dbTotal: ordersByRef[t.reference]?.total_cents ?? null,
    mismatch:
      ordersByRef[t.reference] &&
      t.status === "success" &&
      ordersByRef[t.reference].status !== "paid",
  }));

  res.json({ transactions, page, perPage });
}));