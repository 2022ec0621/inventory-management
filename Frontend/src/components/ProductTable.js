import React from "react";

function ProductTable({
  products,
  editingId,
  editForm,
  onEditChange,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onShowHistory,
  onDelete,
  userRole,
  sortField,
  sortOrder,
  onSort,
}) {
  const isAdmin = userRole === "admin";
  const safeProducts = Array.isArray(products) ? products : [];

  // Render clickable sortable headers
  const renderSortLabel = (field, label) => {
    const isActive = sortField === field;
    const arrow = !isActive ? "" : sortOrder === "asc" ? " ▲" : " ▼";

    return (
      <button
        type="button"
        onClick={() => onSort(field)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontWeight: isActive ? "bold" : "normal",
        }}
      >
        {label}
        {arrow}
      </button>
    );
  };

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>{renderSortLabel("name", "Product Name")}</th>
          <th>{renderSortLabel("unit", "Unit")}</th>
          <th>{renderSortLabel("category", "Category")}</th>
          <th>{renderSortLabel("brand", "Brand")}</th>
          <th>{renderSortLabel("stock", "Stock")}</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {safeProducts.length === 0 && (
          <tr>
            <td colSpan="7" style={{ textAlign: "center" }}>
              No products found
            </td>
          </tr>
        )}

        {safeProducts.map((p) =>
          editingId === p.id ? (
            // ===== EDIT MODE ROW =====
            <tr key={p.id}>
              <td>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={onEditChange}
                />
              </td>
              <td>
                <input
                  type="text"
                  name="unit"
                  value={editForm.unit}
                  onChange={onEditChange}
                />
              </td>
              <td>
                <input
                  type="text"
                  name="category"
                  value={editForm.category}
                  onChange={onEditChange}
                />
              </td>
              <td>
                <input
                  type="text"
                  name="brand"
                  value={editForm.brand}
                  onChange={onEditChange}
                />
              </td>
              <td>
                <input
                  type="number"
                  name="stock"
                  value={editForm.stock}
                  onChange={onEditChange}
                />
              </td>
              <td>{editForm.stock === 0 ? "Out of Stock" : "In Stock"}</td>
              <td>
                <button className="btn-success" onClick={onSaveEdit}>
                  <span className="btn-icon" aria-hidden="true">
                    💾
                  </span>
                  <span className="btn-text">Save</span>
                </button>
                <button
                  className="btn-danger"
                  onClick={onCancelEdit}
                  style={{ marginLeft: "6px" }}
                >
                  <span className="btn-icon" aria-hidden="true">
                    ✖
                  </span>
                  <span className="btn-text">Cancel</span>
                </button>
              </td>
            </tr>
          ) : (
            // ===== VIEW MODE ROW =====
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.unit}</td>
              <td>{p.category}</td>
              <td>{p.brand}</td>
              <td>{p.stock}</td>

              {/* Status column */}
              <td>
                {p.stock === 0 ? (
                  <span
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  >
                    Out of Stock
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: "#28a745",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  >
                    In Stock
                  </span>
                )}
              </td>

              {/* Actions column */}
              <td>
                {isAdmin && (
                  <>
                    <button
                      className="btn-primary"
                      onClick={() => onEditClick(p)}
                    >
                      <span className="btn-icon" aria-hidden="true">
                        📝
                      </span>
                      <span className="btn-text">Edit</span>
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => onDelete(p.id)}
                      style={{ marginLeft: "6px" }}
                    >
                      <span className="btn-icon" aria-hidden="true">
                        🗑
                      </span>
                      <span className="btn-text">Delete</span>
                    </button>
                  </>
                )}

                <button
                  className="btn-info"
                  onClick={() => onShowHistory(p)}
                  style={{ marginLeft: "6px" }}
                >
                  <span className="btn-icon" aria-hidden="true">
                    📜
                  </span>
                  <span className="btn-text">History</span>
                </button>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}

export default ProductTable;
