const notificationService = require('../services/NotificationService');
const employeeRepository = require('../repositories/EmployeeRepository');
const AppError = require('../utils/AppError');

const getNotifications = async (req, res, next) => {
  try {
    const employee = await employeeRepository.findByUserId(req.user.id);
    if (!employee) {
      return res.status(200).json({ notifications: [] });
    }
    const notifications = await notificationService.getNotifications(employee.id);
    res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      throw new AppError('Invalid notification ID', 400);
    }
    const notification = await notificationService.markRead(notificationId);
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const employee = await employeeRepository.findByUserId(req.user.id);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }
    await notificationService.markAllRead(employee.id);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      throw new AppError('Invalid notification ID', 400);
    }
    await notificationService.deleteNotification(notificationId);
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification
};
