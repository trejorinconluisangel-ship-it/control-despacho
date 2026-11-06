const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS datos_despacho (
      id SERIAL PRIMARY KEY,
      clave TEXT UNIQUE,
      contenido JSONB
    );
  `);
}
initDB();

app.get('/api/datos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM datos_despacho');
    let data = {};
    result.rows.forEach(row => {
      data[row.clave] = row.contenido;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/datos', async (req, res) => {
  try {
    const { clave, contenido } = req.body;
    await pool.query(`
      INSERT INTO datos_despacho (clave, contenido) 
      VALUES ($1, $2)
      ON CONFLICT (clave) 
      DO UPDATE SET contenido = $2;
    `, [clave, contenido]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
