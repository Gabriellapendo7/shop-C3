export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
      <h1>Contact Us</h1>
      <p style={{ marginTop: "1rem", color: "#444", lineHeight: 1.6 }}>
        Have a question about an order or a product? We are here to help.
      </p>
      <ul style={{ marginTop: "1rem", lineHeight: 2, color: "#444" }}>
        <li>
          Phone:{" "}
          <a href="tel:+254712000000" style={{ color: "inherit" }}>
            +254 712 000000
          </a>
        </li>
        <li>
          Email:{" "}
          <a href="mailto:hi@mctaba.co.ke" style={{ color: "inherit" }}>
            hi@mctaba.co.ke
          </a>
        </li>
      </ul>
    </main>
  );
}