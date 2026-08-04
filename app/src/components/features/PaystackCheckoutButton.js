"use client";

export default function PaystackCheckoutButton({ pending }) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: "#00C3F7",
        color: "#000",
        fontWeight: 600,
        padding: "0.75rem 1.5rem",
        borderRadius: 4,
        border: "none",
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.7 : 1,
        fontSize: "1rem",
        width: "100%",
      }}
    >
      {pending ? "Redirecting to Paystack..." : "Pay with Paystack"}
    </button>
  );
}