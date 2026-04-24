const User = require('../models/User');

// GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, createUser };
