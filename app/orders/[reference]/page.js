import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import ClearCartOnPaid from "@/app/components/ClearCartOnPaid";

// Status-aware copy — what to show for each order state
const STATUS_COPY = {
  pending: {
    heading: "Payment pending",
    detail:
      "We have not received confirmation from Paystack yet. " +
      "This usually resolves within a minute. Refresh the page to check.",
  },
  paid: {
    heading: "Payment confirmed",
    detail: "Thank you — your order is confirmed and will be processed shortly.",
  },
  failed: {
    heading: "Payment failed",
    detail:
      "The payment did not go through. Your cart has been restored. " +
      "You can try checking out again.",
  },
  cancelled: {
    heading: "Order cancelled",
    detail: "This order was cancelled.",
  },
};

// Human-readable labels for payment channels
const PAYMENT_CHANNEL_LABEL = {
  card: "Card",
  mobile_money: "M-Pesa / Airtel Money",
};

export default async function OrderPage({ params }) {
  const { reference } = await params;

  let order, items;
  try {
    ({ order, items } = await apiFetch(`/api/orders/${reference}`));
  } catch {
    notFound();
  }

  const copy = STATUS_COPY[order.status] ?? STATUS_COPY.pending;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem" }}>

      {/* Side effect: clear localStorage cart when order is paid */}
      <ClearCartOnPaid paid={order.status === "paid"} />

      <h1 style={{ margin: "0 0 0.5rem" }}>{copy.heading}</h1>
      <p style={{ color: "#555", lineHeight: 1.6, margin: "0 0 2rem" }}>
        {copy.detail}
      </p>

      {/* Order metadata */}
      <dl style={{ margin: "0 0 1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", padding: "0.4rem 0", borderBottom: "1px solid #f0f0f0" }}>
          <dt style={{ fontWeight: 600, minWidth: 140 }}>Reference</dt>
          <dd style={{ margin: 0, color: "#555", fontSize: "0.9rem", wordBreak: "break-all" }}>
            {order.paystack_reference}
          </dd>
        </div>
        <div style={{ display: "flex", gap: "1rem", padding: "0.4rem 0", borderBottom: "1px solid #f0f0f0" }}>
          <dt style={{ fontWeight: 600, minWidth: 140 }}>Status</dt>
          <dd style={{ margin: 0, textTransform: "capitalize" }}>{order.status}</dd>
        </div>
        <div style={{ display: "flex", gap: "1rem", padding: "0.4rem 0", borderBottom: "1px solid #f0f0f0" }}>
          <dt style={{ fontWeight: 600, minWidth: 140 }}>Payment method</dt>
          <dd style={{ margin: 0 }}>
            {PAYMENT_CHANNEL_LABEL[order.payment_channel] ?? order.payment_channel}
          </dd>
        </div>
        <div style={{ display: "flex", gap: "1rem", padding: "0.4rem 0", borderBottom: "1px solid #f0f0f0" }}>
          <dt style={{ fontWeight: 600, minWidth: 140 }}>Name</dt>
          <dd style={{ margin: 0 }}>{order.customer_name}</dd>
        </div>
      </dl>

      {/* Order items */}
      <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>Items ordered</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.5rem 0",
              borderBottom: "1px solid #eee",
              fontSize: "0.95rem",
            }}
          >
            <span>
              {item.name} &times; {item.quantity}
            </span>
            <span>
              KSh {((item.unit_price_cents * item.quantity) / 100).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      <p style={{ textAlign: "right", fontWeight: 600, margin: "0 0 2rem" }}>
        Total: KSh {(order.total_cents / 100).toLocaleString()}
      </p>

      <div style={{ display: "flex", gap: "1rem" }}>
        <Link
          href="/products"
          style={{
            background: "#000",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: 4,
            fontWeight: 500,
          }}
        >
          Continue shopping
        </Link>
        {order.status === "failed" && (
          <Link
            href="/cart"
            style={{
              border: "1px solid #000",
              padding: "0.75rem 1.5rem",
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            Back to cart
          </Link>
        )}
      </div>
    </main>
  );
}