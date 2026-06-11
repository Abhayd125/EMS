const payrollService = require('../services/PayrollService');
const AppError = require('../utils/AppError');

const getPayrolls = async (req, res, next) => {
  try {
    const { role, id: userId, employee } = req.user;
    
    // Admin/HR can fetch all payrolls or filter by query
    if (role === 'ADMIN' || role === 'HR') {
      const { employeeId } = req.query;
      if (employeeId) {
        const payrolls = await payrollService.getEmployeePayroll(employeeId);
        return res.status(200).json({ payrolls });
      }
      const payrolls = await payrollService.getAllPayroll();
      return res.status(200).json({ payrolls });
    }

    // Employees can only fetch their own payrolls
    if (!employee) {
      throw new AppError('Employee profile not linked to user', 404);
    }
    const payrolls = await payrollService.getEmployeePayroll(employee.id);
    res.status(200).json({ payrolls });
  } catch (error) {
    next(error);
  }
};

const updatePayroll = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const payroll = await payrollService.createOrUpdatePayroll(employeeId, req.body);
    res.status(200).json({
      message: 'Payroll record updated successfully',
      payroll
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayrolls,
  updatePayroll
};
