const prisma = require('../database/db');

// Helper to calculate days between dates (inclusive)
const calculateLeaveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// Map leaveType body parameter to database column
const getLeaveField = (type) => {
  switch (type.toUpperCase()) {
    case 'SICK': return 'sick';
    case 'CASUAL': return 'casual';
    case 'PAID': return 'paid';
    default: return null;
  }
};

// 1. Get Leave Balance (Initializes automatically if missing)
const getLeaveBalance = async (req, res) => {
  try {
    const user = req.user;
    
    // Find associated employee profile
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    // Get or create balance (lazy initialization)
    let balance = await prisma.leaveBalance.findUnique({
      where: { employeeId: employee.id }
    });

    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          sick: 12,
          casual: 15,
          paid: 20
        }
      });
    }

    res.status(200).json({ balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Failed to retrieve leave balance' });
  }
};

// 2. Apply for Leave
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All leave fields are required' });
    }

    const leaveField = getLeaveField(leaveType);
    if (!leaveField) {
      return res.status(400).json({ message: 'Invalid leave type. Must be SICK, CASUAL, or PAID' });
    }

    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const days = calculateLeaveDays(startDate, endDate);
    if (days <= 0 || new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Invalid date selection. Start date must be before or equal to End date' });
    }

    // Check Balance
    let balance = await prisma.leaveBalance.findUnique({
      where: { employeeId: employee.id }
    });

    // Initialize balance if not exists
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: { employeeId: employee.id, sick: 12, casual: 15, paid: 20 }
      });
    }

    const availableBalance = balance[leaveField];
    if (availableBalance < days) {
      return res.status(400).json({ 
        message: `Insufficient leave balance. Applied for ${days} days, but only have ${availableBalance} days of ${leaveType} leave remaining.` 
      });
    }

    // Create leave request and audit log inside transaction
    const leaveRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          employeeId: employee.id,
          leaveType: leaveType.toUpperCase(),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason,
          status: 'PENDING_MANAGER'
        }
      });

      await tx.auditLog.create({
        data: {
          leaveRequestId: request.id,
          action: 'APPLIED',
          actorId: req.user.id,
          actorName: req.user.name,
          comment: `Applied for ${days} days of ${leaveType} leave.`
        }
      });

      return request;
    });

    res.status(201).json({ message: 'Leave application submitted successfully', leaveRequest });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Failed to submit leave application' });
  }
};

// 3. Get Employee's Own Leaves History
const getMyLeaves = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ leaves });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ message: 'Failed to retrieve leaves history' });
  }
};

// 4. Get Pending Approvals (For Manager & HR)
const getPendingApprovals = async (req, res) => {
  try {
    const userRole = req.user.role;
    let statusFilter = '';

    if (userRole === 'MANAGER') {
      statusFilter = 'PENDING_MANAGER';
    } else if (userRole === 'HR' || userRole === 'ADMIN') {
      statusFilter = 'PENDING_HR';
    } else {
      return res.status(403).json({ message: 'Access denied: Unauthorized role for approvals' });
    }

    // Fetch leaves with Join Data (Employee name, Department name)
    const pendingRequests = await prisma.leaveRequest.findMany({
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

    res.status(200).json({ approvals: pendingRequests });
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ message: 'Failed to retrieve approvals' });
  }
};

// 5. Manager Review (Approve / Reject)
const reviewManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // status must be APPROVED or REJECTED

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update. Must be APPROVED or REJECTED' });
    }

    const leaveId = parseInt(id);
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveId }
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'PENDING_MANAGER') {
      return res.status(400).json({ message: 'Leave request is not pending manager approval' });
    }

    const nextStatus = status === 'APPROVED' ? 'PENDING_HR' : 'REJECTED';

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id: leaveId },
        data: {
          status: nextStatus,
          managerComment: comment
        }
      });

      await tx.auditLog.create({
        data: {
          leaveRequestId: leaveId,
          action: status === 'APPROVED' ? 'MANAGER_APPROVED' : 'REJECTED',
          actorId: req.user.id,
          actorName: req.user.name,
          comment: comment || `Manager reviewed request: ${status.toLowerCase()}.`
        }
      });

      return updated;
    });

    res.status(200).json({ message: `Leave request status updated to ${nextStatus}`, leaveRequest: updatedRequest });
  } catch (error) {
    console.error('Manager review error:', error);
    res.status(500).json({ message: 'Failed to update leave request' });
  }
};

