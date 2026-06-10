const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE').default('EMPLOYEE')
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required()
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required()
});

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
