import React, { useState } from "react";
import {
  preprocessData,
  createModel,
  trainModel,
  recommendProducts,
} from "../utils/recommendations";

const Recommendations = ({ data = [] }) => {
  const [customerId, setCustomerId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create product lookup map
      const productMap = data.reduce((acc, item) => {
        acc[item.productId] = {
          name: item.productName,
          category: item.productCategory,
        };
        return acc;
      }, {});

      // Train model if not already trained
      if (!model) {
        const purchaseHistory = data.map((item) => ({
          customerId: item.customerId,
          productId: item.productId,
        }));

        const { xs, ys, numCustomers, numProducts } =
          preprocessData(purchaseHistory);
        const newModel = createModel(numCustomers, numProducts);
        await trainModel(newModel, xs, ys);
        setModel(newModel);

        const recs = recommendProducts(
          newModel,
          parseInt(customerId),
          numCustomers,
          numProducts,
          3,
          productMap
        );
        setRecommendations(recs);
      } else {
        const { numCustomers, numProducts } = preprocessData(
          data.map((item) => ({
            customerId: item.customerId,
            productId: item.productId,
          }))
        );

        const recs = recommendProducts(
          model,
          parseInt(customerId),
          numCustomers,
          numProducts,
          3,
          productMap
        );
        setRecommendations(recs);
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
    }

    setIsLoading(false);
  };

  return (
    <div className="recommendations-container">
      <h2>Product Recommendations</h2>
      <form onSubmit={handleSubmit} className="input-group">
        <input
          type="number"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="Enter Customer ID"
          min="1"
          required
        />
        <button type="submit" disabled={isLoading}>
          Get Recommendations
        </button>
      </form>

      {isLoading ? (
        <p>Generating recommendations...</p>
      ) : (
        <div className="recommendations-list">
          {recommendations.length > 0 && (
            <ul>
              {recommendations.map((rec, index) => (
                <li key={index}>
                  {rec.productName} ({rec.category}) - Confidence:{" "}
                  {(rec.score * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
