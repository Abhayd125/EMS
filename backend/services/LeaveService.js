const leaveRepository = require('../repositories/LeaveRepository');
const employeeRepository = require('../repositories/EmployeeRepository');
const auditTrailService = require('./AuditTrailService');
const notificationService = require('./NotificationService');
const AppError = require('../utils/AppError');

const calculateLeaveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

const getLeaveField = (type) => {
  switch (type.toUpperCase()) {
    case 'SICK': return 'sick';
    case 'CASUAL': return 'casual';
    case 'PAID': return 'paid';
    default: return null;
  }
};

class LeaveService {
  async getLeaveBalance(userId) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    let balance = await leaveRepository.findBalanceByEmployeeId(employee.id);
    if (!balance) {
      balance = await leaveRepository.createBalance({
        employeeId: employee.id,
        sick: 12,
        casual: 15,
        paid: 20
      });
    }

    return balance;
  }

  async applyLeave(data, user) {
    const { leaveType, startDate, endDate, reason } = data;

    if (!leaveType || !startDate || !endDate || !reason) {
      throw new AppError('All leave fields are required', 400);
    }

    const leaveField = getLeaveField(leaveType);
    if (!leaveField) {
      throw new AppError('Invalid leave type. Must be SICK, CASUAL, or PAID', 400);
    }

    const employee = await employeeRepository.findByUserId(user.id);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const days = calculateLeaveDays(startDate, endDate);
    if (days <= 0 || new Date(startDate) > new Date(endDate)) {
      throw new AppError('Invalid date selection. Start date must be before or equal to End date', 400);
    }

    let balance = await leaveRepository.findBalanceByEmployeeId(employee.id);
    if (!balance) {
      balance = await leaveRepository.createBalance({
        employeeId: employee.id,
        sick: 12,
        casual: 15,
        paid: 20
      });
    }

    const availableBalance = balance[leaveField];
    if (availableBalance < days) {
      throw new AppError(
        `Insufficient leave balance. Applied for ${days} days, but only have ${availableBalance} days of ${leaveType} leave remaining.`,
        400
      );
    }

    const requestData = {
      employeeId: employee.id,
      leaveType: leaveType.toUpperCase(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'PENDING_MANAGER'
    };

    const auditData = {
      action: 'APPLIED',
      actorId: user.id,
      actorName: user.name,
      comment: `Applied for ${days} days of ${leaveType} leave.`
    };

    const leaveRequest = await leaveRepository.createRequestWithAudit(requestData, auditData);

    // Notify Manager if manager exists
    if (employee.managerId) {
      try {
        await notificationService.createNotification(
          employee.managerId,
          'New Leave Request',
          `${employee.name} has requested ${days} days of ${leaveType} leave.`,
          'LEAVE'
        );
      } catch (err) {
        // Log notification error but don't fail request
        const logger = require('../config/logger');
        logger.error('Leave notification to manager failed: %s', err.message);
      }
    }

    await auditTrailService.log(
      'LeaveRequest',
      leaveRequest.id,
      'CREATE',
      null,
      requestData,
      user.id,
      user.name
    );

    return leaveRequest;
  }

  async getMyLeaves(userId) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }
    return leaveRepository.findManyHistory(employee.id);
  }

  async getPendingApprovals(user) {
    const userRole = user.role;
    let statusFilter = '';

    if (userRole === 'MANAGER') {
      statusFilter = 'PENDING_MANAGER';
    } else if (userRole === 'HR' || userRole === 'ADMIN') {
      statusFilter = 'PENDING_HR';
    } else {
      throw new AppError('Access denied: Unauthorized role for approvals', 403);
    }

    return leaveRepository.findManyApprovals(statusFilter);
  }

  async reviewManager(id, data, user) {
    const { status, comment } = data;
    const leaveId = parseInt(id);

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Invalid status update. Must be APPROVED or REJECTED', 400);
    }

    const leaveRequest = await leaveRepository.findById(leaveId);
    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.status !== 'PENDING_MANAGER') {
      throw new AppError('Leave request is not pending manager approval', 400);
    }

    const nextStatus = status === 'APPROVED' ? 'PENDING_HR' : 'REJECTED';

    const requestUpdate = {
      status: nextStatus,
      managerComment: comment
    };

    const auditData = {
      action: status === 'APPROVED' ? 'MANAGER_APPROVED' : 'REJECTED',
      actorId: user.id,
      actorName: user.name,
      comment: comment || `Manager reviewed request: ${status.toLowerCase()}.`
    };

    const updatedRequest = await leaveRepository.updateRequestWithAudit(leaveId, requestUpdate, auditData);

    // Notify employee about Manager decision
    try {
      await notificationService.createNotification(
        leaveRequest.employeeId,
        'Leave Request Update',
        `Your manager has ${status.toLowerCase()} your leave request. Status: ${nextStatus}.`,
        'LEAVE'
      );
    } catch (err) {
      const logger = require('../config/logger');
      logger.error('Leave notification to employee failed: %s', err.message);
    }

    await auditTrailService.log(
      'LeaveRequest',
      leaveId,
      'UPDATE',
      { status: leaveRequest.status },
      requestUpdate,
      user.id,
      user.name
    );

    return updatedRequest;
  }

  async reviewHR(id, data, user) {
    const { status, comment } = data;
    const leaveId = parseInt(id);

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Invalid status update. Must be APPROVED or REJECTED', 400);
    }

    const leaveRequest = await leaveRepository.findById(leaveId);
    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.status !== 'PENDING_HR') {
      throw new AppError('Leave request is not pending HR approval', 400);
    }

    const days = calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
    const leaveField = getLeaveField(leaveRequest.leaveType);

    const requestUpdate = {
      status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      hrComment: comment
    };

    const auditData = {
      action: status === 'APPROVED' ? 'HR_APPROVED' : 'REJECTED',
      actorId: user.id,
      actorName: user.name,
      comment: comment || `HR reviewed request: ${status.toLowerCase()}.`
    };

    let updatedRequest;
    try {
      if (status === 'APPROVED') {
        updatedRequest = await leaveRepository.updateRequestAndDecrementBalance(
          leaveId,
          leaveRequest.employeeId,
          leaveField,
          days,
          requestUpdate,
          auditData
        );
      } else {
        updatedRequest = await leaveRepository.updateRequestWithAudit(
          leaveId,
          requestUpdate,
          auditData
        );
      }
    } catch (err) {
      if (err.message === 'INSUFFICIENT_BALANCE_TRANSACTION') {
        throw new AppError('Transaction rolled back: Employee does not have enough remaining leave balance.', 400);
      }
      throw err;
    }

    // Notify employee about HR decision
    try {
      await notificationService.createNotification(
        leaveRequest.employeeId,
        'Leave Request Finalized',
        `HR has ${status.toLowerCase()} your leave request. Status: ${status}.`,
        'LEAVE'
      );
    } catch (err) {
      const logger = require('../config/logger');
      logger.error('Leave notification to employee failed: %s', err.message);
    }

    await auditTrailService.log(
      'LeaveRequest',
      leaveId,
      'UPDATE',
      { status: leaveRequest.status },
      requestUpdate,
      user.id,
      user.name
    );

    return updatedRequest;
  }

  async getLeavesStats() {
    const totalRequests = await leaveRepository.countByStatus({});
    const approvedRequests = await leaveRepository.countByStatus({ status: 'APPROVED' });
    const pendingManager = await leaveRepository.countByStatus({ status: 'PENDING_MANAGER' });
    const pendingHR = await leaveRepository.countByStatus({ status: 'PENDING_HR' });
    const rejectedRequests = await leaveRepository.countByStatus({ status: 'REJECTED' });

    // Count by Type
    const sickLeaves = await leaveRepository.countByStatus({ leaveType: 'SICK', status: 'APPROVED' });
    const casualLeaves = await leaveRepository.countByStatus({ leaveType: 'CASUAL', status: 'APPROVED' });
    const paidLeaves = await leaveRepository.countByStatus({ leaveType: 'PAID', status: 'APPROVED' });

    return {
      totalRequests,
      approvedRequests,
      pendingManager,
      pendingHR,
      rejectedRequests,
      sickLeaves,
      casualLeaves,
      paidLeaves
    };
  }
}

module.exports = new LeaveService();
