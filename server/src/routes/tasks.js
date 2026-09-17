const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireProjectMembership, requireProjectAccess } = require('../middleware/rbac');
const { catchAsync } = require('../utils/errors');

// GET /
router.get('/', authenticate, requireProjectMembership(), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { status, owner_id, tag } = req.query;

  let query = `
    SELECT t.*, s.name as owner_name, s.role as owner_role
    FROM tasks t
    LEFT JOIN stakeholders s ON t.owner_id = s.id
    WHERE t.project_id = $1
  `;
  const params = [projectId];
  let paramIndex = 2;

  if (status) {
    query += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }
  if (owner_id) {
    query += ` AND t.owner_id = $${paramIndex++}`;
    params.push(owner_id);
  }
  if (tag) {
    query += ` AND $${paramIndex++} = ANY(t.tags)`;
    params.push(tag);
  }

  query += ` ORDER BY t.created_at DESC`;

  const tasksResult = await pool.query(query, params);
  const tasks = tasksResult.rows;

  if (tasks.length > 0) {
    const taskIds = tasks.map(t => t.id);
    
    // Fetch dependencies
    const depsResult = await pool.query(
      `SELECT * FROM dependencies WHERE project_id = $1`,
      [projectId]
    );
    
    // Fetch approvals
    const approvalsResult = await pool.query(
      `SELECT * FROM approvals WHERE task_id = ANY($1)`,
      [taskIds]
    );

    // Attach to tasks
    const depsMap = { incoming: {}, outgoing: {} };
    for (const d of depsResult.rows) {
      if (!depsMap.outgoing[d.from_task_id]) depsMap.outgoing[d.from_task_id] = [];
      depsMap.outgoing[d.from_task_id].push(d);
      
      if (!depsMap.incoming[d.to_task_id]) depsMap.incoming[d.to_task_id] = [];
      depsMap.incoming[d.to_task_id].push(d);
    }

    const approvalsMap = {};
    for (const a of approvalsResult.rows) {
      if (!approvalsMap[a.task_id]) approvalsMap[a.task_id] = [];
      approvalsMap[a.task_id].push(a);
    }

    for (const task of tasks) {
      task.dependencies = {
        incoming: depsMap.incoming[task.id] || [],
        outgoing: depsMap.outgoing[task.id] || []
      };
      task.approvals = approvalsMap[task.id] || [];
    }
  }

  res.json(tasks);
}));

// POST /
router.post('/', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, ownerId, tags, dependsOn, requiresApprovalFrom } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert task
    const taskResult = await client.query(
      `INSERT INTO tasks (project_id, title, description, status, owner_id, tags) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, title, description, 'pending', ownerId || null, tags || []]
    );
    const task = taskResult.rows[0];

    // Insert dependencies
    if (dependsOn && dependsOn.length > 0) {
      for (const fromId of dependsOn) {
        await client.query(
          `INSERT INTO dependencies (project_id, from_task_id, to_task_id, dependency_type)
           VALUES ($1, $2, $3, $4)`,
          [projectId, fromId, task.id, 'blocks']
        );
      }
    }

    // Insert approvals
    if (requiresApprovalFrom && requiresApprovalFrom.length > 0) {
      for (const stakeholderId of requiresApprovalFrom) {
        await client.query(
          `INSERT INTO approvals (task_id, required_from, status)
           VALUES ($1, $2, $3)`,
          [task.id, stakeholderId, 'pending']
        );
      }
    }

    await client.query('COMMIT');
    
    // Fetch complete data
    task.dependencies = { incoming: [], outgoing: [] };
    
    if (dependsOn && dependsOn.length > 0) {
      const d = await client.query(`SELECT * FROM dependencies WHERE to_task_id = $1`, [task.id]);
      task.dependencies.incoming = d.rows;
    }
    
    if (requiresApprovalFrom && requiresApprovalFrom.length > 0) {
      const a = await client.query(`SELECT * FROM approvals WHERE task_id = $1`, [task.id]);
      task.approvals = a.rows;
    } else {
      task.approvals = [];
    }

    res.status(201).json(task);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// PATCH /:taskId
router.patch('/:taskId', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, description, status, ownerId, tags } = req.body;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) { fields.push(`title = $${paramIndex++}`); values.push(title); }
  if (description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(description); }
  if (status !== undefined) { fields.push(`status = $${paramIndex++}`); values.push(status); }
  if (ownerId !== undefined) { fields.push(`owner_id = $${paramIndex++}`); values.push(ownerId); }
  if (tags !== undefined) { fields.push(`tags = $${paramIndex++}`); values.push(tags); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  values.push(taskId, projectId);
  
  const query = `
    UPDATE tasks 
    SET ${fields.join(', ')} 
    WHERE id = $${paramIndex} AND project_id = $${paramIndex + 1}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
  
  res.json(result.rows[0]);
}));

// GET /:taskId/suggestions
router.get('/:taskId/suggestions', authenticate, requireProjectMembership(), catchAsync(async (req, res) => {
  const { projectId, taskId } = req.params;

  // Find tasks sharing at least one tag that are NOT linked by dependency
  const result = await pool.query(
    `SELECT t.id, t.title, t.tags, 
       ARRAY(
         SELECT unnest(t.tags) INTERSECT SELECT unnest(t2.tags)
       ) as shared_tags
     FROM tasks t
     JOIN tasks t2 ON t2.id = $1
     WHERE t.project_id = $2 
       AND t.id != $1
       AND t.tags && t2.tags
       AND NOT EXISTS (
         SELECT 1 FROM dependencies d 
         WHERE (d.from_task_id = t.id AND d.to_task_id = $1) 
            OR (d.from_task_id = $1 AND d.to_task_id = t.id)
       )
     LIMIT 5`,
    [taskId, projectId]
  );

  const suggestions = result.rows.map(r => ({
    task: { id: r.id, title: r.title, tags: r.tags },
    sharedTags: r.shared_tags
  }));

  res.json(suggestions);
}));

module.exports = router;
