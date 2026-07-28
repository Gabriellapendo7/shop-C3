export default function CartSummary({ subtotalCents }) {
  return (
    <div style={{ marginTop: "1.5rem", textAlign: "right", fontSize: "1.1rem" }}>
      <strong>Subtotal: KSh {(subtotalCents / 100).toLocaleString()}</strong>
    </div>
  );
}