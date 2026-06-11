const prisma = require('../database/db');
const AppError = require('../utils/AppError');

class PayrollService {
  async getAllPayroll() {
    const payrolls = await prisma.payroll.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { payMonth: 'desc' }
    });
    return payrolls;
  }

  async getEmployeePayroll(employeeId) {
    const targetEmpId = parseInt(employeeId);
    if (isNaN(targetEmpId)) {
      throw new AppError('Invalid employee ID', 400);
    }
    const payrolls = await prisma.payroll.findMany({
      where: { employeeId: targetEmpId },
      orderBy: { payMonth: 'desc' }
    });
    return payrolls;
  }

  async createOrUpdatePayroll(employeeId, data) {
    const targetEmpId = parseInt(employeeId);
    if (isNaN(targetEmpId)) {
      throw new AppError('Invalid employee ID', 400);
    }

    const { baseSalary, allowance, pf, tds, payMonth, status } = data;

    if (baseSalary === undefined || !payMonth) {
      throw new AppError('Base salary and pay month are required', 400);
    }

    const parsedBase = parseFloat(baseSalary);
    const parsedAllowance = parseFloat(allowance || 0);
    const parsedPf = parseFloat(pf || 0);
    const parsedTds = parseFloat(tds || 0);

    if (isNaN(parsedBase) || isNaN(parsedAllowance) || isNaN(parsedPf) || isNaN(parsedTds)) {
      throw new AppError('Salary numbers must be valid numbers', 400);
    }

    const netSalary = parsedBase + parsedAllowance - parsedPf - parsedTds;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: targetEmpId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const payroll = await prisma.payroll.upsert({
      where: {
        employeeId_payMonth: {
          employeeId: targetEmpId,
          payMonth: payMonth
        }
      },
      update: {
        baseSalary: parsedBase,
        allowance: parsedAllowance,
        pf: parsedPf,
        tds: parsedTds,
        netSalary: netSalary,
        status: status || 'PAID'
      },
      create: {
        employeeId: targetEmpId,
        baseSalary: parsedBase,
        allowance: parsedAllowance,
        pf: parsedPf,
        tds: parsedTds,
        netSalary: netSalary,
        payMonth: payMonth,
        status: status || 'PAID'
      }
    });

    return payroll;
  }
}

module.exports = new PayrollService();
