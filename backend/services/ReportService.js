const prisma = require('../database/db');
const AppError = require('../utils/AppError');

class ReportService {
  async getEmployeeReportData(filters) {
    const { departmentId, search } = filters;
    const where = {};
    if (departmentId) where.departmentId = parseInt(departmentId);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    return prisma.employee.findMany({
      where,
      include: {
        department: true,
        skills: true,
        leaveBalance: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getLeaveReportData(filters) {
    const { status, leaveType } = filters;
    const where = {};
    if (status) where.status = status;
    if (leaveType) where.leaveType = leaveType;
    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAssetReportData(filters) {
    const { type, status } = filters;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    return prisma.asset.findMany({
      where,
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            employee: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  convertToCSV(type, records) {
    if (!records || records.length === 0) {
      return '';
    }

    let headers = [];
    let rows = [];

    if (type === 'employees') {
      headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Department', 'Skills', 'Sick Balance', 'Casual Balance', 'Paid Balance', 'Created At'];
      rows = records.map(emp => [
        emp.id,
        emp.name,
        emp.email,
        emp.phone,
        emp.address.replace(/"/g, '""'),
        emp.department?.name || 'N/A',
        (emp.skills || []).map(s => s.name).join(', '),
        emp.leaveBalance?.sick ?? 12,
        emp.leaveBalance?.casual ?? 15,
        emp.leaveBalance?.paid ?? 20,
        emp.createdAt.toISOString()
      ]);
    } else if (type === 'leaves') {
      headers = ['ID', 'Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Status', 'Reason', 'Created At'];
      rows = records.map(leave => [
        leave.id,
        leave.employee?.name || 'N/A',
        leave.employee?.department?.name || 'N/A',
        leave.leaveType,
        leave.startDate.toISOString().split('T')[0],
        leave.endDate.toISOString().split('T')[0],
        leave.status,
        leave.reason.replace(/"/g, '""'),
        leave.createdAt.toISOString()
      ]);
    } else if (type === 'assets') {
      headers = ['ID', 'Name', 'Serial Number', 'Type', 'Status', 'Assigned To', 'Assigned At', 'Created At'];
      rows = records.map(asset => {
        const activeAssignment = asset.assignments?.[0];
        return [
          asset.id,
          asset.name,
          asset.serialNumber,
          asset.type,
          asset.status,
          activeAssignment?.employee?.name || 'Unassigned',
          activeAssignment?.assignedAt ? activeAssignment.assignedAt.toISOString() : 'N/A',
          asset.createdAt.toISOString()
        ];
      });
    } else {
      throw new AppError('Invalid report type for CSV generation', 400);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(value => {
        const stringVal = String(value);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(','))
    ].join('\n');

    return csvContent;
  }
}

module.exports = new ReportService();
