const Joi = require('joi');
const logger = require('./logger');

const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  JWT_SECRET: Joi.string().required().description('JWT Secret Key required for auth signatures'),
  DATABASE_URL: Joi.string().required().description('PostgreSQL Connection URL required'),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional().default('noreply@ora-ems.com')
}).unknown().required();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  logger.error('Config validation failed: %s', error.message);
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  port: envVars.PORT,
  env: envVars.NODE_ENV,
  jwtSecret: envVars.JWT_SECRET,
  databaseUrl: envVars.DATABASE_URL,
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    secure: envVars.SMTP_PORT === 465,
    auth: envVars.SMTP_USER && envVars.SMTP_PASS ? {
      user: envVars.SMTP_USER,
      pass: envVars.SMTP_PASS
    } : null,
    from: envVars.SMTP_FROM
  }
};
