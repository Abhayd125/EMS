const fs = require('fs');
const path = require('path');
const prisma = require('../database/db');

// Helper to delete files from filesystem
const deleteFile = (filePath) => {
  if (filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// 1. Create Employee
const createEmployee = async (req, res) => {
  try {
    const { name, email, phone, address, departmentId, skills } = req.body;

    if (!name || !email || !phone || !address || !departmentId) {
      return res.status(400).json({ message: 'All text fields are required' });
    }

    // Check if employee email exists
    const exists = await prisma.employee.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Handle files
    const profileImage = req.files?.profileImage ? `uploads/profiles/${req.files.profileImage[0].filename}` : null;
    const resume = req.files?.resume ? `uploads/resumes/${req.files.resume[0].filename}` : null;
    
    let documentsArray = [];
    if (req.files?.documents) {
      documentsArray = req.files.documents.map(file => `uploads/documents/${file.filename}`);
    }
    const documents = JSON.stringify(documentsArray);

    // Parse skills (expecting comma-separated IDs like "1,2,3" or JSON array)
    let skillConnections = [];
    if (skills) {
      let skillIds = [];
      try {
        skillIds = JSON.parse(skills);
      } catch (e) {
        skillIds = skills.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      skillConnections = skillIds.map(id => ({
        id: parseInt(id)
      })).filter(item => !isNaN(item.id));
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        address,
        profileImage,
        resume,
        documents,
        departmentId: parseInt(departmentId),
        skills: {
          connect: skillConnections
        }
      },
      include: {
        department: true,
        skills: true
      }
    });

    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Internal server error during employee creation' });
  }
};

// 2. Get All Employees (Uses SQL JOIN queries)
const getEmployees = async (req, res) => {
  try {
    // We execute a raw SQL JOIN query to satisfy the internship training requirement
    // Demonstrates: LEFT JOINs, sub-queries, aggregation functions, and naming variables
    const employees = await prisma.$queryRaw`
      SELECT 
        e.id, 
        e.name, 
        e.email, 
        e.phone, 
        e.address, 
        e."profileImage" AS "profileImage", 
        e.resume, 
        e.documents,
        e."createdAt",
        e."updatedAt",
        d.name as "departmentName",
        d.id as "departmentId",
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', s.id, 'name', s.name))
            FROM "Skill" s
            JOIN "_EmployeeSkills" es ON s.id = es."B"
            WHERE es."A" = e.id
          ),
          '[]'::json
        ) as skills
      FROM "Employee" e
      LEFT JOIN "Department" d ON e."departmentId" = d.id
      ORDER BY e.id DESC
    `;

    // Parse the documents JSON string back to an array for client convenience
    const parsedEmployees = employees.map(emp => {
      let docs = [];
      if (emp.documents) {
        try {
          docs = JSON.parse(emp.documents);
        } catch (e) {
          docs = [];
        }
      }
      return {
        ...emp,
        documents: docs
      };
    });

    res.status(200).json({ employees: parsedEmployees });
  } catch (error) {
    console.error('Get employees join query error, running prisma relations fallback:', error);
    try {
      // Fallback to Prisma query if raw SQL fails (e.g. database schema matches sqlite during dev transition)
      const employees = await prisma.employee.findMany({
        include: {
          department: true,
          skills: true
        },
        orderBy: {
          id: 'desc'
        }
      });
      
      const parsedEmployees = employees.map(emp => {
        let docs = [];
        if (emp.documents) {
          try {
            docs = JSON.parse(emp.documents);
          } catch (e) {
            docs = [];
          }
        }
        return {
          ...emp,
          documents: docs
        };
      });

      res.status(200).json({ employees: parsedEmployees });
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      res.status(500).json({ message: 'Failed to retrieve employees' });
    }
  }
};

// 3. Get Single Employee
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const empId = parseInt(id);
    if (isNaN(empId)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: empId },
      include: {
        department: true,
        skills: true
      }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let docs = [];
    if (employee.documents) {
      try {
        docs = JSON.parse(employee.documents);
      } catch (e) {
        docs = [];
      }
    }

    res.status(200).json({
      employee: {
        ...employee,
        documents: docs
      }
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Failed to retrieve employee details' });
  }
};

// 4. Update Employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const empId = parseInt(id);
    if (isNaN(empId)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const { name, email, phone, address, departmentId, skills } = req.body;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id: empId }
    });

    if (!existingEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check email uniqueness if modified
    if (email && email !== existingEmployee.email) {
      const emailTaken = await prisma.employee.findFirst({
        where: {
          email,
          NOT: { id: empId }
        }
      });
      if (emailTaken) {
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (departmentId) updateData.departmentId = parseInt(departmentId);

    // Handle files upload updates
    if (req.files?.profileImage) {
      // Delete old file
      deleteFile(existingEmployee.profileImage);
      updateData.profileImage = `uploads/profiles/${req.files.profileImage[0].filename}`;
    }

    if (req.files?.resume) {
      // Delete old file
      deleteFile(existingEmployee.resume);
      updateData.resume = `uploads/resumes/${req.files.resume[0].filename}`;
    }

    if (req.files?.documents) {
      // Delete old docs
      let oldDocs = [];
      if (existingEmployee.documents) {
        try {
          oldDocs = JSON.parse(existingEmployee.documents);
        } catch (e) {}
      }
      oldDocs.forEach(doc => deleteFile(doc));

      const newDocs = req.files.documents.map(file => `uploads/documents/${file.filename}`);
      updateData.documents = JSON.stringify(newDocs);
    }

    // Handle skills (disconnect old and connect new)
    if (skills !== undefined) {
      let skillIds = [];
      try {
        skillIds = JSON.parse(skills);
      } catch (e) {
        skillIds = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      }
      
      const skillConnections = skillIds.map(sid => ({
        id: parseInt(sid)
      })).filter(item => !isNaN(item.id));

      updateData.skills = {
        set: skillConnections
      };
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: empId },
      data: updateData,
      include: {
        department: true,
        skills: true
      }
    });

    let docs = [];
    if (updatedEmployee.documents) {
      try {
        docs = JSON.parse(updatedEmployee.documents);
      } catch (e) {
        docs = [];
      }
    }

    res.status(200).json({
      message: 'Employee updated successfully',
      employee: {
        ...updatedEmployee,
        documents: docs
      }
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Failed to update employee' });
  }
};

// 5. Delete Employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const empId = parseInt(id);
    if (isNaN(empId)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: empId }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete files
    deleteFile(employee.profileImage);
    deleteFile(employee.resume);
    
    let docs = [];
    if (employee.documents) {
      try {
        docs = JSON.parse(employee.documents);
      } catch (e) {}
    }
    docs.forEach(doc => deleteFile(doc));

    // Delete record from database
    await prisma.employee.delete({
      where: { id: empId }
    });

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Failed to delete employee' });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
