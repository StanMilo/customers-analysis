import { useState, useEffect } from "react";
import {
  preprocessData,
  createModel,
  trainModel,
  recommendProducts,
} from "../utils/recommendations";

const SummaryReport = ({ data = [] }) => {
  const [model, setModel] = useState(null);
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (data.length > 0) {
      analyzeData();
    }
  }, [data]);

  const analyzeData = async () => {
    // 1. Basic Statistics
    const totalCustomers = new Set(data.map((item) => item.customerId)).size;
    const totalProducts = new Set(data.map((item) => item.productId)).size;
    const totalSales = data.reduce(
      (sum, item) => sum + Number(item.purchaseAmount),
      0
    );

    // 2. Category Analysis
    const categoryAnalysis = data.reduce((acc, item) => {
      acc[item.productCategory] = acc[item.productCategory] || {
        sales: 0,
        transactions: 0,
      };
      acc[item.productCategory].sales += Number(item.purchaseAmount);
      acc[item.productCategory].transactions += 1;
      return acc;
    }, {});

    // 3. Customer Segments
    const customerPurchases = data.reduce((acc, item) => {
      acc[item.customerId] = acc[item.customerId] || {
        totalSpent: 0,
        purchases: 0,
        categories: new Set(),
      };
      acc[item.customerId].totalSpent += Number(item.purchaseAmount);
      acc[item.customerId].purchases += 1;
      acc[item.customerId].categories.add(item.productCategory);
      return acc;
    }, {});

    // Define customer segments
    const segments = {
      premium: { count: 0, avgSpent: 0 },
      regular: { count: 0, avgSpent: 0 },
      occasional: { count: 0, avgSpent: 0 },
    };

    Object.values(customerPurchases).forEach((customer) => {
      if (customer.totalSpent > 1000 && customer.categories.size >= 3) {
        segments.premium.count++;
        segments.premium.avgSpent += customer.totalSpent;
      } else if (customer.totalSpent > 500 || customer.purchases > 5) {
        segments.regular.count++;
        segments.regular.avgSpent += customer.totalSpent;
      } else {
        segments.occasional.count++;
        segments.occasional.avgSpent += customer.totalSpent;
      }
    });

    // Calculate averages for segments
    Object.keys(segments).forEach((segment) => {
      if (segments[segment].count > 0) {
        segments[segment].avgSpent = Math.round(
          segments[segment].avgSpent / segments[segment].count
        );
      }
    });

    // 4. Example Customer Analysis
    const exampleCustomerId = 173; // Choose a specific customer
    const customerHistory = data.filter(
      (item) => item.customerId === exampleCustomerId
    );

    // Train model for recommendations
    const purchaseHistory = data.map((item) => ({
      customerId: item.customerId,
      productId: item.productId,
      productName: item.productName,
    }));

    const { xs, ys, numCustomers, numProducts } =
      preprocessData(purchaseHistory);
    const newModel = createModel(numCustomers, numProducts);
    await trainModel(newModel, xs, ys);
    setModel(newModel);

    // Create product lookup map
    const productMap = data.reduce((acc, item) => {
      acc[item.productId] = {
        name: item.productName,
        category: item.productCategory,
      };
      return acc;
    }, {});

    const recommendations = recommendProducts(
      newModel,
      exampleCustomerId,
      numCustomers,
      numProducts,
      3,
      productMap
    );

    setInsights({
      totalCustomers,
      totalProducts,
      totalSales,
      categoryAnalysis,
      segments,
      exampleCustomer: {
        id: exampleCustomerId,
        history: customerHistory,
        recommendations: recommendations,
      },
    });

    setIsLoading(false);
  };

  if (isLoading || !insights) {
    return <div>Generating insights...</div>;
  }

  return (
    <div className="summary-report">
      <h2>Data Analysis Summary</h2>

      <section className="overview">
        <h3>Overview</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <h4>Total Customers</h4>
            <p>{insights.totalCustomers}</p>
          </div>
          <div className="stat-item">
            <h4>Total Products</h4>
            <p>{insights.totalProducts}</p>
          </div>
          <div className="stat-item">
            <h4>Total Sales</h4>
            <p>${insights.totalSales.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="segments">
        <h3>Customer Segments</h3>
        <div className="segment-grid">
          {Object.entries(insights.segments).map(([segment, data]) => (
            <div key={segment} className="segment-card">
              <h4>{segment.charAt(0).toUpperCase() + segment.slice(1)}</h4>
              <p>{data.count} customers</p>
              <p>Avg. Spent: ${data.avgSpent.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="example-analysis">
        <h3>Example Customer Analysis</h3>
        <div className="example-customer">
          <h4>Customer ID: {insights.exampleCustomer.id}</h4>
          <div className="purchase-history">
            <h5>Purchase History</h5>
            <ul>
              {insights.exampleCustomer.history.map((purchase, index) => (
                <li key={index}>
                  {purchase.productCategory} - $
                  {Number(purchase.purchaseAmount).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <div className="recommendations">
            <h5>Recommended Products</h5>
            <ul>
              {insights.exampleCustomer.recommendations.map((rec, index) => (
                <li key={index}>
                  {rec.productName} ({rec.category}) - Confidence:{" "}
                  {(rec.score * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SummaryReport;
