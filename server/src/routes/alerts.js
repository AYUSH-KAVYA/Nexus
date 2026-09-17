const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { catchAsync } = require('../utils/errors');

// GET /
router.get('/', authenticate, catchAsync(async (req, res) => {
  // Find all stakeholder IDs for this user
  const stakeholdersResult = await pool.query(
    'SELECT id FROM stakeholders WHERE user_id = $1',
    [req.user.id]
  );
  
  if (stakeholdersResult.rows.length === 0) {
    return res.json({ alerts: [], unreadCount: 0 });
  }
  
  const stakeholderIds = stakeholdersResult.rows.map(s => s.id);
  
  // Get alerts
  const alertsResult = await pool.query(
    `SELECT a.*, c.description as change_description, c.status as change_status
     FROM alerts a
     LEFT JOIN changes c ON a.change_id = c.id
     WHERE a.stakeholder_id = ANY($1)
     ORDER BY a.created_at DESC`,
    [stakeholderIds]
  );
  
  const alerts = alertsResult.rows;
  const unreadCount = alerts.filter(a => !a.is_read).length;
  
  res.json({ alerts, unreadCount });
}));

// PATCH /:alertId/read
router.patch('/:alertId/read', authenticate, catchAsync(async (req, res) => {
  const { alertId } = req.params;
  
  const stakeholdersResult = await pool.query(
    'SELECT id FROM stakeholders WHERE user_id = $1',
    [req.user.id]
  );
  const stakeholderIds = stakeholdersResult.rows.map(s => s.id);

  const result = await pool.query(
    `UPDATE alerts 
     SET is_read = true 
     WHERE id = $1 AND stakeholder_id = ANY($2) 
     RETURNING *`,
    [alertId, stakeholderIds]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Alert not found or access denied' });
  }
  
  res.json(result.rows[0]);
}));

// PATCH /read-all
router.patch('/read-all', authenticate, catchAsync(async (req, res) => {
  const stakeholdersResult = await pool.query(
    'SELECT id FROM stakeholders WHERE user_id = $1',
    [req.user.id]
  );
  
  if (stakeholdersResult.rows.length === 0) {
    return res.json({ updated: 0 });
  }
  
  const stakeholderIds = stakeholdersResult.rows.map(s => s.id);

  const result = await pool.query(
    `UPDATE alerts 
     SET is_read = true 
     WHERE stakeholder_id = ANY($1) AND is_read = false`,
    [stakeholderIds]
  );
  
  res.json({ updated: result.rowCount });
}));

module.exports = router;
