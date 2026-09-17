const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireProjectMembership, requireProjectAccess } = require('../middleware/rbac');
const { catchAsync } = require('../utils/errors');

// GET /
router.get('/', authenticate, requireProjectMembership(), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const result = await pool.query(
    `SELECT s.*, u.email as user_account_email 
     FROM stakeholders s 
     LEFT JOIN users u ON s.user_id = u.id 
     WHERE s.project_id = $1
     ORDER BY s.created_at ASC`,
    [projectId]
  );
  res.json(result.rows);
}));

// POST /
router.post('/', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { name, email, role, accessLevel, userId } = req.body;
  
  const result = await pool.query(
    `INSERT INTO stakeholders (project_id, name, email, role, access_level, user_id) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [projectId, name, email, role, accessLevel, userId || null]
  );
  
  res.status(201).json(result.rows[0]);
}));

// POST /bulk
router.post('/bulk', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { stakeholders } = req.body;
  
  if (!stakeholders || !Array.isArray(stakeholders)) {
    return res.status(400).json({ error: 'Invalid stakeholders array' });
  }

  const created = [];
  for (const s of stakeholders) {
    const result = await pool.query(
      `INSERT INTO stakeholders (project_id, name, email, role, access_level, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, s.name, s.email, s.role, s.accessLevel, s.userId || null]
    );
    created.push(result.rows[0]);
  }
  
  res.status(201).json(created);
}));

// DELETE /:stakeholderId
router.delete('/:stakeholderId', authenticate, requireProjectAccess('admin'), catchAsync(async (req, res) => {
  const { projectId, stakeholderId } = req.params;
  
  await pool.query(
    'DELETE FROM stakeholders WHERE id = $1 AND project_id = $2',
    [stakeholderId, projectId]
  );
  
  res.status(204).send();
}));

module.exports = router;
