export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
      <h1>About Mctaba Shop</h1>

      <p style={{ marginTop: "1rem", lineHeight: 1.7, color: "#444" }}>
        Mctaba Shop is a production-grade ecommerce platform built entirely
        with Next.js, PostgreSQL, Express, and Paystack.
      </p>

      <p style={{ marginTop: "1rem", lineHeight: 1.7, color: "#444" }}>
        This shop was built as part of the Mctaba Labs bootcamp — to teach
        full-stack engineering through a real project that works like a
        real business.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What we sell</h2>
      <ul style={{ marginTop: "0.75rem", lineHeight: 2, color: "#444" }}>
        <li>Phones</li>
        <li>Accessories</li>
        <li>Power banks</li>
      </ul>

      <p style={{ marginTop: "2rem" }}>
        <a href="/" style={{ textDecoration: "underline" }}>← Back to home</a>
      </p>
    </main>
  );
}