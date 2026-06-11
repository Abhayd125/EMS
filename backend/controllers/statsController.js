const prisma = require('../database/db');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalEmployees = await prisma.employee.count();
    const totalDepartments = await prisma.department.count();
    const totalSkills = await prisma.skill.count();
    const totalAssets = await prisma.asset.count();
    const pendingLeaves = await prisma.leaveRequest.count({
      where: {
        status: { in: ['PENDING_MANAGER', 'PENDING_HR'] }
      }
    });

    // Today's Attendance snapshot for graphs
    const todayStr = new Date().toISOString().split('T')[0];
    const presentCount = await prisma.attendance.count({
      where: { date: todayStr, status: 'PRESENT' }
    });
    const lateCount = await prisma.attendance.count({
      where: { date: todayStr, status: 'LATE' }
    });
    
    // Approved leave count overlapping today
    const now = new Date();
    const leaveCount = await prisma.leaveRequest.count({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        status: 'APPROVED'
      }
    });
    const absentCount = Math.max(0, totalEmployees - (presentCount + lateCount + leaveCount));

    // Performance ratings metrics for analytics
    const avgRatingObj = await prisma.performance.aggregate({
      _avg: { overallRating: true }
    });
    const avgPerformanceRating = avgRatingObj._avg.overallRating 
      ? parseFloat(avgRatingObj._avg.overallRating.toFixed(2)) 
      : 0.0;

    // Department Headcount breakdown
    const departmentBreakdown = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { employees: true }
        }
      }
    });

    // Skill breakdown
    const skillBreakdown = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { employees: true }
        }
      }
    });

    // Recent employees (last 5 created)
    const recentEmployees = await prisma.employee.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      include: {
        department: true
      }
    });

    res.status(200).json({
      stats: {
        totalEmployees,
        totalDepartments,
        totalSkills,
        totalAssets,
        pendingLeaves,
        avgPerformanceRating,
        attendanceToday: {
          present: presentCount,
          late: lateCount,
          onLeave: leaveCount,
          absent: absentCount
        },
        departmentBreakdown: departmentBreakdown.map(d => ({
          id: d.id,
          name: d.name,
          count: d._count.employees
        })),
        skillBreakdown: skillBreakdown.map(s => ({
          id: s.id,
          name: s.name,
          count: s._count.employees
        })),
        recentEmployees: recentEmployees.map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          profileImage: e.profileImage,
          department: e.department.name,
          createdAt: e.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
