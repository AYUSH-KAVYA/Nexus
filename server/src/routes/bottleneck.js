const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const { requireProjectAccess } = require('../middleware/rbac');
const { catchAsync } = require('../utils/errors');
const { getBottleneckOwners } = require('../engine/bottleneck');

// GET /
router.get('/', authenticate, requireProjectAccess('pm'), catchAsync(async (req, res) => {
  const { projectId } = req.params;
  
  const result = await getBottleneckOwners(projectId);
  
  res.json(result);
}));

module.exports = router;
