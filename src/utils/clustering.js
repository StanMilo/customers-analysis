import * as tf from "@tensorflow/tfjs";
import { kmeans } from "ml-kmeans";

/**
 * Customer Segmentation System using K-means Clustering
 *
 * This module implements customer segmentation by analyzing purchase patterns
 * and grouping similar customers together. It uses the K-means algorithm to
 * identify natural groupings in customer behavior.
 *
 * Feature Engineering:
 * 1. Total Spending: Sum of all purchase amounts
 * 2. Purchase Frequency: Number of transactions
 * 3. Category Distribution: Purchases across different product categories
 *
 * Clustering Process:
 * 1. Feature Extraction
 *    - Aggregates customer purchase data
 *    - Calculates spending metrics
 *    - Creates category purchase vectors
 *
 * 2. Data Normalization
 *    - Scales all features to [0,1] range
 *    - Ensures equal weight for all features
 *
 * 3. K-means Clustering
 *    - Groups customers into 4 segments
 *
 * 4. Segment Labeling
 *    - Luxury Buyers: High spending across categories
 *    - Discount Shoppers: Lower spending, varied categories
 *    - Frequent Buyers: Many small purchases
 *    - Category Specialists: Focused on specific categories
 */

export const clusterCustomers = (data) => {
  if (!data || data.length === 0) return { clusters: [], customerDetails: [] };

  const customerMap = {};
  const productCategories = new Set();

  // Step 1: Aggregate customer data
  data.forEach(
    ({ customerId, purchaseAmount, productCategory, productName }) => {
      const amount = parseFloat(purchaseAmount);

      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          id: customerId,
          totalSpent: 0,
          frequency: 0,
          categoryCounts: {},
          productCounts: {},
          avgSpent: 0,
        };
      }

      const customer = customerMap[customerId];
      customer.totalSpent += amount;
      customer.frequency += 1;

      // Track category purchases
      if (!customer.categoryCounts[productCategory]) {
        customer.categoryCounts[productCategory] = {
          count: 0,
          spent: 0,
        };
      }
      customer.categoryCounts[productCategory].count += 1;
      customer.categoryCounts[productCategory].spent += amount;

      // Track product purchases
      if (!customer.productCounts[productName]) {
        customer.productCounts[productName] = {
          count: 0,
          spent: 0,
        };
      }
      customer.productCounts[productName].count += 1;
      customer.productCounts[productName].spent += amount;

      productCategories.add(productCategory);
    }
  );

  // Calculate averages and find favorites
  const customers = Object.values(customerMap).map((customer) => {
    // Calculate average spent
    customer.avgSpent = customer.totalSpent / customer.frequency;

    // Find most used category
    customer.mostUsedCategory = Object.entries(customer.categoryCounts).sort(
      (a, b) => b[1].count - a[1].count
    )[0][0];

    // Find favorite product
    customer.favoriteProduct = Object.entries(customer.productCounts).sort(
      (a, b) => b[1].count - a[1].count
    )[0][0];

    return customer;
  });

  // Create feature array for clustering
  const featureArray = customers.map(
    ({ totalSpent, frequency, categoryCounts }) => {
      const categoryVector = Array.from(productCategories).map(
        (category) => categoryCounts[category]?.count || 0
      );
      return [totalSpent, frequency, ...categoryVector];
    }
  );

  // Normalize and cluster
  const tensor = tf.tensor2d(featureArray);
  const min = tensor.min(0);
  const max = tensor.max(0);
  const normalized = tensor.sub(min).div(max.sub(min)).arraySync();

  const { clusters } = kmeans(normalized, 4);

  // Assign cluster labels
  const clusterLabels = [
    "Luxury Buyers", // High spending across multiple categories.
    "Discount Shoppers", // Low spending, scattered purchases across categories.
    "Frequent Buyers", // Many small purchases, often in similar categories.
    "Category Specialists", //Majority of spending in one product category.
  ];

  // Combine cluster assignments with customer details
  const customerDetails = customers.map((customer, index) => ({
    ...customer,
    segment: clusterLabels[clusters[index]],
  }));

  return {
    clusters: customerDetails.map((c) => ({
      id: c.id,
      segment: c.segment,
      mostUsedCategory: c.mostUsedCategory,
      favoriteProduct: c.favoriteProduct,
      avgSpent: c.avgSpent,
    })),
  };
};
