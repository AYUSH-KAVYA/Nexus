const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireProjectMembership, requireProjectAccess } = require('../middleware/rbac');
const { catchAsync } = require('../utils/errors');
const { getImpact } = require('../engine/impact');

// GET /
router.get('/', authenticate, requireProjectMembership(), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { status, search } = req.query;

  let query = `
    SELECT c.*, 
           t.title as task_title, 
           p_s.name as proposed_by_name, p_s.role as proposed_by_role,
           r_s.name as reviewed_by_name
    FROM changes c
    JOIN tasks t ON c.task_id = t.id
    JOIN stakeholders p_s ON c.proposed_by = p_s.id
    LEFT JOIN stakeholders r_s ON c.reviewed_by = r_s.id
    WHERE c.project_id = $1
  `;
  const params = [projectId];
  let paramIndex = 2;

  if (status) {
    query += ` AND c.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (search) {
    query += ` AND (c.description ILIKE $${paramIndex} OR t.title ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  query += ` ORDER BY c.created_at DESC`;

  const result = await pool.query(query, params);
  res.json(result.rows);
}));

// POST /
router.post('/', authenticate, requireProjectMembership(), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { taskId, description } = req.body;
  
  const stakeholder = req.stakeholder;
  const isPrivileged = req.user.globalRole === 'admin' || stakeholder.access_level === 'pm' || stakeholder.access_level === 'admin';
  
  const status = isPrivileged ? 'committed' : 'proposed';

  const client = await pool.connect();
  let impact = null;
  let change = null;
  
  try {
    await client.query('BEGIN');
    
    // Verify task exists
    const taskCheck = await client.query('SELECT title FROM tasks WHERE id = $1 AND project_id = $2', [taskId, projectId]);
    if (taskCheck.rows.length === 0) {
      throw new Error('Task not found in this project');
    }
    const taskTitle = taskCheck.rows[0].title;

    const changeResult = await client.query(
      `INSERT INTO changes (project_id, task_id, description, proposed_by, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, taskId, description, stakeholder.id, status]
    );
    change = changeResult.rows[0];

    if (isPrivileged) {
      impact = await getImpact(taskId, projectId, { dryRun: false });
      
      // Generate alerts for affected stakeholders
      if (impact && impact.affectedStakeholders.length > 0) {
        for (const affected of impact.affectedStakeholders) {
          const message = `Change to "${taskTitle}" affects your task(s). ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`;
          await client.query(
            `INSERT INTO alerts (stakeholder_id, change_id, message) VALUES ($1, $2, $3)`,
            [affected.id, change.id, message]
          );
        }
      }

      // AS-06: Log domain event for committed change
      if (req.user?.organizationId) {
        await client.query(
          `INSERT INTO domain_events (organization_id, event_type, source_app, payload)
           VALUES ($1, 'CHANGE_COMMITTED', 'nexus', $2)`,
          [
            req.user.organizationId,
            JSON.stringify({
              change_id: change.id,
              project_id: projectId,
              task_id: taskId,
              description,
              blast_radius_score: impact?.blastRadiusScore || 0,
              blast_radius_level: impact?.blastRadiusLevel || 'low'
            })
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.status(201).json({ change, ...(isPrivileged && { impact }), status });
}));

// POST /:changeId/approve
router.post('/:changeId/approve', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId, changeId } = req.params;

  const client = await pool.connect();
  let change, impact;

  try {
    await client.query('BEGIN');

    const changeResult = await client.query(
      `SELECT c.*, t.title as task_title 
       FROM changes c 
       JOIN tasks t ON c.task_id = t.id 
       WHERE c.id = $1 AND c.project_id = $2 AND c.status = 'proposed'`,
      [changeId, projectId]
    );

    if (changeResult.rows.length === 0) {
      throw new Error('Proposed change not found');
    }
    change = changeResult.rows[0];

    const updatedChangeResult = await client.query(
      `UPDATE changes 
       SET status = 'committed', reviewed_by = $1, reviewed_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [req.stakeholder.id, changeId]
    );
    const updatedChange = updatedChangeResult.rows[0];

    impact = await getImpact(change.task_id, projectId, { dryRun: false });

    // Alerts for affected
    if (impact && impact.affectedStakeholders.length > 0) {
      for (const affected of impact.affectedStakeholders) {
        const message = `Change to "${change.task_title}" affects your task(s). ${change.description.substring(0, 50)}${change.description.length > 50 ? '...' : ''}`;
        await client.query(
          `INSERT INTO alerts (stakeholder_id, change_id, message) VALUES ($1, $2, $3)`,
          [affected.id, changeId, message]
        );
      }
    }

    // Alert for proposer
    await client.query(
      `INSERT INTO alerts (stakeholder_id, change_id, message) VALUES ($1, $2, $3)`,
      [change.proposed_by, changeId, `Your proposed change to "${change.task_title}" has been approved`]
    );

    // AS-06: Log domain event for approved committed change
    if (req.user?.organizationId) {
      await client.query(
        `INSERT INTO domain_events (organization_id, event_type, source_app, payload)
         VALUES ($1, 'CHANGE_COMMITTED', 'nexus', $2)`,
        [
          req.user.organizationId,
          JSON.stringify({
            change_id: changeId,
            project_id: projectId,
            task_id: change.task_id,
            description: change.description,
            reviewed_by: req.stakeholder.id,
            blast_radius_score: impact?.blastRadiusScore || 0,
            blast_radius_level: impact?.blastRadiusLevel || 'low'
          })
        ]
      );
    }

    await client.query('COMMIT');
    
    res.json({ change: updatedChange, impact });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// POST /:changeId/reject
router.post('/:changeId/reject', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId, changeId } = req.params;

  const client = await pool.connect();
  let change;

  try {
    await client.query('BEGIN');

    const changeResult = await client.query(
      `SELECT c.*, t.title as task_title 
       FROM changes c 
       JOIN tasks t ON c.task_id = t.id 
       WHERE c.id = $1 AND c.project_id = $2 AND c.status = 'proposed'`,
      [changeId, projectId]
    );

    if (changeResult.rows.length === 0) {
      throw new Error('Proposed change not found');
    }
    const currentChange = changeResult.rows[0];

    const updatedChangeResult = await client.query(
      `UPDATE changes 
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [req.stakeholder.id, changeId]
    );
    change = updatedChangeResult.rows[0];

    // Alert for proposer
    await client.query(
      `INSERT INTO alerts (stakeholder_id, change_id, message) VALUES ($1, $2, $3)`,
      [currentChange.proposed_by, changeId, `Your proposed change to "${currentChange.task_title}" has been rejected`]
    );

    await client.query('COMMIT');
    
    res.json({ change });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// GET /pending
router.get('/pending', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId } = req.params;

  const result = await pool.query(
    `SELECT c.*, 
           t.title as task_title, 
           p_s.name as proposed_by_name, p_s.role as proposed_by_role
    FROM changes c
    JOIN tasks t ON c.task_id = t.id
    JOIN stakeholders p_s ON c.proposed_by = p_s.id
    WHERE c.project_id = $1 AND c.status = 'proposed'
    ORDER BY c.created_at ASC`,
    [projectId]
  );
  
  res.json(result.rows);
}));

module.exports = router;
