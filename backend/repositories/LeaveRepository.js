const prisma = require('../database/db');

class LeaveRepository {
  async findById(id) {
    return prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            leaveBalance: true
          }
        }
      }
    });
  }

  async findBalanceByEmployeeId(employeeId) {
    return prisma.leaveBalance.findUnique({
      where: { employeeId }
    });
  }

  async createBalance(data) {
    return prisma.leaveBalance.create({ data });
  }

  async updateBalance(employeeId, data) {
    return prisma.leaveBalance.update({
      where: { employeeId },
      data
    });
  }

  async createRequestWithAudit(requestData, auditData) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: requestData
      });

      await tx.auditLog.create({
        data: {
          ...auditData,
          leaveRequestId: request.id
        }
      });

      return request;
    });
  }

  async updateRequestWithAudit(leaveId, requestUpdate, auditData) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id: leaveId },
        data: requestUpdate
      });

      await tx.auditLog.create({
        data: {
          ...auditData,
          leaveRequestId: leaveId
        }
      });

      return updated;
    });
  }

  async updateRequestAndDecrementBalance(leaveId, employeeId, leaveField, days, requestUpdate, auditData) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch current leave balance inside transaction with select for update logic
      const balance = await tx.leaveBalance.findUnique({
        where: { employeeId }
      });

      if (!balance || balance[leaveField] < days) {
        throw new Error('INSUFFICIENT_BALANCE_TRANSACTION');
      }

      // 2. Decrement balance
      await tx.leaveBalance.update({
        where: { employeeId },
        data: {
          [leaveField]: {
            decrement: days
          }
        }
      });

      // 3. Update request status
      const updated = await tx.leaveRequest.update({
        where: { id: leaveId },
        data: requestUpdate
      });

      // 4. Log Audit
      await tx.auditLog.create({
        data: {
          ...auditData,
          leaveRequestId: leaveId
        }
      });

      return updated;
    });
  }

  async findManyHistory(employeeId) {
    return prisma.leaveRequest.findMany({
      where: { employeeId },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findManyApprovals(statusFilter) {
    return prisma.leaveRequest.findMany({
      where: { status: statusFilter },
      include: {
        employee: {
          include: {
            department: true,
            leaveBalance: true
          }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async countByStatus(where) {
    return prisma.leaveRequest.count({ where });
  }
}

module.exports = new LeaveRepository();
