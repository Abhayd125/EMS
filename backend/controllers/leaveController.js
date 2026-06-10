const leaveService = require('../services/LeaveService');

const getLeaveBalance = async (req, res, next) => {
  try {
    const balance = await leaveService.getLeaveBalance(req.user.id);
    res.status(200).json({ balance });
  } catch (error) {
    next(error);
  }
};

const applyLeave = async (req, res, next) => {
  try {
    const leaveRequest = await leaveService.applyLeave(req.body, req.user);
    res.status(201).json({ message: 'Leave application submitted successfully', leaveRequest });
  } catch (error) {
    next(error);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await leaveService.getMyLeaves(req.user.id);
    res.status(200).json({ leaves });
  } catch (error) {
    next(error);
  }
};

const getPendingApprovals = async (req, res, next) => {
  try {
    const approvals = await leaveService.getPendingApprovals(req.user);
    res.status(200).json({ approvals });
  } catch (error) {
    next(error);
  }
};

const reviewManager = async (req, res, next) => {
  try {
    const updatedRequest = await leaveService.reviewManager(req.params.id, req.body, req.user);
    res.status(200).json({
      message: `Leave request status updated to ${updatedRequest.status}`,
      leaveRequest: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

const reviewHR = async (req, res, next) => {
  try {
    const updatedRequest = await leaveService.reviewHR(req.params.id, req.body, req.user);
    res.status(200).json({
      message: `Leave request status finalized: ${updatedRequest.status}`,
      leaveRequest: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

const getLeavesStats = async (req, res, next) => {
  try {
    const stats = await leaveService.getLeavesStats();
    res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaveBalance,
  applyLeave,
  getMyLeaves,
  getPendingApprovals,
  reviewManager,
  reviewHR,
  getLeavesStats
};
