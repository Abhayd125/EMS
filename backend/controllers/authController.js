const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';  // Long-lived refresh token

// Utility: Generate Access Token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// Utility: Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

// 1. Sign Up
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user. If it's the very first user, let's make them ADMIN!
    const userCount = await prisma.user.count();
    const assignedRole = userCount === 0 ? 'ADMIN' : (role || 'USER');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
        verificationToken
      }
    });

    // Output verification link to console (for local development)
    const verificationLink = `http://localhost:3000/verify-email/${verificationToken}`;
    console.log(`\n=== EMAIL VERIFICATION LINK FOR ${email} ===`);
    console.log(verificationLink);
    console.log('===============================================\n');

    res.status(201).json({
      message: 'Signup successful! Please check console for verification link.',
      userId: user.id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error during signup' });
  }
};

// 2. Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to db
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

// 3. Refresh Token
const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie or headers
    let token = req.cookies?.refreshToken;
    
    if (!token && req.headers['x-refresh-token']) {
      token = req.headers['x-refresh-token'];
    }

    if (!token) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user and verify DB record matches
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update refresh token in db
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Refresh token invalid/expired' });
  }
};

// 4. Logout
const logout = async (req, res) => {
  try {
    let token = req.cookies?.refreshToken;
    if (!token && req.headers['x-refresh-token']) {
      token = req.headers['x-refresh-token'];
    }

    if (token) {
      // Decode user id
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await prisma.user.update({
          where: { id: decoded.id },
          data: { refreshToken: null }
        });
      } catch (err) {
        // Token invalid, proceed to clear cookie anyway
      }
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

// 5. Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null
      }
    });

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed' });
  }
};

// 6. Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 even if user doesn't exist for security reasons,
      // but log it differently.
      return res.status(200).json({ message: 'Password reset link sent to your email (if registered).' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Output reset link to console (for local development)
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    console.log(`\n=== PASSWORD RESET LINK FOR ${email} ===`);
    console.log(resetLink);
    console.log('===========================================\n');

    res.status(200).json({ message: 'Password reset link sent to your email (check console).' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Forgot password operation failed' });
  }
};

// 7. Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please provide a new password' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.status(200).json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed' });
  }
};

// 8. Get Profile
const getProfile = async (req, res) => {
  try {
    // User is already attached to req.user by protect middleware
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
};

// 9. Update Profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    
    if (email) {
      // Check if email taken
      const emailTaken = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: req.user.id }
        }
      });
      if (emailTaken) {
        return res.status(400).json({ message: 'Email already taken by another user' });
      }
      updateData.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true
      }
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = {
  signup,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile
};
