const express = require('express');
const router = express.Router();
const {
  getEmployeeReport,
  getLeaveReport,
  getAssetReport
} = require('../../controllers/reportController');
const { protect, restrictTo } = require('../../middleware/authMiddleware');

router.use(protect);
router.use(restrictTo('ADMIN', 'HR'));

router.get('/employees', getEmployeeReport);
router.get('/leaves', getLeaveReport);
router.get('/assets', getAssetReport);

module.exports = router;
