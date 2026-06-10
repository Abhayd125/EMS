const authService = require('../services/AuthService');

const signup = async (req, res, next) => {
  try {
    const user = await authService.signup(req.body);
    res.status(201).json({
      message: 'Signup successful! Please check email for verification link.',
      userId: user.id
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    let token = req.cookies?.refreshToken;
    
    if (!token && req.headers['x-refresh-token']) {
      token = req.headers['x-refresh-token'];
    }

    if (!token) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const result = await authService.refreshToken(token);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      accessToken: result.accessToken
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    let token = req.cookies?.refreshToken;
    if (!token && req.headers['x-refresh-token']) {
      token = req.headers['x-refresh-token'];
    }

    if (token) {
      await authService.logout(token);
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    await authService.verifyEmail(req.params.token);
    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ message: 'Password reset link sent to your email (if registered).' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    res.status(200).json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateProfile(req.user.id, req.body, req.user);
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified
      }
    });
  } catch (error) {
    next(error);
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
