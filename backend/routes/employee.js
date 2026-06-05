const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadEmployeeFiles } = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', restrictTo('ADMIN'), uploadEmployeeFiles, createEmployee);
router.put('/:id', restrictTo('ADMIN'), uploadEmployeeFiles, updateEmployee);
router.delete('/:id', restrictTo('ADMIN'), deleteEmployee);

module.exports = router;
