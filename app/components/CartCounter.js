"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCartCount, onCartChange } from "@/lib/cart";

export default function CartCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Set initial count when the component mounts in the browser
    setCount(getCartCount());

    // Subscribe to cart changes and return the cleanup function
    return onCartChange(() => setCount(getCartCount()));
  }, []);

  return (
    <Link href="/cart" style={{ color: "inherit" }}>
      Cart{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}