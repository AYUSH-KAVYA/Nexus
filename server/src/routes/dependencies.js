const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireProjectAccess } = require('../middleware/rbac');
const { catchAsync } = require('../utils/errors');

// POST /
router.post('/', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { fromTaskId, toTaskId, dependencyType = 'blocks' } = req.body;

  const result = await pool.query(
    `INSERT INTO dependencies (project_id, from_task_id, to_task_id, dependency_type)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [projectId, fromTaskId, toTaskId, dependencyType]
  );

  res.status(201).json(result.rows[0]);
}));

// DELETE /:dependencyId
router.delete('/:dependencyId', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId, dependencyId } = req.params;

  await pool.query(
    'DELETE FROM dependencies WHERE id = $1 AND project_id = $2',
    [dependencyId, projectId]
  );

  res.status(204).send();
}));

module.exports = router;
