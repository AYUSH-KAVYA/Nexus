const pool = require('../config/db');
const { AppError } = require('../utils/errors');

/**
 * Middleware factory: requireAppEntitlement('nexus') or requireAppEntitlement('nexus_signal')
 * Checks organization_apps to determine if the requesting user's org has access to this app.
 */
const requireAppEntitlement = (appName) => {
  return async (req, res, next) => {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return next(new AppError('No organization associated with your account.', 403));
      }

      const { rows } = await pool.query(
        'SELECT enabled FROM organization_apps WHERE organization_id = $1 AND app_name = $2',
        [orgId, appName]
      );

      if (rows.length === 0 || !rows[0].enabled) {
        return next(new AppError(
          `This app is not enabled for your organization.`,
          403
        ));
      }

      next();
    } catch (error) {
      return next(new AppError('Failed to verify app entitlement.', 500));
    }
  };
};

module.exports = { requireAppEntitlement };
