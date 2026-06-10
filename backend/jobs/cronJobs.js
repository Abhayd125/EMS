const cron = require('node-cron');
const prisma = require('../database/db');
const logger = require('../config/logger');

// Setup cron tasks
const initCronJobs = () => {
  // 1. Clean up read notifications older than 30 days every day at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily notification cleanup job...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      logger.info('Cleaned up %d read notifications older than 30 days.', deleted.count);
    } catch (err) {
      logger.error('Error in daily notification cleanup job: %s', err.message);
    }
  });

  // 2. Scan active asset assignments and print warning for long-held assets (e.g., > 180 days) once a week (0 0 * * 0)
  cron.schedule('0 0 * * 0', async () => {
    logger.info('Running weekly asset assignment health check...');
    try {
      const hundredEightyDaysAgo = new Date();
      hundredEightyDaysAgo.setDate(hundredEightyDaysAgo.getDate() - 180);

      const longAssignments = await prisma.assetAssignment.findMany({
        where: {
          status: 'ACTIVE',
          assignedAt: {
            lt: hundredEightyDaysAgo
          }
        },
        include: {
          employee: true,
          asset: true
        }
      });

      if (longAssignments.length > 0) {
        logger.warn('Weekly check: %d assets have been assigned for more than 180 days!', longAssignments.length);
        for (const item of longAssignments) {
          logger.warn(`Asset ${item.asset.name} (${item.asset.serialNumber}) held by ${item.employee.name} since ${item.assignedAt}`);
        }
      } else {
        logger.info('Weekly check: No assets held for more than 180 days.');
      }
    } catch (err) {
      logger.error('Error in weekly asset assignment health check: %s', err.message);
    }
  });

  logger.info('Background cron jobs successfully initialized.');
};

module.exports = {
  initCronJobs
};
