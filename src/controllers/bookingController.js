const { pool } = require('../db');
const sendEmail = require('../utils/sendEmail');

const ALL_SLOTS = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'];

// GET /api/bookings
const getAllBookings = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, s.id AS service_id, s.name AS service_name, s.description AS service_description,
              s.price AS service_price, s.duration AS service_duration, s.category AS service_category,
              s.image AS service_image
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       ORDER BY b.date ASC, b.time ASC`
    );

    const bookings = rows.map((row) => ({
      id: row.id,
      user_name: row.user_name,
      email: row.email,
      service_id: row.service_id,
      date: row.date,
      time: row.time,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      service: {
        id: row.service_id,
        name: row.service_name,
        description: row.service_description,
        price: row.service_price,
        duration: row.service_duration,
        category: row.service_category,
        image: row.service_image,
      },
    }));

    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/availability?service_id=&date=
const getAvailableSlots = async (req, res, next) => {
  try {
    const { service_id, date } = req.query;
    if (!service_id || !date) {
      return res.status(400).json({ message: 'service_id and date are required' });
    }
    const { rows } = await pool.query(
      `SELECT time FROM bookings
       WHERE service_id = $1
         AND date = $2
         AND status != 'cancelled'`,
      [service_id, date]
    );
    const bookedTimes = rows.map((b) => b.time);
    const available = ALL_SLOTS.filter((slot) => !bookedTimes.includes(slot));
    res.json({ available });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const { user_name, email, service_id, date, time } = req.body;

    const existsResult = await pool.query(
      `SELECT id FROM bookings
       WHERE service_id = $1
         AND date = $2
         AND time = $3`,
      [service_id, date, time]
    );
    if (existsResult.rows.length > 0) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bookings (user_name, email, service_id, date, time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_name, email, service_id, date, time]
    );

    sendEmail({
      to: email,
      subject: 'Booking Confirmed – Sérénité Spa',
      html: `<h2>Hi ${user_name},</h2><p>Your booking on <strong>${date}</strong> at <strong>${time}</strong> is confirmed.</p><p>See you soon! 🌿</p>`,
    }).catch(console.error);

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }
    next(err);
  }
};

// PATCH /api/bookings/:id
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const { rows } = await pool.query(
      `UPDATE bookings
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );
    const booking = rows[0];
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/bookings/:id
const deleteBooking = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllBookings, createBooking, updateBookingStatus, deleteBooking, getAvailableSlots };
