const prisma = require('../database/db');

class NotificationRepository {
  async create(data) {
    return prisma.notification.create({
      data,
      include: {
        employee: true
      }
    });
  }

  async findByEmployeeId(employeeId) {
    return prisma.notification.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(id) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllAsRead(employeeId) {
    return prisma.notification.updateMany({
      where: { employeeId, isRead: false },
      data: { isRead: true }
    });
  }

  async delete(id) {
    return prisma.notification.delete({
      where: { id }
    });
  }
}

module.exports = new NotificationRepository();
