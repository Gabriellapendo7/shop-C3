"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { readCart, updateCartQuantity, clearCart } from "@/lib/cart";
import CartSummary from "@/app/components/CartSummary";
import QuantityStepper from "@/app/components/QuantityStepper";

export default function CartPage() {
  const [lines, setLines] = useState([]);
  const [subtotalCents, setSubtotalCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const latestRequest = useRef(0);

  async function refresh() {
    const requestId = ++latestRequest.current;
    const items = readCart();
    const priced = await apiFetch("/api/cart/price", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
    // A newer refresh started while this one was in flight, so its result is
    // already stale — dropping it keeps fast clicks from rewinding the total.
    if (requestId !== latestRequest.current) return;
    setLines(priced.lines);
    setSubtotalCents(priced.subtotalCents);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  // delta is -1 or +1. The stored cart is the source of truth for the current
  // quantity, so a burst of clicks still lands on the right number even when
  // React has not re-rendered between them.
  function handleStep(productId, delta) {
    const stored = readCart().find((item) => item.productId === productId);
    const quantity = (stored?.quantity ?? 0) + delta;

    updateCartQuantity(productId, quantity);

    // Show the new figures straight away; refresh() then reconciles against
    // server-authoritative pricing.
    const next =
      quantity <= 0
        ? lines.filter((line) => line.product.id !== productId)
        : lines.map((line) =>
            line.product.id === productId
              ? {
                  ...line,
                  quantity,
                  lineTotalCents: line.product.price_cents * quantity,
                }
              : line
          );

    setLines(next);
    setSubtotalCents(next.reduce((sum, line) => sum + line.lineTotalCents, 0));

    refresh();
  }

  function handleClear() {
    clearCart();
    setLines([]);
    setSubtotalCents(0);
    refresh();
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
        <h1>Your cart</h1>
        <p style={{ color: "#666", marginTop: "1rem" }}>Loading...</p>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
        <h1>Your cart is empty</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          You have not added anything yet.
        </p>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            background: "#000",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: 4,
          }}
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
      <h1>Your cart</h1>

      <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0" }}>
        {lines.map(({ product, quantity, lineTotalCents }) => (
          <li
            key={product.id}
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              padding: "1rem 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{product.name}</div>
              <div style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                KSh {(product.price_cents / 100).toLocaleString()} each
              </div>
            </div>

            <QuantityStepper
              quantity={quantity}
              productName={product.name}
              onStep={(delta) => handleStep(product.id, delta)}
            />

            <div style={{ width: 100, textAlign: "right", fontWeight: 500 }}>
              KSh {(lineTotalCents / 100).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>

      <CartSummary subtotalCents={subtotalCents} />

      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", alignItems: "center" }}>
        <Link
          href="/checkout"
          style={{
            background: "#000",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: 4,
            fontWeight: 500,
          }}
        >
          Proceed to checkout
        </Link>
        <button
          onClick={handleClear}
          style={{
            background: "none",
            border: "none",
            color: "#666",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Clear cart
        </button>
      </div>
    </main>
  );
}