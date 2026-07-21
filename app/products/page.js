import { apiFetch } from "@/lib/api";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  let products = [];
  let error = null;

  try {
    const data = await apiFetch("/api/products");
    products = data.products;
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
        <h1>All Products</h1>
        <div style={{
          marginTop: "1.5rem",
          padding: "1.5rem",
          background: "#fff5f5",
          border: "1px solid #fecaca",
          borderRadius: 8,
          color: "#991b1b",
        }}>
          <strong>Unable to load products.</strong>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Please try again in a moment. If the problem persists, contact support.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <h1>All Products</h1>

      {products.length === 0 ? (
        <p style={{ color: "#666", marginTop: "1.5rem" }}>No products yet.</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}>
          {products.map((p) => (
            <div key={p.id} style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                color: "#999",
              }}>
                {p.name}
              </div>
              <div style={{ padding: "0.75rem" }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                  KSh {(p.price_cents / 100).toLocaleString()}
                </div>
                {p.stock === 0 && (
                  <div style={{ color: "crimson", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    Out of stock
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}