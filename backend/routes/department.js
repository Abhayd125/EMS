const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// All department routes are protected (logged in users only)
router.use(protect);

router.get('/', getDepartments);
router.post('/', restrictTo('ADMIN'), createDepartment);
router.put('/:id', restrictTo('ADMIN'), updateDepartment);
router.delete('/:id', restrictTo('ADMIN'), deleteDepartment);

module.exports = router;
