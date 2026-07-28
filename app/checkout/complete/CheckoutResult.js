"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearCart } from "@/lib/cart";

const MESSAGES = {
  success: {
    heading: "Payment received",
    body: "Thank you — your order is confirmed. A receipt is on its way to your email.",
    tone: "#0a7d33",
  },
  pending: {
    heading: "Payment is processing",
    body: "We're waiting for your provider to confirm. This usually takes under a minute — approve the prompt on your phone if you haven't already.",
    tone: "#9a6700",
  },
  failed: {
    heading: "Payment was not completed",
    body: "Nothing has been charged and your items have been returned to stock. You can try again whenever you're ready.",
    tone: "#b42318",
  },
  error: {
    heading: "We couldn't confirm your payment",
    body: "If money left your account, don't pay again — contact us with your reference below and we'll sort it out.",
    tone: "#b42318",
  },
  invalid: {
    heading: "Nothing to show here",
    body: "This page is shown after a payment. It looks like you arrived without one.",
    tone: "#666",
  },
};

export default function CheckoutResult() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState(searchParams.get("status") || "invalid");

  // The cart lives in localStorage, so the server can't clear it for us.
  useEffect(() => {
    if (status === "success") clearCart();
  }, [status]);

  // Mobile money often reports 'pending' at redirect time. Poll until the
  // webhook or the provider settles it, rather than leaving the customer stuck.
  useEffect(() => {
    if (status !== "pending" || !reference) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const order = await apiFetch(`/api/paystack/status/${reference}`);
        if (cancelled || order.status === "pending") return;
        setStatus(order.status === "paid" ? "success" : "failed");
      } catch {
        // Transient — keep polling until the timeout below stops us.
      }
    }, 4000);

    const timeout = setTimeout(() => clearInterval(interval), 120000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, reference]);

  const { heading, body, tone } = MESSAGES[status] || MESSAGES.invalid;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ color: tone }}>{heading}</h1>
      <p style={{ color: "#444", marginTop: "0.75rem", lineHeight: 1.5 }}>
        {body}
      </p>

      {reference && (
        <p style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "#666" }}>
          Reference:{" "}
          <code style={{ background: "#f5f5f5", padding: "0.2rem 0.4rem", borderRadius: 3 }}>
            {reference}
          </code>
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem", flexWrap: "wrap" }}>
        <Link
          href="/products"
          style={{
            background: "#000",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: 4,
          }}
        >
          Continue shopping
        </Link>

        {(status === "failed" || status === "error") && (
          <Link
            href="/checkout"
            style={{
              border: "1px solid #ddd",
              color: "#000",
              padding: "0.75rem 1.5rem",
              borderRadius: 4,
            }}
          >
            Try again
          </Link>
        )}
      </div>
    </main>
  );
}
