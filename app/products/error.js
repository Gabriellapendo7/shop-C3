"use client";

export default function ProductsError({ error, reset }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 0" }}>
      <h1>Something went wrong</h1>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>
        {error.message || "Please try again."}
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: "1.5rem",
          background: "#000",
          color: "#fff",
          padding: "0.6rem 1.2rem",
          borderRadius: 4,
          border: "none",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}