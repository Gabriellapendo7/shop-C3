import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AddToCartButton from "@/app/components/AddToCartButton";

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
    openGraph: {
      title: product.name,
      description: `KSh ${(product.price_cents / 100).toLocaleString()} — ${product.description}`,
      // No `images` key needed here.
      // Next.js automatically wires the sibling opengraph-image.js output
      // as the og:image for this page. Adding `images` here would override it.
    },
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

        {/* <div style={{
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
        </div> */}
        
      <img
        src={product.image_url}
       
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          objectFit: "cover",
          borderRadius: 8,
          display: "block",
        }}
      />

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
            <AddToCartButton productId={product.id} stock={product.stock} />
          </div>
        </div>
      </div>
    </div>
  );
}