const express = require('express');
const router = express.Router();
const {
  getLeaveBalance,
  applyLeave,
  getMyLeaves,
  getPendingApprovals,
  reviewManager,
  reviewHR,
  getLeavesStats
} = require('../../controllers/leaveController');
const { protect, restrictTo } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validationMiddleware');
const {
  applyLeaveSchema,
  reviewLeaveSchema
} = require('../../validators/leaveValidator');

router.use(protect);

router.get('/balance', getLeaveBalance);
router.post('/apply', validate(applyLeaveSchema), applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/approvals', restrictTo('MANAGER', 'HR', 'ADMIN'), getPendingApprovals);
router.put('/review/manager/:id', restrictTo('MANAGER', 'ADMIN'), validate(reviewLeaveSchema), reviewManager);
router.put('/review/hr/:id', restrictTo('HR', 'ADMIN'), validate(reviewLeaveSchema), reviewHR);
router.get('/stats', getLeavesStats);

module.exports = router;
