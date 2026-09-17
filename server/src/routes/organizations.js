const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireGlobalRole } = require('../middleware/rbac');
const { AppError, catchAsync } = require('../utils/errors');

// GET /api/organizations/:id/apps — enabled apps for an organization
router.get('/:id/apps', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    `SELECT app_name, enabled, enabled_at, disabled_at
     FROM organization_apps
     WHERE organization_id = $1
     ORDER BY app_name`,
    [id]
  );

  res.json(rows);
}));

// PATCH /api/organizations/:id/apps/:app_name — toggle app enabled/disabled (admin only)
router.patch('/:id/apps/:app_name', authenticate, requireGlobalRole('admin'), catchAsync(async (req, res, next) => {
  const { id, app_name } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return next(new AppError('enabled must be a boolean', 400));
  }

  // Verify the requesting admin belongs to this organization
  if (req.user.organizationId !== id) {
    return next(new AppError('You can only manage your own organization.', 403));
  }

  const { rows } = await pool.query(
    `UPDATE organization_apps
     SET enabled = $1,
         enabled_at = CASE WHEN $1 = true THEN NOW() ELSE enabled_at END,
         disabled_at = CASE WHEN $1 = false THEN NOW() ELSE NULL END
     WHERE organization_id = $2 AND app_name = $3
     RETURNING *`,
    [enabled, id, app_name]
  );

  if (rows.length === 0) {
    // If the record doesn't exist, create it
    const insertResult = await pool.query(
      `INSERT INTO organization_apps (organization_id, app_name, enabled, enabled_at, disabled_at)
       VALUES ($1, $2, $3, CASE WHEN $3 = true THEN NOW() ELSE NULL END, CASE WHEN $3 = false THEN NOW() ELSE NULL END)
       RETURNING *`,
      [id, app_name, enabled]
    );
    return res.json(insertResult.rows[0]);
  }

  // Log domain event for entitlement change
  await pool.query(
    `INSERT INTO domain_events (organization_id, event_type, source_app, payload)
     VALUES ($1, $2, 'platform', $3)`,
    [
      id,
      enabled ? 'APP_ENABLED' : 'APP_DISABLED',
      JSON.stringify({ app_name, enabled, toggled_by: req.user.name })
    ]
  );

  res.json(rows[0]);
}));

// GET /api/organizations/:id/events — recent domain events
router.get('/:id/events', authenticate, catchAsync(async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  const { rows } = await pool.query(
    `SELECT id, organization_id, event_type, source_app, payload, created_at
     FROM domain_events
     WHERE organization_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [id, limit]
  );

  res.json(rows);
}));

// GET /api/organizations/:id — organization details
router.get('/:id', authenticate, catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    'SELECT id, name, created_at FROM organizations WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    return next(new AppError('Organization not found', 404));
  }

  res.json(rows[0]);
}));

module.exports = router;
