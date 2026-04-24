const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Massage', 'Facials', 'Body Treatments'],
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
