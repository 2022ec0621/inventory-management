import React from "react";

function HistorySidebar({ product, history, onClose }) {
  return (
    <div
      style={{
        width: "350px",
        borderLeft: "1px solid #ccc",
        padding: "16px",
        backgroundColor: "#f9f9f9",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <h2 style={{ margin: 0 }}>Inventory History</h2>
        <button onClick={onClose}>X</button>
      </div>

      <p style={{ fontWeight: "bold" }}>{product.name}</p>

      {history.length === 0 ? (
        <p>No history for this product.</p>
      ) : (
        <table
          border="1"
          cellPadding="4"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>Old Qty</th>
              <th>New Qty</th>
              <th>Date</th>
              <th>User</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{h.old_quantity}</td>
                <td>{h.new_quantity}</td>
                <td>
                  {new Date(h.change_date).toLocaleString("en-GB", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td>{h.user}</td>
                <td>{h.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default HistorySidebar;
