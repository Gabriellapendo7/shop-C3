import { Suspense } from "react";
import CheckoutResult from "./CheckoutResult";

export const metadata = {
  title: "Order status",
  robots: { index: false },
};

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem" }}>
          <h1>Checking your payment...</h1>
        </main>
      }
    >
      <CheckoutResult />
    </Suspense>
  );
}
