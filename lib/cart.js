const CART_KEY = "mctaba-cart";
const CART_EVENT = "cartchange";

export function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}
export function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}
export function onCartChange(callback) {
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener(STORAGE, callback);
  };
}
export function getCartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}
export function addToCart(productId, quantity = 1) {
  const items = readCart();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }
  writeCart(items);
  return items;
}
export function updateCartQuantity(productId, quantity) {
  let items = readCart();
  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== productId);
  } else {
    const existing = items.find((i) => i.productId === productId);
    if (existing) existing.quantity = quantity;
  }
  writeCart(items);
  return items;
}

export function clearCart() {
  writeCart([]);
}