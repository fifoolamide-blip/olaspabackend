const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');

const ALL_SLOTS = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'];

// GET /api/bookings
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate('service_id').sort({ date: 1 });
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
    const booked = await Booking.find({
      service_id,
      date: new Date(date),
      status: { $ne: 'cancelled' },
    }).select('time');
    const bookedTimes = booked.map((b) => b.time);
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

    // Check for double booking
    const exists = await Booking.findOne({ service_id, date: new Date(date), time });
    if (exists) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    const booking = await Booking.create({ user_name, email, service_id, date, time });

    // Send confirmation email (non-blocking)
    sendEmail({
      to: email,
      subject: 'Booking Confirmed – Sérénité Spa',
      html: `<h2>Hi ${user_name},</h2><p>Your booking on <strong>${date}</strong> at <strong>${time}</strong> is confirmed.</p><p>See you soon! 🌿</p>`,
    }).catch(console.error);

    res.status(201).json(booking);
  } catch (err) {
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
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/bookings/:id
const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllBookings, createBooking, updateBookingStatus, deleteBooking, getAvailableSlots };
