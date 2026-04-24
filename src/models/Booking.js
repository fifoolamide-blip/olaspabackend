const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time slot is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent double booking: same service, date, time
bookingSchema.index({ service_id: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
