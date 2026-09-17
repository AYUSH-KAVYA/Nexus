const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const { requireProjectMembership } = require('../middleware/rbac');
const { catchAsync } = require('../utils/errors');
const { getImpact } = require('../engine/impact');

// GET /tasks/:taskId
router.get('/tasks/:taskId', authenticate, requireProjectMembership(), catchAsync(async (req, res) => {
  const { projectId, taskId } = req.params;
  
  const impact = await getImpact(taskId, projectId, { dryRun: true });
  
  res.json(impact);
}));

module.exports = router;
