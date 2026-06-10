const employeeService = require('../services/EmployeeService');

const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body, req.files, req.user);
    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (error) {
    next(error);
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.getEmployees(req.query);
    res.status(200).json({ employees: result.data, total: result.total, page: result.page, limit: result.limit });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.status(200).json({ employee });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body, req.files, req.user);
    res.status(200).json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    await employeeService.deleteEmployee(req.params.id, req.user);
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
