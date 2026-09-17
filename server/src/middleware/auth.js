const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { AppError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query('SELECT id, name, email, global_role FROM users WHERE id = $1', [decoded.userId]);
    const user = rows[0];

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      globalRole: user.global_role
    };
    next();
  } catch (error) {
    return next(new AppError('Invalid token or token has expired', 401));
  }
};

module.exports = { authenticate };
