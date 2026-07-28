"use client";

const BUTTON = {
  width: 32,
  height: 32,
  padding: 0,
  border: "1px solid #ddd",
  borderRadius: 4,
  background: "#fff",
  color: "#000",
  fontSize: "1.1rem",
  lineHeight: 1,
  cursor: "pointer",
};

// Emits a delta (-1 / +1) rather than an absolute quantity: the caller resolves it
// against the stored cart, so rapid clicks can't drop a step on a stale render.
export default function QuantityStepper({ quantity, productName, onStep }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <button
        type="button"
        onClick={() => onStep(-1)}
        aria-label={
          quantity <= 1
            ? `Remove ${productName} from cart`
            : `Decrease quantity of ${productName}`
        }
        style={BUTTON}
      >
        −
      </button>

      <span
        aria-live="polite"
        aria-label={`Quantity for ${productName}`}
        style={{
          minWidth: 24,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => onStep(1)}
        aria-label={`Increase quantity of ${productName}`}
        style={BUTTON}
      >
        +
      </button>
    </div>
  );
}
