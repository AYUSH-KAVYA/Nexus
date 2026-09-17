const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireGlobalRole, requireProjectMembership } = require('../middleware/rbac');
const { catchAsync } = require('../utils/errors');

// GET /
router.get('/', authenticate, catchAsync(async (req, res) => {
  let query = `
    SELECT p.id, p.name, p.description, p.created_at,
           COUNT(DISTINCT s.id) as stakeholder_count,
           COUNT(DISTINCT t.id) as task_count,
           GREATEST(MAX(t.created_at), MAX(c.created_at), p.created_at) as last_activity
    FROM projects p
    LEFT JOIN stakeholders s ON p.id = s.project_id
    LEFT JOIN tasks t ON p.id = t.project_id
    LEFT JOIN changes c ON p.id = c.project_id
  `;
  const queryParams = [];

  if (req.user.globalRole !== 'admin') {
    query += ` WHERE p.id IN (SELECT project_id FROM stakeholders WHERE user_id = $1) `;
    queryParams.push(req.user.id);
  }

  query += ` GROUP BY p.id ORDER BY last_activity DESC, p.created_at DESC`;

  const result = await pool.query(query, queryParams);
  res.json(result.rows);
}));

// POST /
router.post('/', authenticate, requireGlobalRole('admin'), catchAsync(async (req, res) => {
  const { name, description } = req.body;
  const result = await pool.query(
    'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
    [name, description, req.user.id]
  );
  res.status(201).json(result.rows[0]);
}));

// GET /:projectId
router.get('/:projectId', authenticate, requireProjectMembership(), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  
  const result = await pool.query(
    `SELECT p.*, 
            COUNT(DISTINCT s.id) as stakeholder_count,
            COUNT(DISTINCT t.id) as task_count
     FROM projects p
     LEFT JOIN stakeholders s ON p.id = s.project_id
     LEFT JOIN tasks t ON p.id = t.project_id
     WHERE p.id = $1
     GROUP BY p.id`,
    [projectId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json(result.rows[0]);
}));

module.exports = router;
