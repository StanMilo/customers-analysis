import { useState, useEffect } from "react";
import { clusterCustomers } from "../utils/clustering";
import { ITEMS_PER_PAGE } from "../utils/helpers";
import usePagination from "../hooks/usePagination";

const Clustering = ({ data }) => {
  const [clusterResults, setClusterResults] = useState({
    clusters: [],
  });

  useEffect(() => {
    if (data.length > 0) {
      const result = clusterCustomers(data);
      setClusterResults(result);
    }
  }, [data]);

  const { currentItems, currentPage, totalPages, nextPage, prevPage } =
    usePagination(clusterResults.clusters, ITEMS_PER_PAGE);

  return (
    <div className="segmentation-container">
      <h2>Customer Segmentation</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Segment</th>
              <th>Favorite Category</th>
              <th>Favorite Product</th>
              <th>Average Spent</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((customer, index) => (
                <tr key={index}>
                  <td>{customer.id}</td>
                  <td>
                    <span
                      className={`segment-tag ${customer.segment
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {customer.segment}
                    </span>
                  </td>
                  <td>{customer.mostUsedCategory}</td>
                  <td>{customer.favoriteProduct}</td>
                  <td>${customer.avgSpent.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No data available for clustering.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={prevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={nextPage} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Clustering;
