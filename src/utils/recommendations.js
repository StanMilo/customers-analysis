import * as tf from "@tensorflow/tfjs";

/**
 * Neural Network-Based Recommendation System
 *
 * This implementation uses a collaborative filtering approach with deep learning
 * to generate personalized product recommendations. The system learns patterns
 * from historical purchase data to predict which products a customer might like.
 *
 * Key Components:
 * 1. Data Preprocessing
 *    - Converts customer IDs to one-hot encoded vectors
 *    - Transforms product IDs to target labels
 *    - Normalizes purchase data for training
 *
 * 2. Neural Network Architecture
 *    Input Layer: Customer vector (size = number of customers)
 *    Hidden Layer 1: 128 neurons, ReLU activation
 *    Hidden Layer 2: 64 neurons, ReLU activation
 *    Output Layer: Product probabilities (size = number of products)
 *
 * 3. Training Process
 *    - Uses supervised learning with purchase history
 *    - Optimizes with Adam optimizer
 *    - Uses categorical crossentropy loss
 *    - Trains for 10 epochs with batch size 32

/**
 * Preprocesses customer purchase history for model training.
 *
 * @param {Array} purchaseHistory - Array of purchase records with customerId and productId
 * @returns {Object} Processed data ready for training
 *
 * Process:
 * 1. Creates unique customer and product mappings
 * 2. Generates one-hot encoded vectors for customers
 * 3. Creates corresponding product target labels
 * 4. Handles data validation and error cases
 */
export function preprocessData(purchaseHistory) {
  if (!purchaseHistory || purchaseHistory.length === 0) {
    console.error("ERROR: No purchase history provided!");
    return { xs: null, ys: null, numCustomers: 0, numProducts: 0 };
  }

  // Get unique customers and products
  const uniqueCustomers = new Set(purchaseHistory.map((p) => p.customerId));
  const uniqueProducts = new Set(purchaseHistory.map((p) => p.productId));

  const numCustomers = uniqueCustomers.size;
  const numProducts = Math.max(...uniqueProducts) + 1;

  // Create training data
  const inputs = [];
  const labels = [];

  purchaseHistory.forEach(({ customerId, productId }) => {
    if (customerId >= numCustomers || productId > Math.max(...uniqueProducts)) {
      return;
    }
    // Create one-hot encoded customer vector
    const inputVector = new Array(numCustomers).fill(0);
    inputVector[customerId] = 1;
    inputs.push(inputVector);
    labels.push(productId - 1); // Convert to 0-based index
  });

  if (inputs.length === 0) {
    console.error("No valid data found!");
    return { xs: null, ys: null, numCustomers, numProducts };
  }

  // Convert to tensors
  const xs = tf.tensor2d(inputs);
  const ys = tf.oneHot(tf.tensor1d(labels, "int32"), numProducts);

  return { xs, ys, numCustomers, numProducts };
}

/**
 * Creates and compiles the neural network model.
 *
 * Architecture Explanation:
 * - First dense layer (128 units): Learns customer embeddings and patterns
 * - Second dense layer (64 units): Creates more abstract representations
 * - Output layer: Generates probability distribution over all products
 *
 * The model uses ReLU activation for hidden layers to introduce non-linearity
 * and softmax for the output layer to get probability scores.
 */
export function createModel(inputDim, numProducts) {
  const model = tf.sequential();

  // Hidden layers
  model.add(
    tf.layers.dense({ units: 128, activation: "relu", inputShape: [inputDim] })
  );
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));

  // Output layer
  model.add(tf.layers.dense({ units: numProducts, activation: "softmax" }));

  model.compile({
    optimizer: "adam",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

/**
 * Trains the recommendation model on customer purchase data.
 *
 * Training Configuration:
 * - Epochs: 10
 * - Batch Size: 32
 */
export async function trainModel(model, xs, ys) {
  await model.fit(xs, ys, {
    epochs: 10,
    batchSize: 32,
  });
}

/**
 * Generates product recommendations for a specific customer.
 *
 * Process:
 * 1. Creates one-hot encoded vector for the target customer
 * 2. Passes vector through the trained model
 * 3. Gets probability scores for all products
 * 4. Returns top K products with highest scores
 *
 * The recommendations include:
 * - Product ID
 * - Confidence score (probability)
 * - Product name and category (if productMap provided)
 *
 * @param {number} topK - Number of recommendations to return (default: 3)
 * @param {Object} productMap - Optional mapping of products to their details
 */
export function recommendProducts(
  model,
  userId,
  numCustomers,
  numProducts,
  topK = 3,
  productMap = {}
) {
  if (!model || userId === undefined || userId < 0 || userId >= numCustomers) {
    console.warn("Invalid userId or model not ready.");
    return [];
  }

  // Create input vector for the user
  const inputVector = new Array(numCustomers).fill(0);
  inputVector[userId] = 1;

  // Get predictions
  const inputTensor = tf.tensor2d([inputVector]);
  const predictions = model.predict(inputTensor);

  if (!predictions) {
    console.error("No predictions returned.");
    return [];
  }

  // Convert to product recommendations
  const predictionArray = predictions.arraySync()[0];
  const topProducts = predictionArray
    .map((score, index) => ({
      productId: index + 1,
      score,
      productName: productMap[index + 1]?.name || `Product ${index + 1}`,
      category: productMap[index + 1]?.category || "Unknown",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return topProducts;
}
