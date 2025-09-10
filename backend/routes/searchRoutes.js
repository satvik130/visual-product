import express from "express";
import multer from "multer";
import Product from "../models/Product.js";
import * as tf from "@tensorflow/tfjs";
import { generateEmbedding } from "../utils/generateEmbeddings.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Load model once
let mobilenet;
tf.loadLayersModel(
  "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
).then((model) => (mobilenet = model));

// Cosine similarity function
const cosineSim = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
};

// Search by upload
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!mobilenet) return res.status(500).json({ message: "Model not loaded" });

  try {
    const embedding = await generateEmbedding(req.file.path, mobilenet);

    const products = await Product.find({});
    const results = products
      .map((p) => ({ ...p._doc, similarityScore: cosineSim(embedding, p.embedding) }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Search error" });
  }
});

// Search by URL
router.post("/url", async (req, res) => {
  if (!mobilenet) return res.status(500).json({ message: "Model not loaded" });

  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ message: "Image URL is required" });

    const embedding = await generateEmbedding(imageUrl, mobilenet);
    const products = await Product.find({});
    const results = products
      .map((p) => ({ ...p._doc, similarityScore: cosineSim(embedding, p.embedding) }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Search error" });
  }
});

export default router;
