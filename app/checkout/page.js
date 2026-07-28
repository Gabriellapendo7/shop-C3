"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { readCart } from "@/lib/cart";
import CartSummary from "@/app/components/CartSummary";
import PaystackCheckoutButton from "@/app/components/PaystackCheckoutButton";

export default function CheckoutPage() {
  const [lines, setLines] = useState([]);
  const [subtotalCents, setSubtotalCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [paymentChannel, setPaymentChannel] = useState("mobile_money");

  useEffect(() => {
    const items = readCart();
    apiFetch("/api/cart/price", {
      method: "POST",
      body: JSON.stringify({ items }),
    })
      .then((priced) => {
        setLines(priced.lines);
        setSubtotalCents(priced.subtotalCents);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.target);
    const items = readCart();

    try {
      const { authorizationUrl } = await apiFetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          items,
          customer: {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            address: form.get("address"),
          },
          paymentChannel,
        }),
      });

      // Redirect to Paystack's hosted checkout page
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem" }}>
        <h1>Checkout</h1>
        <p style={{ color: "#666", marginTop: "1rem" }}>Loading your cart...</p>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem" }}>
        <h1>Nothing to check out</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          Your cart is empty. Add some products first.
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
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem" }}>
      <h1>Checkout</h1>

      {/* Order summary */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Your order</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {lines.map(({ product, quantity, lineTotalCents }) => (
            <li
              key={product.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.4rem 0",
                fontSize: "0.9rem",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span>
                {product.name} &times; {quantity}
              </span>
              <span>KSh {(lineTotalCents / 100).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <CartSummary subtotalCents={subtotalCents} />
      </section>

      {/* Customer information form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "1rem" }}
      >
        <h2 style={{ fontSize: "1rem", margin: 0 }}>Your details</h2>

        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.9rem" }}>
          Full name *
          <input
            name="name"
            required
            autoComplete="name"
            style={{
              padding: "0.6rem",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: "1rem",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.9rem" }}>
          Email address *
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            style={{
              padding: "0.6rem",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: "1rem",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.9rem" }}>
          Phone number
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+254 7XX XXX XXX"
            style={{
              padding: "0.6rem",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: "1rem",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.9rem" }}>
          Shipping address
          <textarea
            name="address"
            rows={3}
            autoComplete="street-address"
            placeholder="Building, Street, Area, City"
            style={{
              padding: "0.6rem",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: "1rem",
              resize: "vertical",
            }}
          />
        </label>

        {/* Payment method selector */}
        <fieldset
          style={{
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: "1rem",
            margin: 0,
          }}
        >
          <legend style={{ padding: "0 0.4rem", fontSize: "0.9rem" }}>
            Payment method
          </legend>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "0.6rem",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="paymentChannel"
              value="mobile_money"
              checked={paymentChannel === "mobile_money"}
              onChange={() => setPaymentChannel("mobile_money")}
            />
            M-Pesa / Airtel Money
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="paymentChannel"
              value="card"
              checked={paymentChannel === "card"}
              onChange={() => setPaymentChannel("card")}
            />
            Debit / Credit card
          </label>

          <p
            style={{
              fontSize: "0.8rem",
              color: "#666",
              marginTop: "0.75rem",
              marginBottom: 0,
            }}
          >
            Payment is processed securely by Paystack. You will be redirected
            to complete payment on the next screen.
          </p>
        </fieldset>

        {error && (
          <p
            style={{
              color: "crimson",
              background: "#fff5f5",
              border: "1px solid #fecaca",
              borderRadius: 4,
              padding: "0.75rem",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            {error}
          </p>
        )}

        <PaystackCheckoutButton pending={submitting} />

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#666" }}>
          <Link href="/cart">← Back to cart</Link>
        </p>
      </form>
    </main>
  );
}