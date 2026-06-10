const logger = require('../config/logger');

const handlePrismaError = (err) => {
  // Translate Prisma errors to clean operational AppError objects
  if (err.code === 'P2002') {
    return {
      message: `Duplicate field value entered. Unique constraint failed on fields: ${err.meta?.target?.join(', ') || ''}`,
      statusCode: 400
    };
  }
  if (err.code === 'P2025') {
    return {
      message: err.meta?.cause || 'Record not found in database',
      statusCode: 404
    };
  }
  return {
    message: 'Database query execution failed',
    statusCode: 500
  };
};

module.exports = (err, req, res, next) => {
  let errorResponse = {
    statusCode: err.statusCode || 500,
    status: err.status || 'error',
    message: err.message || 'Internal Server Error'
  };

  // Handle Prisma Database errors specifically
  if (err.code && err.code.startsWith('P')) {
    const prismaErr = handlePrismaError(err);
    errorResponse.statusCode = prismaErr.statusCode;
    errorResponse.message = prismaErr.message;
    errorResponse.status = 'fail';
  }

  // Log error using Winston
  if (errorResponse.statusCode === 500) {
    logger.error('CRITICAL ERROR: %s', err.stack || err.message);
  } else {
    logger.warn('Client Error [%s]: %s', errorResponse.statusCode, errorResponse.message);
  }

  res.status(errorResponse.statusCode).json({
    status: errorResponse.status,
    message: errorResponse.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
