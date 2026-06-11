const performanceService = require('../services/PerformanceService');
const AppError = require('../utils/AppError');

const getPerformances = async (req, res, next) => {
  try {
    const { role, employee } = req.user;

    // Admin/HR can fetch all performance reviews or filter by query
    if (role === 'ADMIN' || role === 'HR') {
      const { employeeId } = req.query;
      if (employeeId) {
        const performances = await performanceService.getEmployeePerformance(employeeId);
        return res.status(200).json({ performances });
      }
      const performances = await performanceService.getAllPerformance();
      return res.status(200).json({ performances });
    }

    // Employees can only fetch their own performance history
    if (!employee) {
      throw new AppError('Employee profile not linked to user', 404);
    }
    const performances = await performanceService.getEmployeePerformance(employee.id);
    res.status(200).json({ performances });
  } catch (error) {
    next(error);
  }
};

const createPerformance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const performance = await performanceService.createOrUpdatePerformance(employeeId, req.body);
    res.status(201).json({
      message: 'Performance review logged successfully',
      performance
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPerformances,
  createPerformance
};
