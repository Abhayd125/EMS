const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile
} = require('../../controllers/authController');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validationMiddleware');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../../validators/authValidator');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

// Profile routes (protected)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
