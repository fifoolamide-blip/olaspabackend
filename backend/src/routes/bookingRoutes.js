const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  createBooking,
  updateBookingStatus,
  deleteBooking,
  getAvailableSlots,
} = require('../controllers/bookingController');

router.get('/', getAllBookings);
router.get('/availability', getAvailableSlots);
router.post('/', createBooking);
router.patch('/:id', updateBookingStatus);
router.delete('/:id', deleteBooking);

module.exports = router;
