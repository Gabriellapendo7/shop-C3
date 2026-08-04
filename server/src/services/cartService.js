import * as productRepository from "#repositories/productRepository.js";

// Prices a cart the client is holding in localStorage.
// Never trust client-sent prices — look up current price_cents from the products
// table for every line item. Items whose product no longer exists are dropped.
export async function priceCart(items) {
  if (items.length === 0) {
    return { lines: [], subtotalCents: 0 };
  }

  const ids = items.map((i) => i.productId);
  const products = await productRepository.findByIds(ids);

  const lines = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        lineTotalCents: product.price_cents * item.quantity,
      };
    })
    .filter(Boolean);

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  return { lines, subtotalCents };
}
