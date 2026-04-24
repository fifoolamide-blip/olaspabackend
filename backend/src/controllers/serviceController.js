const Service = require('../models/Service');

// GET /api/services
const getAllServices = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const services = await Service.find(filter).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    next(err);
  }
};

// GET /api/services/:id
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    next(err);
  }
};

// POST /api/services
const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
};

// PUT /api/services/:id
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/services/:id
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deactivated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllServices, getServiceById, createService, updateService, deleteService };
