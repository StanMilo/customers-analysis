import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const TopProductsChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <p>Loading chart data...</p>;
  }

  // Category Analysis with top products
  const categorySales = data.reduce((acc, item) => {
    const category = item.productCategory;
    acc[category] = acc[category] || {
      totalSales: 0,
      count: 0,
      products: {},
    };

    acc[category].totalSales += Number(item.purchaseAmount);
    acc[category].count += 1;

    // Track individual product sales
    const productId = item.productId;
    acc[category].products[productId] = acc[category].products[productId] || {
      name: item.productName,
      sales: 0,
      count: 0,
    };
    acc[category].products[productId].sales += Number(item.purchaseAmount);
    acc[category].products[productId].count += 1;

    return acc;
  }, {});

  // Find top product for each category
  const categoryData = Object.entries(categorySales)
    .map(([category, data]) => {
      const topProduct = Object.entries(data.products)
        .map(([_, product]) => product)
        .sort((a, b) => b.sales - a.sales)[0];

      return {
        name: category,
        totalSales: Math.round(data.totalSales),
        averageOrder: Math.round(data.totalSales / data.count),
        topProduct: topProduct.name,
        topProductSales: Math.round(topProduct.sales),
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales); // Sort by total sales

  // Calculate overall stats
  const totalSales = categoryData.reduce((sum, cat) => sum + cat.totalSales, 0);
  const avgOrderValue = Math.round(
    categoryData.reduce((sum, cat) => sum + cat.averageOrder, 0) /
      categoryData.length
  );

  return (
    <div className="analytics-container">
      <div className="chart-controls">
        <h3>Category Sales</h3>
      </div>

      <div className="stats-summary">
        <div className="stat-box">
          <h3>Total Sales</h3>
          <p>${totalSales.toLocaleString()}</p>
        </div>
        <div className="stat-box">
          <h3>Average Order Value</h3>
          <p>${avgOrderValue}</p>
        </div>
      </div>

      <div className="category-analysis">
        <h3>Category Performance</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={categoryData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <p>
                        <strong>{data.name}</strong>
                      </p>
                      <p>Total Sales: ${data.totalSales.toLocaleString()}</p>
                      <p>Average Order: ${data.averageOrder}</p>
                      <p>Top Product: {data.topProduct}</p>
                      <p>
                        Top Product Sales: $
                        {data.topProductSales.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="totalSales" fill="#8884d8" name="Total Sales ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="top-products">
        <h3>Top Products by Category</h3>
        <div className="products-grid">
          {categoryData.map((category) => (
            <div key={category.name} className="category-card">
              <h4>{category.name}</h4>
              <p className="sales-value">
                ${category.totalSales.toLocaleString()}
              </p>
              <div className="top-product">
                <span>Top Product:</span>
                <strong>{category.topProduct}</strong>
                <span>${category.topProductSales.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopProductsChart;
