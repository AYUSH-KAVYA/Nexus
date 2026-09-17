const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { AppError, catchAsync } = require('../utils/errors');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const signToken = (userId, email, globalRole) => {
  return jwt.sign(
    { userId, email, globalRole },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

router.post('/signup', catchAsync(async (req, res, next) => {
  const { name, email, password, globalRole } = req.body;

  if (!name || !email || !password || !globalRole) {
    return next(new AppError('Please provide name, email, password and globalRole', 400));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Invalid email format', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters', 400));
  }

  const { rows: existingUsers } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUsers.length > 0) {
    return next(new AppError('Email already registered', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash, global_role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, global_role',
    [name, email, passwordHash, globalRole]
  );
  
  const user = rows[0];
  const token = signToken(user.id, user.email, user.global_role);

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      globalRole: user.global_role
    },
    token
  });
}));

router.post('/login', catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = signToken(user.id, user.email, user.global_role);

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      globalRole: user.global_role
    },
    token
  });
}));

router.get('/me', authenticate, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;
