export default function HomePage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
      <h1>Welcome to Mctaba Shop</h1>
      <p style={{ color: "#444", marginTop: "0.5rem", lineHeight: 1.6 }}>
        We sell good things at fair prices. Phones, accessories, and more.
      </p>
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <a
          href="/products"
          style={{
            background: "#000",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: 4,
            fontWeight: 500,
          }}
        >
          Browse Products
        </a>
        <a
          href="/about"
          style={{
            border: "1px solid #000",
            padding: "0.75rem 1.5rem",
            borderRadius: 4,
            fontWeight: 500,
          }}
        >
          About Us
        </a>
      </div>

      <p style={{ marginTop: "3rem", fontSize: "0.8rem", color: "#999" }}>
        Page rendered at: {new Date().toLocaleTimeString()}
      </p>
    </main>
  );
}