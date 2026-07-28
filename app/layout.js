import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AxeDevtools from "@/app/components/AxeDevtools";
import CartCounter from "@/app/components/CartCounter";
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "Shop",
    template: "%s | Mctaba Shop",
  },
  description: "A fullstack shop with Paystack checkout",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          margin: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <header style={{ borderBottom: "1px solid #eee" }}>
          <nav
            style={{
              maxWidth: 900,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 2rem",
            }}
          >
            <Link
              href="/"
              style={{
                fontWeight: 700,
                fontSize: "1.1rem",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Mctaba Shop
            </Link>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/products" style={{ color: "inherit" }}>
                Products
              </Link>
              <CartCounter />
              <Link href="/about" style={{ color: "inherit" }}>
                About
              </Link>
              <Link href="/contact" style={{ color: "inherit" }}>
                Contact
              </Link>
              
            </div>
          </nav>
        </header>

        <div style={{ flex: 1 }}>{children}</div>

        <footer
          style={{
            borderTop: "1px solid #eee",
            padding: "1.5rem",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#666",
          }}
        >
          &copy; {new Date().getFullYear()} Mctaba Shop
        </footer>

        <AxeDevtools />
      </body>
    </html>
  );
}