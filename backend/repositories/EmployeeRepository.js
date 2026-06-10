const prisma = require('../database/db');

class EmployeeRepository {
  async findById(id) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        skills: true,
        manager: true,
        leaveBalance: true
      }
    });
  }

  async findByUserId(userId) {
    return prisma.employee.findUnique({
      where: { userId },
      include: {
        department: true,
        skills: true,
        leaveBalance: true
      }
    });
  }

  async findByEmail(email) {
    return prisma.employee.findUnique({
      where: { email }
    });
  }

  async findMany({ skip, take, search, departmentId, sortBy, sortOrder }) {
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          department: true,
          skills: true
        }
      }),
      prisma.employee.count({ where })
    ]);

    return { data, total };
  }

  async create(data) {
    const { skills, ...employeeData } = data;
    return prisma.employee.create({
      data: {
        ...employeeData,
        ...(skills && {
          skills: {
            connect: skills.map(id => ({ id }))
          }
        })
      },
      include: {
        department: true,
        skills: true
      }
    });
  }

  async update(id, data) {
    const { skills, ...employeeData } = data;
    return prisma.employee.update({
      where: { id },
      data: {
        ...employeeData,
        ...(skills && {
          skills: {
            set: skills.map(id => ({ id }))
          }
        })
      },
      include: {
        department: true,
        skills: true
      }
    });
  }

  async delete(id) {
    return prisma.employee.delete({
      where: { id }
    });
  }
}

module.exports = new EmployeeRepository();
