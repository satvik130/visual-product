import * as tf from "@tensorflow/tfjs"; // pure JS version works in Node 22
import fetch from "node-fetch";
import { createCanvas, loadImage } from "canvas";

// Convert image to tensor
export const imageToTensor = async (imagePathOrUrl) => {
  let img;
  if (imagePathOrUrl.startsWith("http")) {
    const response = await fetch(imagePathOrUrl);
    const buffer = await response.arrayBuffer();
    img = await loadImage(Buffer.from(buffer));
  } else {
    img = await loadImage(imagePathOrUrl);
  }

  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const tensor = tf.browser.fromPixels(canvas)
    .resizeNearestNeighbor([224, 224])
    .toFloat();
  return tensor.expandDims(0).div(255.0); // normalize
};

// Generate embedding using MobileNet
export const generateEmbedding = async (imagePathOrUrl, model) => {
  const tensor = await imageToTensor(imagePathOrUrl);
  const embedding = model.predict(tensor);
  return embedding.arraySync()[0];
};
