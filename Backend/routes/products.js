import express from "express";
import multer from "multer";
import csvParser from "csv-parser";
import { body, validationResult } from "express-validator";
import db from "../db.js";
import { Readable } from "node:stream";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";


const router = express.Router();

// Multer for CSV upload (file field name: "file")
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Utility to run DB queries with Promise
 */
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function runExecute(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes
    });
  });
}



// GET /api/products  (any logged-in user: admin/client)

router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      search,
      category,
      page = 1,
      limit = 10,
      sort = "id",
      order = "asc",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    // Whitelist sortable fields to avoid SQL injection
    const sortableFields = {
      id: "id",
      name: "name",
      category: "category",
      brand: "brand",
      stock: "stock",
      created_at: "created_at",
      updated_at: "updated_at",
    };
    const sortColumn = sortableFields[sort] || "id";
    const sortOrder = order === "desc" ? "DESC" : "ASC";

    // Build WHERE conditions
    let where = "WHERE 1=1";
    const params = [];
    if (search) {
      where += " AND name LIKE ?";
      params.push(`%${search}%`);
    }
    if (category && category !== "All") {
      where += " AND category = ?";
      params.push(category);
    }

    // Total count (for pagination)
    const countRows = await runQuery(
      `SELECT COUNT(*) as count FROM products ${where}`,
      params
    );
    const total = countRows[0]?.count || 0;

    // Actual page data
    const data = await runQuery(
      `SELECT * FROM products
       ${where}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// POST /api/products/import
router.post(
  "/import",authenticateToken,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const buffer = req.file.buffer;
    const results = [];

    // Parse CSV from buffer
    const stream = Readable.from(buffer.toString());
    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    // Insert/update logic
    let added = 0;
    let skipped = 0;
    const duplicates = [];

    for (const row of results) {
      const name = row.name?.trim();
      if (!name) continue;

      const unit = row.unit || "";
      const category = row.category || "";
      const brand = row.brand || "";
      const stock = parseInt(row.stock || "0", 10);
      const image = row.image || "";

      // Check existing (case-insensitive)
      const existing = await runQuery(
        "SELECT * FROM products WHERE LOWER(name) = LOWER(?)",
        [name]
      );

      if (existing.length > 0) {
        skipped++;
        duplicates.push({ name, existingId: existing[0].id });
        continue;
      }

      await runExecute(
        `INSERT INTO products (name, unit, category, brand, stock, image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, unit, category, brand, stock, image]
      );
      added++;
    }

    return res.json({
      message: "Import completed",
      added,
      skipped,
      duplicates,
    });
  }
);


// GET /api/products/export
router.get("/export",authenticateToken, async (req, res) => {
  try {
    const rows = await runQuery("SELECT * FROM products ORDER BY id");

    const headers = [
      "id",
      "name",
      "unit",
      "category",
      "brand",
      "stock",
      "image",
      "created_at",
      "updated_at",
    ];

    const lines = [];
    lines.push(headers.join(","));

    for (const r of rows) {
      const line = headers
        .map((h) => {
          let val = r[h] ?? "";
          // basic escaping of commas/quotes
          if (typeof val === "string") {
            val = val.replace(/"/g, '""');
            if (val.includes(",") || val.includes('"')) {
              val = `"${val}"`;
            }
          }
          return val;
        })
        .join(",");
      lines.push(line);
    }

    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="products.csv"'
    );
    res.status(200).send(csv);
  } catch (err) {
    console.error("EXPORT error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// PUT /api/products/:id
router.put(
  "/:id",authenticateToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
    // you can add more validators for unit/category/brand...
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id;
    const { name, unit, category, brand, stock, image, user, remark } =
      req.body;

    try {
      // fetch old product
      const existingArr = await runQuery(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );
      if (existingArr.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      const existing = existingArr[0];

      // ensure unique name except this id
      const nameCheck = await runQuery(
        "SELECT * FROM products WHERE LOWER(name) = LOWER(?) AND id != ?",
        [name, id]
      );
      if (nameCheck.length > 0) {
        return res.status(400).json({ error: "Product name already exists" });
      }

      const newStock = parseInt(stock, 10);

      await runExecute(
        `UPDATE products
         SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, image = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, unit, category, brand, newStock, image, id]
      );

      // log history if stock changed
      if (existing.stock !== newStock) {
        await runExecute(
          `INSERT INTO inventory_history
           (product_id, old_quantity, new_quantity, user, remark)
           VALUES (?, ?, ?, ?, ?)`,
          [id, existing.stock, newStock, user || "system", remark || ""]
        );
      }

      const updated = await runQuery("SELECT * FROM products WHERE id = ?", [
        id,
      ]);
      res.json(updated[0]);
    } catch (err) {
      console.error("PUT /products/:id error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);


// GET /api/products/:id/history
router.get("/:id/history",authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    const rows = await runQuery(
      `SELECT id, product_id, old_quantity, new_quantity,
              change_date, user, remark
       FROM inventory_history
       WHERE product_id = ?
       ORDER BY change_date DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /products/:id/history error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/products/:id (ADMIN)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    const id = req.params.id;
    try {
      // Optionally clear history first
      await runExecute("DELETE FROM inventory_history WHERE product_id = ?", [id]);
      const result = await runExecute("DELETE FROM products WHERE id = ?", [id]);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product deleted" });
    } catch (err) {
      console.error("DELETE /products/:id error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);
// POST /api/products  (ADMIN) - Add a single product
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, unit, category, brand, stock, image } = req.body;

    try {
      // Check for duplicate name (case-insensitive)
      const existing = await runQuery(
        "SELECT * FROM products WHERE LOWER(name) = LOWER(?)",
        [name]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "Product name already exists" });
      }

      const result = await runExecute(
        `INSERT INTO products (name, unit, category, brand, stock, image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, unit || "", category || "", brand || "", parseInt(stock, 10), image || ""]
      );

      const newProduct = await runQuery(
        "SELECT * FROM products WHERE id = ?",
        [result.lastID]
      );

      res.status(201).json(newProduct[0]);
    } catch (err) {
      console.error("POST /products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);



export default router;

