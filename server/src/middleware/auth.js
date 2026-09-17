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

    const secret = process.env.JWT_SECRET || 'nexus_default_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.global_role, u.organization_id,
              o.name as organization_name
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1`,
      [decoded.userId]
    );
    const user = rows[0];

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      globalRole: user.global_role,
      organizationId: user.organization_id,
      organizationName: user.organization_name
    };
    next();
  } catch (error) {
    return next(new AppError('Invalid token or token has expired', 401));
  }
};

module.exports = { authenticate };
