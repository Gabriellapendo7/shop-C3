"use client";

import { useEffect } from "react";

// Dev-only: logs accessibility violations to the browser console. Never runs in production —
// axe-core instruments every render, which is far too slow to ship.
export default function AxeDevtools() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Promise.all([import("react"), import("react-dom"), import("@axe-core/react")]).then(
      ([React, ReactDOM, axe]) => {
        // axe monkey-patches createElement, so it needs the underlying CommonJS
        // exports object (.default) — the ESM namespace wrapper is getter-only.
        axe.default(React.default, ReactDOM.default, 1000);
      }
    );
  }, []);

  return null;
}
