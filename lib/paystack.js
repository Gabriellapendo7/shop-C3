// Frontend utilities for Paystack values.
// These functions run in the browser — no secret keys, no API calls.

// Format an amount in subunits (cents) as a KSh string.
// Used anywhere we display a Paystack amount directly.
// Equivalent to what we do inline throughout the app — centralised here
// so changing currency formatting means changing one function.
export function formatAmount(amountInSubunit) {
  return `KSh ${(amountInSubunit / 100).toLocaleString("en-KE")}`;
}

// Truncate a Paystack reference for display.
// "order_a3b8c1d2-e4f5-6789-abcd-ef0123456789" → "order_a3b8c1d2…"
export function shortReference(reference, length = 20) {
  if (!reference) return "";
  return reference.length > length
    ? reference.slice(0, length) + "…"
    : reference;
}

// Paystack transaction status values and their display properties.
export const TRANSACTION_STATUS = {
  success: { label: "Paid", color: "#2f855a" },
  failed: { label: "Failed", color: "#c53030" },
  abandoned: { label: "Abandoned", color: "#c05621" },
  pending: { label: "Pending", color: "#666" },
};

// Display config for a Paystack transaction status.
export function transactionStatusDisplay(status) {
  return TRANSACTION_STATUS[status] ?? { label: status, color: "#666" };
}