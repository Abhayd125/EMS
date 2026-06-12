const payrollService = require('../services/PayrollService');
const prisma = require('../database/db');
const AppError = require('../utils/AppError');

jest.mock('../database/db', () => ({
  employee: {
    findUnique: jest.fn()
  },
  payroll: {
    findMany: jest.fn(),
    upsert: jest.fn()
  }
}));

describe('PayrollService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdatePayroll', () => {
    test('should successfully calculate net salary and upsert payroll', async () => {
      const mockEmployee = { id: 10, name: 'Abhay Dubey' };
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      
      const mockPayrollInput = {
        basicPay: 50000,
        pf: 5000,
        gis: 1000,
        recovery: 500,
        advance: 1000,
        tax: 3000,
        payMonth: '2026-06',
        status: 'PAID'
      };

      // additions: basicPay (50000) + allowance (25000) + hra (2500) = 77500
      // deductions: pf (5000) + gis (1000) + recovery (500) + advance (1000) + tax (3000) = 10500
      // netSalary: 77500 - 10500 = 67000
      const expectedNetSalary = 67000;

      prisma.payroll.upsert.mockImplementation(({ create }) => {
        return Promise.resolve({
          id: 1,
          ...create,
          netSalary: expectedNetSalary
        });
      });

      const result = await payrollService.createOrUpdatePayroll(10, mockPayrollInput);

      expect(result).toBeDefined();
      expect(result.netSalary).toBe(67000);
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(prisma.payroll.upsert).toHaveBeenCalledWith({
        where: {
          employeeId_payMonth: {
            employeeId: 10,
            payMonth: '2026-06'
          }
        },
        update: {
          basicPay: 50000,
          allowance: 25000,
          hra: 2500,
          pf: 5000,
          gis: 1000,
          recovery: 500,
          advance: 1000,
          tax: 3000,
          netSalary: 67000,
          status: 'PAID'
        },
        create: {
          employeeId: 10,
          basicPay: 50000,
          allowance: 25000,
          hra: 2500,
          pf: 5000,
          gis: 1000,
          recovery: 500,
          advance: 1000,
          tax: 3000,
          netSalary: 67000,
          payMonth: '2026-06',
          status: 'PAID'
        }
      });
    });

    test('should throw AppError if employee does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      const mockPayrollInput = {
        basicPay: 50000,
        payMonth: '2026-06'
      };

      await expect(
        payrollService.createOrUpdatePayroll(99, mockPayrollInput)
      ).rejects.toThrow(AppError);

      expect(prisma.payroll.upsert).not.toHaveBeenCalled();
    });

    test('should throw AppError if basic pay is missing', async () => {
      await expect(
        payrollService.createOrUpdatePayroll(10, { payMonth: '2026-06' })
      ).rejects.toThrow(AppError);
    });

    test('should throw AppError if pay month is missing', async () => {
      await expect(
        payrollService.createOrUpdatePayroll(10, { basicPay: 50000 })
      ).rejects.toThrow(AppError);
    });
  });
});
