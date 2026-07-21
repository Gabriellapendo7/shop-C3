import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: { default: "Shop", template: "%s | Mctaba Shop" },
  description: "A fullstack shop built with Next.js and PostgreSQL",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header style={{ borderBottom: "1px solid #eee" }}>
          <nav style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 2rem",
          }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              Mctaba Shop
            </Link>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/products">Products</Link>
              <Link href="/about">About</Link>
            </div>
          </nav>
        </header>

        <div style={{ flex: 1 }}>{children}</div>

        <footer style={{
          borderTop: "1px solid #eee",
          padding: "1.5rem",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#666",
        }}>
          © {new Date().getFullYear()} Mctaba Shop
        </footer>
      </body>
    </html>
  );
}