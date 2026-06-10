const AppError = require('../utils/AppError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      allowUnknown: true, // Allow unknown properties in req.body
      stripUnknown: true // Remove unknown properties from req.body
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message.replace(/"/g, ''))
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    // Replace req.body with validated and sanitized values
    req.body = value;
    next();
  };
};

module.exports = validate;
