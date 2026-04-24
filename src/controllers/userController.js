const { pool } = require('../db');

// GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, role = 'user' } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, role)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(err);
  }
};

module.exports = { getAllUsers, createUser };
