const bcrypt = require('bcrypt');
const prisma = require('../database/db');
const auditTrailService = require('./AuditTrailService');
const notificationService = require('./NotificationService');
const AppError = require('../utils/AppError');

class UserService {
  async getAllUsers() {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { employee: { isNot: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            phone: true,
            address: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return users;
  }

  async updateUser(userId, data, actor) {
    const { name, email, role, password } = data;
    const targetUserId = parseInt(userId);

    if (isNaN(targetUserId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { employee: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updateData = {};
    const oldValues = { name: user.name, email: user.email, role: user.role };
    const newValues = {};

    if (name) {
      updateData.name = name;
      newValues.name = name;
    }
    if (email && email !== user.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        throw new AppError('Email is already taken by another account', 400);
      }
      updateData.email = email;
      newValues.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
      oldValues.password = '[HIDDEN]';
      newValues.password = '[HIDDEN]';
    }

    // Process role change if provided and different
    const isRoleChange = role && role !== user.role;
    if (isRoleChange) {
      if (!['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].includes(role)) {
        throw new AppError('Invalid role specified', 400);
      }
      newValues.role = role;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Handle Role Swapping logic if role is changing
      if (isRoleChange) {
        if (role === 'ADMIN') {
          // Find the current Admin
          const currentAdmin = await tx.user.findFirst({
            where: { role: 'ADMIN', id: { not: targetUserId } },
            include: { employee: true }
          });

          if (currentAdmin) {
            // Demote current Admin to EMPLOYEE
            await tx.user.update({
              where: { id: currentAdmin.id },
              data: { role: 'EMPLOYEE' }
            });

            // Ensure demoted Admin has employee profile
            if (!currentAdmin.employee) {
              const defaultDept = await tx.department.findFirst();
              const deptId = defaultDept ? defaultDept.id : 1;

              const newEmp = await tx.employee.create({
                data: {
                  name: currentAdmin.name,
                  email: currentAdmin.email,
                  phone: '000-000-0000',
                  address: 'Corporate HQ',
                  departmentId: deptId,
                  userId: currentAdmin.id
                }
              });

              await tx.leaveBalance.create({
                data: {
                  employeeId: newEmp.id,
                  sick: 12,
                  casual: 15,
                  paid: 20
                }
              });
            }

            // Create notification for demoted admin
            await notificationService.createNotification(
              currentAdmin.employee ? currentAdmin.employee.id : 1,
              'Account Role Demoted',
              'Your role has been demoted to EMPLOYEE because another user was promoted to ADMIN.',
              'SYSTEM'
            );
          }
        } else if (role === 'HR') {
          // Find the current HR
          const currentHR = await tx.user.findFirst({
            where: { role: 'HR', id: { not: targetUserId } },
            include: { employee: true }
          });

          if (currentHR) {
            // Demote current HR to EMPLOYEE
            await tx.user.update({
              where: { id: currentHR.id },
              data: { role: 'EMPLOYEE' }
            });

            // Create notification for demoted HR
            if (currentHR.employee) {
              await notificationService.createNotification(
                currentHR.employee.id,
                'Account Role Demoted',
                'Your role has been demoted to EMPLOYEE because another user was promoted to HR.',
                'SYSTEM'
              );
            }
          }
        }

        // Apply new role to target user
        updateData.role = role;
      }

      // 2. Perform User update
      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: updateData,
        include: { employee: true }
      });

      // 3. Keep Employee record in sync with User details
      if (updatedUser.employee) {
        const empUpdate = {};
        if (name) empUpdate.name = name;
        if (email) empUpdate.email = email;

        await tx.employee.update({
          where: { id: updatedUser.employee.id },
          data: empUpdate
        });
      } else {
        // If they did not have an employee profile (e.g. they were Admin) and now need one
        if (role === 'HR' || role === 'MANAGER' || role === 'EMPLOYEE' || isRoleChange) {
          const defaultDept = await tx.department.findFirst();
          const deptId = defaultDept ? defaultDept.id : 1;

          const newEmp = await tx.employee.create({
            data: {
              name: updatedUser.name,
              email: updatedUser.email,
              phone: '000-000-0000',
              address: 'Corporate HQ',
              departmentId: deptId,
              userId: updatedUser.id
            }
          });

          await tx.leaveBalance.create({
            data: {
              employeeId: newEmp.id,
              sick: 12,
              casual: 15,
              paid: 20
            }
          });
          
          updatedUser.employee = newEmp;
        }
      }

      return updatedUser;
    });

    // Send notifications outside the transaction
    if (result.employee) {
      await notificationService.createNotification(
        result.employee.id,
        'Account Updated',
        `Your account details have been updated by administrator ${actor.name}.` + 
        (isRoleChange ? ` Your role is now ${role}.` : ''),
        'SYSTEM'
      );
    }

    await notificationService.notifyAdminsAndHR(
      'User Account Changed',
      `User ${result.name}'s account was updated by ${actor.name}.` + 
      (isRoleChange ? ` Role: ${result.role}.` : ''),
      'SYSTEM'
    );

    await auditTrailService.log(
      'User',
      result.id,
      'UPDATE',
      oldValues,
      newValues,
      actor.id,
      actor.name
    );

    return result;
  }
}

module.exports = new UserService();
