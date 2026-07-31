
"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

export default function ClearCartOnPaid({ paid }) {
  useEffect(() => {
    if (paid) clearCart();
  }, [paid]);

  return null;
}