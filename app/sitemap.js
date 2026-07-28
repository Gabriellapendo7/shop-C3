import { apiFetch } from "@/lib/api";

export default async function sitemap() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes = ["", "/products", "/about", "/contact"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
    })
  );

  let productRoutes = [];
  try {
    const { products } = await apiFetch("/api/products");
    productRoutes = products.map((p) => ({
      url: `${siteUrl}/products/${p.slug}`,
      lastModified: new Date(),
    }));
  } catch {
    // If the API is down during sitemap generation, return static routes only.
    // A partial sitemap is better than no sitemap.
  }

  return [...staticRoutes, ...productRoutes];
}