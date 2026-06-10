const attendanceService = require('../services/AttendanceService');

const checkIn = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkIn(req.user.id, req.body.notes);
    res.status(201).json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkOut(req.user.id, req.body.notes);
    res.status(200).json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    next(error);
  }
};

const getTodayStatus = async (req, res, next) => {
  try {
    const status = await attendanceService.getTodayStatus(req.user.id);
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const logs = await attendanceService.getMyAttendance(req.user.id);
    res.status(200).json({ logs });
  } catch (error) {
    next(error);
  }
};

const getAllAttendance = async (req, res, next) => {
  try {
    const logs = await attendanceService.getAllAttendance(req.query);
    res.status(200).json({ logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance
};
