import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import db from "./db.js";
import productsRouter from "./routes/products.js";

import authRouter from "./routes/auth.js";



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// for form-data + file uploads we'll handle in router with multer

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);


// Simple health check
app.get("/", (req, res) => {
  res.json({ message: "Inventory backend is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
