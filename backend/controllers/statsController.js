const prisma = require('../database/db');

const getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await prisma.employee.count();
    const totalDepartments = await prisma.department.count();
    const totalSkills = await prisma.skill.count();

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
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to retrieve stats' });
  }
};

module.exports = { getDashboardStats };
