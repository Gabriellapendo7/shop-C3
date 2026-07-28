import "dotenv/config";
import express from "express";
import cors from "cors";
import { productsRouter } from "./routes/products.js";
import  { cartRouter } from "./routes/cart.js";
import { checkoutRouter } from "./routes/checkout.js";
import { paystackRouter } from "./routes/paystack.js";

const app = express();

app.use(cors({ origin: process.env.SHOP_URL }));
app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter); 
app.use("/api/checkout", checkoutRouter);
app.use("/api/paystack", paystackRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Shop API listening on http://localhost:${port}`);
});