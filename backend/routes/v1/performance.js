const express = require('express');
const router = express.Router();
const { getPerformances, createPerformance } = require('../../controllers/performanceController');
const { protect, restrictTo } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', getPerformances);
router.post('/:employeeId', restrictTo('ADMIN', 'HR'), createPerformance);

module.exports = router;
