const leaveService = require('../services/LeaveService');
const employeeRepository = require('../repositories/EmployeeRepository');
const leaveRepository = require('../repositories/LeaveRepository');
const auditTrailService = require('../services/AuditTrailService');
const AppError = require('../utils/AppError');

jest.mock('../repositories/EmployeeRepository');
jest.mock('../repositories/LeaveRepository');
jest.mock('../services/AuditTrailService');
jest.mock('../services/NotificationService');

describe('LeaveService - applyLeave Unit Tests', () => {
  let mockUser;
  let mockEmployee;
  let mockLeaveBalance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 1,
      name: 'John Doe',
      role: 'EMPLOYEE'
    };

    mockEmployee = {
      id: 10,
      name: 'John Doe',
      userId: 1,
      managerId: 2,
      email: 'john@ora.com'
    };

    mockLeaveBalance = {
      id: 100,
      employeeId: 10,
      sick: 12,
      casual: 15,
      paid: 20
    };
  });

  test('should successfully apply for leave if balance is sufficient', async () => {
    employeeRepository.findByUserId.mockResolvedValue(mockEmployee);
    leaveRepository.findBalanceByEmployeeId.mockResolvedValue(mockLeaveBalance);
    
    const mockRequest = {
      id: 50,
      employeeId: 10,
      leaveType: 'SICK',
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-06-17'),
      status: 'PENDING_MANAGER'
    };
    
    leaveRepository.createRequestWithAudit.mockResolvedValue(mockRequest);

    const result = await leaveService.applyLeave({
      leaveType: 'SICK',
      startDate: '2026-06-15',
      endDate: '2026-06-17',
      reason: 'Fever and cold'
    }, mockUser);

    expect(result).toBeDefined();
    expect(result.id).toBe(50);
    expect(result.status).toBe('PENDING_MANAGER');
    expect(employeeRepository.findByUserId).toHaveBeenCalledWith(mockUser.id);
    expect(leaveRepository.findBalanceByEmployeeId).toHaveBeenCalledWith(mockEmployee.id);
  });

  test('should throw AppError if leave balance is insufficient', async () => {
    employeeRepository.findByUserId.mockResolvedValue(mockEmployee);
    
    // Only 2 sick days remaining
    mockLeaveBalance.sick = 2;
    leaveRepository.findBalanceByEmployeeId.mockResolvedValue(mockLeaveBalance);

    await expect(
      leaveService.applyLeave({
        leaveType: 'SICK',
        startDate: '2026-06-15',
        endDate: '2026-06-18', // 4 days requested
        reason: 'Long recovery'
      }, mockUser)
    ).rejects.toThrow(AppError);

    expect(leaveRepository.createRequestWithAudit).not.toHaveBeenCalled();
  });
});
