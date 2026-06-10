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
}

module.exports = new NotificationService();
