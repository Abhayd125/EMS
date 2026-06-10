const notificationRepository = require('../repositories/NotificationRepository');

class NotificationService {
  async createNotification(employeeId, title, message, type) {
    return notificationRepository.create({
      employeeId,
      title,
      message,
      type
    });
  }

  async getNotifications(employeeId) {
    return notificationRepository.findByEmployeeId(employeeId);
  }

  async markRead(id) {
    return notificationRepository.markAsRead(id);
  }

  async markAllRead(employeeId) {
    return notificationRepository.markAllAsRead(employeeId);
  }

  async deleteNotification(id) {
    return notificationRepository.delete(id);
  }

  async notifyRole(role, title, message, type) {
    const prisma = require('../database/db');
    try {
      const users = await prisma.user.findMany({
        where: { role },
        include: { employee: true }
      });
      for (const u of users) {
        if (u.employee) {
          await this.createNotification(u.employee.id, title, message, type);
        }
      }
    } catch (err) {
      const logger = require('../config/logger');
      logger.error('Failed to send role notification for %s: %s', role, err.message);
    }
  }

  async notifyAdminsAndHR(title, message, type) {
    await this.notifyRole('ADMIN', title, message, type);
    await this.notifyRole('HR', title, message, type);
  }
}

module.exports = new NotificationService();
