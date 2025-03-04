import { useState, useEffect } from "react";
import "./App.css";
import Papa from "papaparse";
import TopProductsChart from "./components/TopProductsChart";
import Recommendations from "./components/Recommendations";
import Clustering from "./components/Clustering";
import SummaryReport from "./components/SummaryReport";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/customer_purchases.csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        return response.text();
      })
      .then((csv) => {
        const parsedData = Papa.parse(csv, {
          header: true,
          dynamicTyping: true, // Automatically convert numbers
        }).data;
        setData(parsedData.filter((row) => row.customerId !== null)); // Remove any invalid rows
        setLoading(false);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (error) {
    return <div className="error">Error loading data: {error}</div>;
  }

  return (
    <div className="app-container">
      <h1>Retail Analysis Dashboard</h1>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <TopProductsChart data={data} />
          <SummaryReport data={data} />
          <Recommendations data={data} />
          <Clustering data={data} />
        </>
      )}
    </div>
  );
}

export default App;
