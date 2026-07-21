import "dotenv/config";
import express from "express";
import cors from "cors";
import { productsRouter } from "./routes/products.js";

const app = express();

app.use(cors({ origin: process.env.SHOP_URL }));
app.use(express.json());

app.use("/api/products", productsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Shop API listening on http://localhost:${port}`);
});