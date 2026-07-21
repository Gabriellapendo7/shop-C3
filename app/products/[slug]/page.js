import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export const revalidate = 60;

export async function generateStaticParams() {
  const { products } = await apiFetch("/api/products");
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  let product;
  try {
    ({ product } = await apiFetch(`/api/products/${slug}`));
  } catch {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  let product;
  try {
    ({ product } = await apiFetch(`/api/products/${slug}`));
  } catch {
    notFound();
  }

  return (
    <div>
      <nav style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1.5rem" }}>
        <Link href="/products">Products</Link>
        {" / "}
        {product.name}
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

        <div style={{
          width: "100%",
          aspectRatio: "1 / 1",
          background: "#f5f5f5",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
          fontSize: "0.9rem",
        }}>
          {product.name}
        </div>

        <div>
          <h1 style={{ margin: 0 }}>{product.name}</h1>

          <p style={{ fontSize: "1.4rem", marginTop: "0.5rem", marginBottom: 0 }}>
            KSh {(product.price_cents / 100).toLocaleString()}
          </p>

          {product.stock > 0 ? (
            <p style={{ color: "#2f855a", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              In stock ({product.stock} available)
            </p>
          ) : (
            <p style={{ color: "crimson", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Out of stock
            </p>
          )}

          <p style={{ marginTop: "1rem", color: "#444", lineHeight: 1.6 }}>
            {product.description}
          </p>

          <div style={{ marginTop: "1.5rem" }}>
            <button
              disabled={product.stock === 0}
              style={{
                background: "#000",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                borderRadius: 4,
                border: "none",
                cursor: product.stock === 0 ? "default" : "pointer",
                opacity: product.stock === 0 ? 0.5 : 1,
                fontSize: "1rem",
              }}
            >
              {product.stock === 0 ? "Out of stock" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}