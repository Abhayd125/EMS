const fs = require('fs');
const path = require('path');
const employeeRepository = require('../repositories/EmployeeRepository');
const leaveRepository = require('../repositories/LeaveRepository');
const auditTrailService = require('./AuditTrailService');
const AppError = require('../utils/AppError');

const deleteFile = (filePath) => {
  if (filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

class EmployeeService {
  async createEmployee(data, files, actor) {
    const { name, email, phone, address, departmentId, skills, userId, managerId } = data;

    if (!name || !email || !phone || !address || !departmentId) {
      throw new AppError('All text fields are required', 400);
    }

    const exists = await employeeRepository.findByEmail(email);
    if (exists) {
      throw new AppError('Employee with this email already exists', 400);
    }

    // Process files
    const profileImage = files?.profileImage ? `uploads/profiles/${files.profileImage[0].filename}` : null;
    const resume = files?.resume ? `uploads/resumes/${files.resume[0].filename}` : null;
    
    let documentsArray = [];
    if (files?.documents) {
      documentsArray = files.documents.map(file => `uploads/documents/${file.filename}`);
    }
    const documents = JSON.stringify(documentsArray);

    // Process skills
    let skillIds = [];
    if (skills) {
      try {
        skillIds = JSON.parse(skills);
      } catch (e) {
        skillIds = skills.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    const skillInts = skillIds.map(id => parseInt(id)).filter(id => !isNaN(id));

    const employee = await employeeRepository.create({
      name,
      email,
      phone,
      address,
      profileImage,
      resume,
      documents,
      departmentId: parseInt(departmentId),
      skills: skillInts,
      userId: userId ? parseInt(userId) : null,
      managerId: managerId ? parseInt(managerId) : null
    });

    // Create default leave balance for the employee
    try {
      await leaveRepository.createBalance({
        employeeId: employee.id,
        sick: 12,
        casual: 15,
        paid: 20
      });
    } catch (balanceErr) {
      const logger = require('../config/logger');
      logger.error('Failed to create default leave balance for employee ID %s: %s', employee.id, balanceErr.message);
    }

    await auditTrailService.log(
      'Employee', 
      employee.id, 
      'CREATE', 
      null, 
      { name, email, departmentId }, 
      actor ? actor.id : null, 
      actor ? actor.name : null
    );

    return employee;
  }

  async getEmployees(query) {
    const { page = 1, limit = 100, search, departmentId, sortBy, sortOrder } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const { data, total } = await employeeRepository.findMany({
      skip,
      take,
      search,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      sortBy,
      sortOrder
    });

    const parsedData = data.map(emp => {
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

    return { data: parsedData, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async getEmployeeById(id) {
    const empId = parseInt(id);
    if (isNaN(empId)) {
      throw new AppError('Invalid employee ID', 400);
    }

    const employee = await employeeRepository.findById(empId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    let docs = [];
    if (employee.documents) {
      try {
        docs = JSON.parse(employee.documents);
      } catch (e) {
        docs = [];
      }
    }

    return {
      ...employee,
      documents: docs
    };
  }

  async updateEmployee(id, data, files, actor) {
    const empId = parseInt(id);
    if (isNaN(empId)) {
      throw new AppError('Invalid employee ID', 400);
    }

    const existingEmployee = await employeeRepository.findById(empId);
    if (!existingEmployee) {
      throw new AppError('Employee not found', 404);
    }

    const { name, email, phone, address, departmentId, skills, managerId } = data;

    if (email && email !== existingEmployee.email) {
      const emailTaken = await employeeRepository.findByEmail(email);
      if (emailTaken && emailTaken.id !== empId) {
        throw new AppError('Employee with this email already exists', 400);
      }
    }

    const updateData = {};
    const oldValues = {};
    const newValues = {};

    if (name) {
      updateData.name = name;
      oldValues.name = existingEmployee.name;
      newValues.name = name;
    }
    if (email) {
      updateData.email = email;
      oldValues.email = existingEmployee.email;
      newValues.email = email;
    }
    if (phone) {
      updateData.phone = phone;
      oldValues.phone = existingEmployee.phone;
      newValues.phone = phone;
    }
    if (address) {
      updateData.address = address;
      oldValues.address = existingEmployee.address;
      newValues.address = address;
    }
    if (departmentId) {
      updateData.departmentId = parseInt(departmentId);
      oldValues.departmentId = existingEmployee.departmentId;
      newValues.departmentId = parseInt(departmentId);
    }
    if (managerId !== undefined) {
      updateData.managerId = managerId ? parseInt(managerId) : null;
      oldValues.managerId = existingEmployee.managerId;
      newValues.managerId = managerId ? parseInt(managerId) : null;
    }

    // Process files
    if (files?.profileImage) {
      deleteFile(existingEmployee.profileImage);
      updateData.profileImage = `uploads/profiles/${files.profileImage[0].filename}`;
      oldValues.profileImage = existingEmployee.profileImage;
      newValues.profileImage = updateData.profileImage;
    }

    if (files?.resume) {
      deleteFile(existingEmployee.resume);
      updateData.resume = `uploads/resumes/${files.resume[0].filename}`;
      oldValues.resume = existingEmployee.resume;
      newValues.resume = updateData.resume;
    }

    if (files?.documents) {
      let oldDocs = [];
      if (existingEmployee.documents) {
        try {
          oldDocs = JSON.parse(existingEmployee.documents);
        } catch (e) {}
      }
      oldDocs.forEach(doc => deleteFile(doc));

      const newDocs = files.documents.map(file => `uploads/documents/${file.filename}`);
      updateData.documents = JSON.stringify(newDocs);
      oldValues.documents = existingEmployee.documents;
      newValues.documents = updateData.documents;
    }

    // Process skills
    if (skills !== undefined) {
      let skillIds = [];
      try {
        skillIds = JSON.parse(skills);
      } catch (e) {
        skillIds = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      }
      const skillInts = skillIds.map(sid => parseInt(sid)).filter(sid => !isNaN(sid));
      updateData.skills = skillInts;
    }

    const updatedEmployee = await employeeRepository.update(empId, updateData);

    await auditTrailService.log(
      'Employee', 
      empId, 
      'UPDATE', 
      oldValues, 
      newValues, 
      actor ? actor.id : null, 
      actor ? actor.name : null
    );

    let docs = [];
    if (updatedEmployee.documents) {
      try {
        docs = JSON.parse(updatedEmployee.documents);
      } catch (e) {
        docs = [];
      }
    }

    return {
      ...updatedEmployee,
      documents: docs
    };
  }

  async deleteEmployee(id, actor) {
    const empId = parseInt(id);
    if (isNaN(empId)) {
      throw new AppError('Invalid employee ID', 400);
    }

    const employee = await employeeRepository.findById(empId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
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

    await employeeRepository.delete(empId);

    await auditTrailService.log(
      'Employee', 
      empId, 
      'DELETE', 
      { name: employee.name, email: employee.email }, 
      null, 
      actor ? actor.id : null, 
      actor ? actor.name : null
    );
  }
}

module.exports = new EmployeeService();
