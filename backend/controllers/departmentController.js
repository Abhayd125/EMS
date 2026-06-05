const prisma = require('../database/db');

// Create Department
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const exists = await prisma.department.findUnique({ where: { name } });
    if (exists) {
      return res.status(400).json({ message: 'Department with this name already exists' });
    }

    const dept = await prisma.department.create({
      data: { name, description }
    });

    res.status(201).json({ message: 'Department created successfully', department: dept });
  } catch (error) {
    console.error('Create dept error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Departments
const getDepartments = async (req, res) => {
  try {
    const depts = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ departments: depts });
  } catch (error) {
    console.error('Get depts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      return res.status(400).json({ message: 'Invalid ID parameter' });
    }

    if (name) {
      const exists = await prisma.department.findFirst({
        where: {
          name,
          NOT: { id: deptId }
        }
      });
      if (exists) {
        return res.status(400).json({ message: 'Department with this name already exists' });
      }
    }

    const dept = await prisma.department.update({
      where: { id: deptId },
      data: { name, description }
    });

    res.status(200).json({ message: 'Department updated successfully', department: dept });
  } catch (error) {
    console.error('Update dept error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      return res.status(400).json({ message: 'Invalid ID parameter' });
    }

    await prisma.department.delete({
      where: { id: deptId }
    });

    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete dept error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment
};
