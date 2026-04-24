const { pool } = require('../db');

// GET /api/services
const getAllServices = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM services WHERE is_active = true';
    const params = [];
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/services/:id
const getServiceById = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    const service = rows[0];
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    next(err);
  }
};

// POST /api/services
const createService = async (req, res, next) => {
  try {
    const { name, description, price, duration, category, image = '' } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO services (name, description, price, duration, category, image)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, duration, category, image]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/services/:id
const updateService = async (req, res, next) => {
  try {
    const { name, description, price, duration, category, image, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE services
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           duration = COALESCE($4, duration),
           category = COALESCE($5, category),
           image = COALESCE($6, image),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, description, price, duration, category, image, is_active, req.params.id]
    );
    const service = rows[0];
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/services/:id
const deleteService = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE services
       SET is_active = false,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    const service = rows[0];
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deactivated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllServices, getServiceById, createService, updateService, deleteService };
