const pool = require('../config/db');

async function getImpact(taskId, projectId, options = {}) {
  const { dryRun = true } = options;

  // 1. Fetch ALL dependencies for the project
  const depsResult = await pool.query(
    'SELECT from_task_id, to_task_id FROM dependencies WHERE project_id = $1',
    [projectId]
  );
  const dependencies = depsResult.rows;

  // 2. Build adjacency list: from_task_id -> [to_task_id, ...]
  const adjList = {};
  for (const dep of dependencies) {
    if (!adjList[dep.from_task_id]) {
      adjList[dep.from_task_id] = [];
    }
    adjList[dep.from_task_id].push(dep.to_task_id);
  }

  // 3. BFS from taskId
  const visited = new Set();
  const queue = [{ id: taskId, depth: 0 }];
  const affectedNodes = []; // { id, depth }
  
  // Do not include the root task in affected count, just its downstream
  while (queue.length > 0) {
    const current = queue.shift();
    
    if (current.id !== taskId) {
      affectedNodes.push(current);
    }
    
    const children = adjList[current.id] || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push({ id: childId, depth: current.depth + 1 });
      }
    }
  }

  const affectedTaskIds = affectedNodes.map(n => n.id);
  
  if (affectedTaskIds.length === 0) {
    return {
      affectedTasks: [],
      affectedStakeholders: [],
      affectedApprovals: [],
      blastRadiusScore: 0,
      blastRadiusLevel: 'low',
      directCount: 0,
      indirectCount: 0,
      approvalGatesReopened: 0
    };
  }

  // 4. Fetch task details + owner info
  const tasksResult = await pool.query(
    `SELECT t.id, t.title, t.description, t.tags, t.status, t.owner_id, 
            s.name as owner_name, s.role as owner_role, s.email as owner_email 
     FROM tasks t 
     LEFT JOIN stakeholders s ON t.owner_id = s.id 
     WHERE t.id = ANY($1)`,
    [affectedTaskIds]
  );
  
  const tasksById = {};
  for (const t of tasksResult.rows) {
    tasksById[t.id] = t;
  }

  const affectedTasks = affectedNodes.map(node => {
    const t = tasksById[node.id];
    return {
      ...t,
      depth: node.depth
    };
  });

  // 5. Deduplicate stakeholders
  const stakeholdersMap = {};
  for (const t of tasksResult.rows) {
    if (t.owner_id && !stakeholdersMap[t.owner_id]) {
      stakeholdersMap[t.owner_id] = {
        id: t.owner_id,
        name: t.owner_name,
        role: t.owner_role,
        email: t.owner_email
      };
    }
  }
  const affectedStakeholders = Object.values(stakeholdersMap);

  // 6. Fetch approvals
  const approvalsResult = await pool.query(
    `SELECT a.id, a.task_id, a.required_from, a.status, 
            t.title as task_title, s.name as stakeholder_name 
     FROM approvals a 
     JOIN tasks t ON a.task_id = t.id 
     JOIN stakeholders s ON a.required_from = s.id 
     WHERE a.task_id = ANY($1)`,
    [affectedTaskIds]
  );
  const affectedApprovals = approvalsResult.rows;

  // Calculate metrics
  let directCount = 0;
  let indirectCount = 0;
  for (const n of affectedNodes) {
    if (n.depth === 1) directCount++;
    else indirectCount++;
  }

  const approvedApprovalsCount = affectedApprovals.filter(a => a.status === 'approved').length;
  
  // 7. Calculate blast radius
  const score = directCount + (indirectCount * 0.5) + (approvedApprovalsCount * 2);
  let level = 'low';
  if (score >= 3 && score <= 6) level = 'medium';
  else if (score > 6) level = 'high';

  // Side effects
  if (!dryRun) {
    await pool.query(
      `UPDATE approvals 
       SET status = 'pending', decided_at = NULL 
       WHERE task_id = ANY($1) AND status = 'approved'`,
      [affectedTaskIds]
    );
  }

  return {
    affectedTasks,
    affectedStakeholders,
    affectedApprovals,
    blastRadiusScore: score,
    blastRadiusLevel: level,
    directCount,
    indirectCount,
    approvalGatesReopened: approvedApprovalsCount
  };
}

module.exports = { getImpact };
