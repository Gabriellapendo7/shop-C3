"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

export default function AddToCartButton({ productId, stock }) {
  const [added, setAdded] = useState(false);

  function handleClick() {
    addToCart(productId, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={stock === 0}
      style={{
        background: "#000",
        color: "#fff",
        padding: "0.75rem 1.5rem",
        borderRadius: 4,
        border: "none",
        cursor: stock === 0 ? "default" : "pointer",
        opacity: stock === 0 ? 0.5 : 1,
        fontSize: "1rem",
      }}
    >
      {stock === 0 ? "Out of stock" : added ? "Added!" : "Add to cart"}
    </button>
  );
}