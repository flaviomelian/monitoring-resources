const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "crud",
  password: process.env.DB_PASSWORD || "crud",
  database: process.env.DB_NAME || "crud",
  waitForConnections: true,
  connectionLimit: 5,
});

// Crea la tabla al arrancar (reintenta por si MySQL aún no acepta conexiones)
async function initDb(retries = 20) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("DB lista");
      return;
    } catch (err) {
      console.log(`Esperando a la DB (${i}/${retries}): ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("No se pudo conectar con la DB");
}

// LISTAR
app.get("/api/items", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM items ORDER BY id DESC");
  res.json(rows);
});

// CREAR
app.post("/api/items", async (req, res) => {
  const { name, description = "" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "name es obligatorio" });
  const [result] = await pool.query(
    "INSERT INTO items (name, description) VALUES (?, ?)",
    [name.trim(), description]
  );
  const [rows] = await pool.query("SELECT * FROM items WHERE id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
});

// ACTUALIZAR
app.put("/api/items/:id", async (req, res) => {
  const { name, description = "" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "name es obligatorio" });
  const [result] = await pool.query(
    "UPDATE items SET name = ?, description = ? WHERE id = ?",
    [name.trim(), description, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "No encontrado" });
  const [rows] = await pool.query("SELECT * FROM items WHERE id = ?", [req.params.id]);
  res.json(rows[0]);
});

// BORRAR
app.delete("/api/items/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM items WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "No encontrado" });
  res.status(204).end();
});

// Manejo de errores de rutas async (Express 4 no los captura solo)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno" });
});
process.on("unhandledRejection", (e) => console.error("unhandledRejection", e));

initDb().then(() => {
  app.listen(3000, () => console.log("API escuchando en :3000"));
});
