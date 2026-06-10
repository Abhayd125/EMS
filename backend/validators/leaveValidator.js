const Joi = require('joi');

const applyLeaveSchema = Joi.object({
  leaveType: Joi.string().valid('SICK', 'CASUAL', 'PAID').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
    .messages({ 'date.min': 'End date must be greater than or equal to start date' }),
  reason: Joi.string().trim().min(5).max(500).required()
});

const reviewLeaveSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required(),
  comment: Joi.string().trim().max(300).allow('', null)
});

module.exports = {
  applyLeaveSchema,
  reviewLeaveSchema
};
