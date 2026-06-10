const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/UserRepository');
const prisma = require('../database/db');
const emailService = require('./EmailService');
const auditTrailService = require('./AuditTrailService');
const AppError = require('../utils/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

class AuthService {
  async signup(data) {
    const { name, email, password, role } = data;

    if (!name || !email || !password) {
      throw new AppError('Please provide name, email and password', 400);
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const assignedRole = role === 'USER' || !role ? 'EMPLOYEE' : role;

    // Enforce business rules: Only one ADMIN and only one HR in the system
    if (assignedRole === 'ADMIN') {
      const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (adminExists) {
        throw new AppError('An Admin account already exists. Only one Admin is allowed in the system.', 400);
      }
    }

    if (assignedRole === 'HR') {
      const hrExists = await prisma.user.findFirst({ where: { role: 'HR' } });
      if (hrExists) {
        throw new AppError('An HR account already exists. Only one HR is allowed in the system.', 400);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: assignedRole,
          verificationToken
        }
      });

      // Automatically create corresponding Employee profile for employees/managers/HR
      if (assignedRole === 'EMPLOYEE' || assignedRole === 'MANAGER' || assignedRole === 'HR') {
        const defaultDept = await tx.department.findFirst();
        const deptId = defaultDept ? defaultDept.id : 1;

        const employee = await tx.employee.create({
          data: {
            name,
            email,
            phone: '000-000-0000',
            address: 'Corporate HQ',
            departmentId: deptId,
            userId: newUser.id
          }
        });

        await tx.leaveBalance.create({
          data: {
            employeeId: employee.id,
            sick: 12,
            casual: 15,
            paid: 20
          }
        });
      }

      return newUser;
    });

    try {
      await emailService.sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      const logger = require('../config/logger');
      logger.error('Failed to send verification email to %s: %s', email, emailErr.message);
    }

    await auditTrailService.log('User', user.id, 'CREATE', null, { name, email, role: assignedRole }, user.id, user.name);

    return user;
  }

  async login(email, password) {
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 400);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await userRepository.update(user.id, { refreshToken });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        employeeId: user.employee ? user.employee.id : null
      }
    };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await userRepository.findById(decoded.id);

      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }

      const newAccessToken = generateAccessToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      await userRepository.update(user.id, { refreshToken: newRefreshToken });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Refresh token invalid/expired', 401);
    }
  }

  async logout(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      await userRepository.update(decoded.id, { refreshToken: null });
    } catch (err) {
      // ignore token validation failures on logout
    }
  }

  async verifyEmail(token) {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    await userRepository.update(user.id, {
      isVerified: true,
      verificationToken: null
    });

    await auditTrailService.log('User', user.id, 'UPDATE', { isVerified: false }, { isVerified: true }, user.id, user.name);
  }

  async forgotPassword(email) {
    if (!email) {
      throw new AppError('Please provide email', 400);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Return true to pretend it was sent, preventing email enumeration attacks
      return true;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await userRepository.update(user.id, {
      resetToken,
      resetTokenExpiry
    });

    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (emailErr) {
      const logger = require('../config/logger');
      logger.error('Failed to send password reset email to %s: %s', email, emailErr.message);
    }

    return true;
  }

  async resetPassword(token, password) {
    if (!password) {
      throw new AppError('Please provide a new password', 400);
    }

    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new AppError('Reset token is invalid or has expired', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    await auditTrailService.log('User', user.id, 'UPDATE', { password: '[HIDDEN]' }, { password: '[HIDDEN]' }, user.id, user.name);
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async updateProfile(userId, data, actor) {
    const { name, email, password } = data;
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updateData = {};
    const oldValues = {};
    const newValues = {};

    if (name) {
      updateData.name = name;
      oldValues.name = user.name;
      newValues.name = name;
    }

    if (email) {
      const emailTaken = await userRepository.findByEmail(email);
      if (emailTaken && emailTaken.id !== userId) {
        throw new AppError('Email already taken by another user', 400);
      }
      updateData.email = email;
      oldValues.email = user.email;
      newValues.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
      oldValues.password = '[HIDDEN]';
      newValues.password = '[HIDDEN]';
    }

    const updatedUser = await userRepository.update(userId, updateData);

    await auditTrailService.log('User', userId, 'UPDATE', oldValues, newValues, actor.id, actor.name);

    return updatedUser;
  }
}

module.exports = new AuthService();
