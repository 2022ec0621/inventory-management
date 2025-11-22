import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import ProductTable from "./components/ProductTable";
import HistorySidebar from "./components/HistorySidebar";
import Login from "./components/Login";
import "./App.css";


function App() {
  const [user, setUser] = useState(null); // { username, role }
  const [token, setToken] = useState(null);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [showAddForm, setShowAddForm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [addForm, setAddForm] = useState({
    name: "",
    unit: "",
    category: "",
    brand: "",
    stock: 0,
    image: "",
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);

  // Load user/token from localStorage on first render
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
  }, []);

  // Fetch products when logged in + when search/category changes
  useEffect(() => {
    if (user && token) {
      fetchProducts();
    }
    // eslint-disable-next-line
  }, [
    search,
    category,
    user,
    token,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
  ]);

const fetchProducts = async () => {
  try {
    const params = {
      page: currentPage,
      limit: pageSize,
      sort: sortField,
      order: sortOrder,
    };
    if (search) params.search = search;
    if (category && category !== "All") params.category = category;

    const res = await axios.get("/api/products", { params });

    let list = [];
    let total = 0;

    // Support both array and { data, total } shapes
    if (Array.isArray(res.data)) {
      list = res.data;
      total = res.data.length;
    } else if (res.data && Array.isArray(res.data.data)) {
      list = res.data.data;
      total = res.data.total ?? res.data.data.length;
    } else {
      console.error("Unexpected products response:", res.data);
      setProducts([]);
      setCategories(["All"]);
      setTotalItems(0);
      return;
    }

    setProducts(list);
    setTotalItems(total);

    const cats = Array.from(
      new Set(list.map((p) => p.category).filter(Boolean))
    );
    setCategories(["All", ...cats]);
  } catch (err) {
    console.error("Error fetching products:", err);
    if (err.response?.status === 401 || err.response?.status === 403) {
      alert("Session expired or unauthorized. Please login again.");
      handleLogout();
    } else {
      alert("Failed to load products");
    }
  }
};



  // LOGIN SUCCESS HANDLER (used by Login/Register page)
  const handleLoginSuccess = ({ token, username, role }) => {
    setToken(token);
    setUser({ username, role });
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify({ username, role }));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setProducts([]);
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // UI handlers
  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleCategoryChange = (e) => setCategory(e.target.value);

  // EDIT handlers
  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      unit: product.unit,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      image: product.image,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingId) return;
      const payload = {
        ...editForm,
        user: user.username,
        remark: "Updated from UI",
      };
      await axios.put(`/api/products/${editingId}`, payload);
      await fetchProducts();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error("Error updating product:", err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else if (err.response?.data?.errors) {
        alert(err.response.data.errors.map((e) => e.msg).join("\n"));
      } else {
        alert("Failed to update product");
      }
    }
  };

  // DELETE product (ADMIN)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await axios.delete(`/api/products/${id}`);
      await fetchProducts();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete product");
    }
  };

  // HISTORY
  const handleShowHistory = async (product) => {
    try {
      const res = await axios.get(`/api/products/${product.id}/history`);
      setSelectedProduct(product);
      setHistory(res.data || []);
    } catch (err) {
      console.error("History error:", err);
      alert("Failed to load history");
    }
  };

  const handleCloseHistory = () => {
    setSelectedProduct(null);
    setHistory([]);
  };

  // IMPORT CSV (ADMIN)
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/products/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        `Import done.\nAdded: ${res.data.added}\nSkipped: ${res.data.skipped}`
      );
      await fetchProducts();
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import CSV (only admin can import)");
    } finally {
      e.target.value = "";
    }
  };

  // EXPORT CSV (ADMIN)
  const handleExport = async () => {
    try {
      const res = await axios.get("/api/products/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "products.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export CSV (only admin can export)");
    }
  };

  // ADD PRODUCT (ADMIN)
  const handleOpenAddForm = () => {
    setShowAddForm(true);
    setAddForm({
      name: "",
      unit: "",
      category: "",
      brand: "",
      stock: 0,
      image: "",
    });
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddForm({
      name: "",
      unit: "",
      category: "",
      brand: "",
      stock: 0,
      image: "",
    });
  };

  const handleSaveAdd = async () => {
    if (!addForm.name) {
      alert("Product name is required");
      return;
    }
    if (addForm.stock < 0) {
      alert("Stock cannot be negative");
      return;
    }

    try {
      const payload = { ...addForm };
      await axios.post("/api/products", payload);
      await fetchProducts();
      handleCancelAdd();
    } catch (err) {
      console.error("Error adding product:", err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else if (err.response?.data?.errors) {
        alert(err.response.data.errors.map((e) => e.msg).join("\n"));
      } else {
        alert("Failed to add product");
      }
    }
  };

  const handleSort = (field) => {
    setCurrentPage(1); // reset to first page when sort changes
    setSortField((prevField) => {
      if (prevField === field) {
        // toggle asc/desc
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        return prevField;
      }
      // new sort field, default asc
      setSortOrder("asc");
      return field;
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value) || 10;
    setPageSize(newSize);
    setCurrentPage(1);
  };



  // If not logged in → show login/register page
  if (!user || !token) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  return (
    <div
      className="app-root"
      style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}
    >
      {/* Main Content */}
      <div className="app-main" style={{ flex: 1, padding: "16px" }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <h1>Product Inventory</h1>
          <div>
            <span style={{ marginRight: "8px" }}>
              Logged in as <strong>{user.username}</strong> ({user.role})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Toolbar: Search + Category + Admin buttons */}
        <div
          className="toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={handleSearchChange}
            style={{ padding: "6px 8px", minWidth: "200px" }}
          />

          <select
            value={category}
            onChange={handleCategoryChange}
            style={{ padding: "6px 8px" }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Admin-only actions */}
          {user.role === "admin" && (
            <>
              {user.role === "admin" && (
                <>
                  <button className="btn-info" onClick={handleImportClick}>
                    Import CSV
                  </button>

                  <button className="btn-success" onClick={handleOpenAddForm}>
                    Add Product
                  </button>

                  <button className="btn-primary" onClick={handleExport}>
                    Export CSV
                  </button>
                </>
              )}
            </>
          )}

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Add Product Form (admin only) */}
        {user.role === "admin" && showAddForm && (
          <div
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "16px",
              borderRadius: "6px",
              backgroundColor: "#fdfdfd",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Add New Product</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div>
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={addForm.name}
                  onChange={handleAddChange}
                  style={{ width: "100%", padding: "4px 6px" }}
                />
              </div>
              <div>
                <label>Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={addForm.unit}
                  onChange={handleAddChange}
                  style={{ width: "100%", padding: "4px 6px" }}
                />
              </div>
              <div>
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={addForm.category}
                  onChange={handleAddChange}
                  style={{ width: "100%", padding: "4px 6px" }}
                />
              </div>
              <div>
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={addForm.brand}
                  onChange={handleAddChange}
                  style={{ width: "100%", padding: "4px 6px" }}
                />
              </div>
              <div>
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={addForm.stock}
                  onChange={handleAddChange}
                  style={{ width: "100%", padding: "4px 6px" }}
                />
              </div>
              <div>
                <label>Image</label>
                <input
                  type="text"
                  name="image"
                  value={addForm.image}
                  onChange={handleAddChange}
                  style={{ width: "100%", padding: "4px 6px" }}
                  placeholder="image URL or file name"
                />
              </div>
            </div>
            <div>
              <button onClick={handleSaveAdd}>Save</button>
              <button onClick={handleCancelAdd} style={{ marginLeft: "8px" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Product Table */}
        <div className="table-wrapper">
          <ProductTable
            products={products}
            editingId={editingId}
            editForm={editForm}
            onEditChange={handleEditChange}
            onEditClick={handleEditClick}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onShowHistory={handleShowHistory}
            onDelete={handleDelete}
            userRole={user.role}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>

        {/* Pagination controls */}
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages} ({totalItems} items)
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>

          <span style={{ marginLeft: "16px" }}>Page size:</span>
          <select value={pageSize} onChange={handlePageSizeChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* History Sidebar */}
      {selectedProduct && (
        <HistorySidebar
          product={selectedProduct}
          history={history}
          onClose={handleCloseHistory}
        />
      )}
    </div>
  );
}

export default App;
