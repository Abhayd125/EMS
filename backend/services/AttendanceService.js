const prisma = require('../database/db');
const auditTrailService = require('./AuditTrailService');
const notificationService = require('./NotificationService');
const AppError = require('../utils/AppError');

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

class AttendanceService {
  async checkIn(userId, notes) {
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const todayStr = getLocalDateString();

    // Check if check-in already exists
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: todayStr
        }
      }
    });

    if (existing) {
      throw new AppError('Already checked in for today', 400);
    }

    const checkInTime = new Date();
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    
    // Status is LATE if checking in after 09:30 AM
    let status = 'PRESENT';
    if (hours > 9 || (hours === 9 && minutes > 30)) {
      status = 'LATE';
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: todayStr,
        checkIn: checkInTime,
        status,
        notes
      },
      include: {
        employee: true
      }
    });

    // Notify employee
    await notificationService.createNotification(
      employee.id,
      'Checked In',
      `You successfully checked in today at ${checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Status: ${status}.`,
      'SYSTEM'
    );

    // Notify Admins and HR
    await notificationService.notifyAdminsAndHR(
      'Employee Checked In',
      `${employee.name} checked in at ${checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Status: ${status}.`,
      'SYSTEM'
    );

    await auditTrailService.log(
      'Attendance',
      attendance.id,
      'CREATE',
      null,
      { date: todayStr, checkIn: checkInTime, status },
      userId,
      employee.name
    );

    return attendance;
  }

  async checkOut(userId, notes) {
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const todayStr = getLocalDateString();

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: todayStr
        }
      }
    });

    if (!existing) {
      throw new AppError('You must check in first', 400);
    }

    if (existing.checkOut) {
      throw new AppError('Already checked out for today', 400);
    }

    const checkOutTime = new Date();

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: checkOutTime,
        notes: notes || existing.notes
      },
      include: {
        employee: true
      }
    });

    // Notify employee
    await notificationService.createNotification(
      employee.id,
      'Checked Out',
      `You checked out today at ${checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      'SYSTEM'
    );

    // Notify Admins and HR
    await notificationService.notifyAdminsAndHR(
      'Employee Checked Out',
      `${employee.name} checked out at ${checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      'SYSTEM'
    );

    await auditTrailService.log(
      'Attendance',
      attendance.id,
      'UPDATE',
      { checkOut: null },
      { checkOut: checkOutTime },
      userId,
      employee.name
    );

    return attendance;
  }

  async getTodayStatus(userId) {
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return { checkedIn: false, checkedOut: false };
    }

    const todayStr = getLocalDateString();

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: todayStr
        }
      }
    });

    if (!attendance) {
      return { checkedIn: false, checkedOut: false };
    }

    return {
      checkedIn: true,
      checkedOut: !!attendance.checkOut,
      attendance
    };
  }

  async getMyAttendance(userId) {
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return [];
    }

    return prisma.attendance.findMany({
      where: { employeeId: employee.id },
      orderBy: { date: 'desc' }
    });
  }

  async getAllAttendance(query) {
    const { date, search } = query;
    const where = {};

    if (date) {
      where.date = date;
    }

    if (search) {
      where.employee = {
        name: { contains: search, mode: 'insensitive' }
      };
    }

    return prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }
}

module.exports = new AttendanceService();
