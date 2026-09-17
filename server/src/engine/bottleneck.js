const pool = require('../config/db');

async function getBottleneckOwners(projectId) {
  // 1. Fetch all dependencies and tasks for the project
  const depsResult = await pool.query(
    'SELECT from_task_id, to_task_id FROM dependencies WHERE project_id = $1',
    [projectId]
  );
  
  const tasksResult = await pool.query(
    'SELECT id, title, owner_id FROM tasks WHERE project_id = $1',
    [projectId]
  );

  const dependencies = depsResult.rows;
  const tasks = tasksResult.rows;

  // 2. Build adjacency list
  const adjList = {};
  for (const t of tasks) {
    adjList[t.id] = [];
  }
  for (const dep of dependencies) {
    if (adjList[dep.from_task_id]) {
      adjList[dep.from_task_id].push(dep.to_task_id);
    }
  }

  // 3. Compute BFS reach for each task
  const taskReach = {}; // taskId -> number of reachable downstream tasks
  
  for (const task of tasks) {
    const visited = new Set();
    const queue = [task.id];
    let reachCount = 0;
    
    while (queue.length > 0) {
      const current = queue.shift();
      const children = adjList[current] || [];
      
      for (const child of children) {
        if (!visited.has(child)) {
          visited.add(child);
          queue.push(child);
          reachCount++;
        }
      }
    }
    taskReach[task.id] = reachCount;
  }

  // 4. Group by owner_id and sum reach
  const ownerReach = {}; // ownerId -> total reach
  const ownerTasks = {}; // ownerId -> [{ id, title, reach }]
  
  for (const task of tasks) {
    if (!task.owner_id) continue;
    
    if (!ownerReach[task.owner_id]) {
      ownerReach[task.owner_id] = 0;
      ownerTasks[task.owner_id] = [];
    }
    
    const reach = taskReach[task.id];
    ownerReach[task.owner_id] += reach;
    ownerTasks[task.owner_id].push({
      id: task.id,
      title: task.title,
      reach: reach
    });
  }

  // Sort tasks within each owner by reach descending
  for (const ownerId in ownerTasks) {
    ownerTasks[ownerId].sort((a, b) => b.reach - a.reach);
  }

  // 5. Fetch stakeholder details
  const ownerIds = Object.keys(ownerReach);
  if (ownerIds.length === 0) return [];
  
  const stakeholdersResult = await pool.query(
    'SELECT id, name, role FROM stakeholders WHERE id = ANY($1)',
    [ownerIds]
  );
  
  const stakeholderMap = {};
  for (const s of stakeholdersResult.rows) {
    stakeholderMap[s.id] = s;
  }

  // Assemble result and sort by total reach
  const results = [];
  for (const ownerId of ownerIds) {
    if (stakeholderMap[ownerId]) {
      results.push({
        stakeholder: stakeholderMap[ownerId],
        downstreamTaskCount: ownerReach[ownerId],
        tasks: ownerTasks[ownerId]
      });
    }
  }
  
  results.sort((a, b) => b.downstreamTaskCount - a.downstreamTaskCount);

  // 6. Return top 3
  return results.slice(0, 3);
}

module.exports = { getBottleneckOwners };
