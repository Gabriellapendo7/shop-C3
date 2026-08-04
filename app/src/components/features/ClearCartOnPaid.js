
"use client";

import { useEffect } from "react";
import { clearCart } from "@/src/services/cart";

export default function ClearCartOnPaid({ paid }) {
  useEffect(() => {
    if (paid) clearCart();
  }, [paid]);

  return null;
}