// 6. HR Final Review (PostgreSQL Transaction to reduce balance on approval)
const reviewHR = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // status must be APPROVED or REJECTED

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update. Must be APPROVED or REJECTED' });
    }

    const leaveId = parseInt(id);
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true }
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'PENDING_HR') {
      return res.status(400).json({ message: 'Leave request is not pending HR approval' });
    }

    const days = calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
    const leaveField = getLeaveField(leaveRequest.leaveType);

    // HR Approve / Reject PostgreSQL Transaction
    const updatedRequest = await prisma.$transaction(async (tx) => {
      if (status === 'APPROVED') {
        // Fetch current leave balance inside transaction with select for update logic
        const balance = await tx.leaveBalance.findUnique({
          where: { employeeId: leaveRequest.employeeId }
        });

        if (!balance || balance[leaveField] < days) {
          throw new Error('INSUFFICIENT_BALANCE_TRANSACTION');
        }

        // 1. Decrement leave balance
        await tx.leaveBalance.update({
          where: { employeeId: leaveRequest.employeeId },
          data: {
            [leaveField]: {
              decrement: days
            }
          }
        });
      }

      // 2. Update status of request
      const updated = await tx.leaveRequest.update({
        where: { id: leaveId },
        data: {
          status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          hrComment: comment
        }
      });

      // 3. Log Audit trail
      await tx.auditLog.create({
        data: {
          leaveRequestId: leaveId,
          action: status === 'APPROVED' ? 'HR_APPROVED' : 'REJECTED',
          actorId: req.user.id,
          actorName: req.user.name,
          comment: comment || `HR reviewed request: ${status.toLowerCase()}.`
        }
      });

      return updated;
    });

    res.status(200).json({ message: `Leave request status finalized: ${status}`, leaveRequest: updatedRequest });
  } catch (error) {
    console.error('HR review error:', error);
    if (error.message === 'INSUFFICIENT_BALANCE_TRANSACTION') {
      return res.status(400).json({ message: 'Transaction rolled back: Employee does not have enough remaining leave balance.' });
    }
    res.status(500).json({ message: 'Failed to finalize leave request transaction' });
  }
};

// 7. Leaves Stats Analytics
const getLeavesStats = async (req, res) => {
  try {
    const totalRequests = await prisma.leaveRequest.count();
    const approvedRequests = await prisma.leaveRequest.count({ where: { status: 'APPROVED' } });
    const pendingManager = await prisma.leaveRequest.count({ where: { status: 'PENDING_MANAGER' } });
    const pendingHR = await prisma.leaveRequest.count({ where: { status: 'PENDING_HR' } });
    const rejectedRequests = await prisma.leaveRequest.count({ where: { status: 'REJECTED' } });

    // Count by Type
    const sickLeaves = await prisma.leaveRequest.count({ where: { leaveType: 'SICK', status: 'APPROVED' } });
    const casualLeaves = await prisma.leaveRequest.count({ where: { leaveType: 'CASUAL', status: 'APPROVED' } });
    const paidLeaves = await prisma.leaveRequest.count({ where: { leaveType: 'PAID', status: 'APPROVED' } });

    res.status(200).json({
      stats: {
        totalRequests,
        approvedRequests,
        pendingManager,
        pendingHR,
        rejectedRequests,
        sickLeaves,
        casualLeaves,
        paidLeaves
      }
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ message: 'Failed to retrieve stats' });
  }
};

module.exports = {
  getLeaveBalance,
  applyLeave,
  getMyLeaves,
  getPendingApprovals,
  reviewManager,
  reviewHR,
  getLeavesStats
};
