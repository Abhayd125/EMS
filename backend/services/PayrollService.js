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

    const { basicPay, pf, gis, recovery, advance, tax, payMonth, status } = data;

    if (basicPay === undefined || !payMonth) {
      throw new AppError('Basic pay and pay month are required', 400);
    }

    const parsedBasic = parseFloat(basicPay);
    const parsedPf = parseFloat(pf || 0);
    const parsedGis = parseFloat(gis || 0);
    const parsedRecovery = parseFloat(recovery || 0);
    const parsedAdvance = parseFloat(advance || 0);
    const parsedTax = parseFloat(tax || 0);

    if (
      isNaN(parsedBasic) ||
      isNaN(parsedPf) ||
      isNaN(parsedGis) ||
      isNaN(parsedRecovery) ||
      isNaN(parsedAdvance) ||
      isNaN(parsedTax)
    ) {
      throw new AppError('Salary fields must be valid numbers', 400);
    }

    // Auto-calculate allowance (50% of basicPay) and HRA (5% of basicPay)
    const computedAllowance = parseFloat((parsedBasic * 0.50).toFixed(2));
    const computedHra = parseFloat((parsedBasic * 0.05).toFixed(2));

    // Calculate additions and deductions
    const totalAdditions = parsedBasic + computedAllowance + computedHra;
    const totalDeductions = parsedPf + parsedGis + parsedRecovery + parsedAdvance + parsedTax;

    const netSalary = parseFloat(Math.max(0, totalAdditions - totalDeductions).toFixed(2));

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
        basicPay: parsedBasic,
        allowance: computedAllowance,
        hra: computedHra,
        pf: parsedPf,
        gis: parsedGis,
        recovery: parsedRecovery,
        advance: parsedAdvance,
        tax: parsedTax,
        netSalary: netSalary,
        status: status || 'PAID'
      },
      create: {
        employeeId: targetEmpId,
        basicPay: parsedBasic,
        allowance: computedAllowance,
        hra: computedHra,
        pf: parsedPf,
        gis: parsedGis,
        recovery: parsedRecovery,
        advance: parsedAdvance,
        tax: parsedTax,
        netSalary: netSalary,
        payMonth: payMonth,
        status: status || 'PAID'
      }
    });

    return payroll;
  }
}

module.exports = new PayrollService();
