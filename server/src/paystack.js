import crypto from "node:crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

// amountInSubunit: amount in the smallest currency unit (kobo/cents) —
// matches price_cents in the products table.
// channels restricts which payment methods Paystack's hosted page offers.
// In Kenya, "mobile_money" covers both M-Pesa and Airtel Money.
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
    {
      headers: { Authorization: `Bearer ${secretKey()}` },
    }
  );

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack transaction verify failed");
  }
  return data.data; // { status: 'success' | 'failed', amount, reference, ... }
}

export function isValidWebhookSignature(rawBody, signature) {
  const hash = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}