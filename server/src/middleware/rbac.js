const pool = require('../config/db');
const { AppError, catchAsync } = require('../utils/errors');

const accessLevels = {
  view_only: 0,
  pm: 1,
  admin: 2
};

const requireGlobalRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.globalRole)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

const requireProjectAccess = (minLevelStr) => {
  return catchAsync(async (req, res, next) => {
    if (req.user.globalRole === 'admin') {
      // Still look up stakeholder record if admin is a member of this project
      const projectId = req.params.projectId;
      if (projectId) {
        const { rows } = await pool.query(
          'SELECT * FROM stakeholders WHERE project_id = $1 AND user_id = $2',
          [projectId, req.user.id]
        );
        if (rows[0]) req.stakeholder = rows[0];
      }
      return next();
    }

    const projectId = req.params.projectId;
    const minLevel = accessLevels[minLevelStr];

    const { rows } = await pool.query(
      'SELECT * FROM stakeholders WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    const stakeholder = rows[0];

    if (!stakeholder) {
      return next(new AppError('You do not have access to this project', 403));
    }

    const userLevel = accessLevels[stakeholder.access_level];

    if (userLevel < minLevel) {
      return next(new AppError('You do not have sufficient permissions for this project', 403));
    }

    req.stakeholder = stakeholder;
    next();
  });
};

const requireProjectMembership = () => requireProjectAccess('view_only');

module.exports = {
  requireGlobalRole,
  requireProjectAccess,
  requireProjectMembership
};
