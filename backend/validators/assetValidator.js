const Joi = require('joi');

const createAssetSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  serialNumber: Joi.string().trim().alphanum().min(5).max(50).required(),
  type: Joi.string().valid('LAPTOP', 'MONITOR', 'ID_CARD', 'OTHER').required()
});

const assignAssetSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  notes: Joi.string().trim().max(300).allow('', null)
});

module.exports = {
  createAssetSchema,
  assignAssetSchema
};
