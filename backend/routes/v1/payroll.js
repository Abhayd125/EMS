const express = require('express');
const router = express.Router();
const { getPayrolls, updatePayroll } = require('../../controllers/payrollController');
const { protect, restrictTo } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', getPayrolls);
router.put('/:employeeId', restrictTo('ADMIN', 'HR'), updatePayroll);

module.exports = router;
