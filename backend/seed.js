import dotenv from "dotenv";
import connectDB from "./config/database.js";
import Product from "./models/Product.js";
import * as tf from "@tensorflow/tfjs";
import { generateEmbedding } from "./utils/generateEmbeddings.js";

dotenv.config();
connectDB();

const sampleProducts = Array.from({ length: 50 }).map((_, i) => ({
  name: `Product ${i + 1}`,
  category: i % 2 === 0 ? "Clothing" : "Electronics",
  imageUrl: `https://picsum.photos/200?random=${i}`,
  description: `This is product ${i + 1}`,
  price: Math.floor(Math.random() * 1000) + 100,
  embedding: []
}));

const seedData = async () => {
  try {
    const mobilenet = await tf.loadLayersModel(
      "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
    );

    for (let product of sampleProducts) {
      product.embedding = await generateEmbedding(product.imageUrl, mobilenet);
    }

    await Product.deleteMany();
    await Product.insertMany(sampleProducts);
    console.log("Sample products with embeddings inserted!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
