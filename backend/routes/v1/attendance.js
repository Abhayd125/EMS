const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance
} = require('../../controllers/attendanceController');
const { protect, restrictTo } = require('../../middleware/authMiddleware');

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/my-logs', getMyAttendance);

// HR/Admin only endpoint to view and review employee logs
router.get('/registry', restrictTo('ADMIN', 'HR'), getAllAttendance);

module.exports = router;
