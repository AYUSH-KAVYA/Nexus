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
    `SELECT a.*, t.title as task_title, s.name as stakeholder_name, s.role as stakeholder_role
     FROM approvals a
     JOIN tasks t ON a.task_id = t.id
     JOIN stakeholders s ON a.required_from = s.id
     WHERE t.project_id = $1
     ORDER BY a.id ASC`,
    [projectId]
  );

  res.json(result.rows);
}));

// GET /pending
router.get('/pending', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId } = req.params;

  const result = await pool.query(
    `SELECT a.*, t.title as task_title, s.name as stakeholder_name, s.role as stakeholder_role
     FROM approvals a
     JOIN tasks t ON a.task_id = t.id
     JOIN stakeholders s ON a.required_from = s.id
     WHERE t.project_id = $1 AND a.status = 'pending'
     ORDER BY a.id ASC`,
    [projectId]
  );

  res.json(result.rows);
}));

module.exports = router;
