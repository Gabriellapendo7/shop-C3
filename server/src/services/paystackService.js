import crypto from "node:crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

// Generate a collision-resistant transaction reference.
// Format: order_<uuid> — the prefix makes references immediately identifiable
// in the Paystack dashboard. The UUID guarantees global uniqueness.
// Paystack rejects references that have been used before — never reuse one.
export function generateReference() {
  return `order_${crypto.randomUUID()}`;
}

export async function initializeTransaction({
  email,
  amountInSubunit,
  reference,
  callbackUrl,
  metadata,
  channels,
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountInSubunit,
      reference,
      callback_url: callbackUrl,
      currency: process.env.PAYSTACK_CURRENCY || "KES",
      channels,
      metadata,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack transaction initialize failed");
  }
  return data.data; // { authorization_url, access_code, reference }
}

export async function verifyTransaction(reference) {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey()}` } }
  );

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack transaction verify failed");
  }
  return data.data; // { status, amount, reference, customer, ... }
}

// Fetch recent transactions from Paystack — used by the admin transactions page
// to compare Paystack's records against our database.
// perPage: max 100 per Paystack's API limit.
export async function listTransactions({ perPage = 10, page = 1 } = {}) {
  const url = new URL(`${PAYSTACK_BASE_URL}/transaction`);
  url.searchParams.set("perPage", perPage);
  url.searchParams.set("page", page);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack listTransactions failed");
  }
  return data.data; // Array of transaction objects
}

// Paystack signs webhook bodies with HMAC-SHA512 of the raw request body.
export function isValidWebhookSignature(rawBody, signature) {
  const hash = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}