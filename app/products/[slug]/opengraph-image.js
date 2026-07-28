import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }) {
  const { slug } = await params;

  let product;
  try {
    ({ product } = await apiFetch(`/api/products/${slug}`));
  } catch {
    product = { name: "Mctaba Shop", price_cents: 0 };
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-1px",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {product.name}
        </div>

        {product.price_cents > 0 && (
          <div
            style={{
              display: "flex",
              fontSize: 36,
              marginTop: 24,
              color: "#aaaaaa",
            }}
          >
            {`KSh ${(product.price_cents / 100).toLocaleString()}`}
          </div>
        )}

        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 40,
            fontSize: 22,
            color: "#555555",
            letterSpacing: "2px",
          }}
        >
          MCTABA SHOP
        </div>
      </div>
    ),
    { ...size }
  );
}