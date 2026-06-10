const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification
} = require('../../controllers/notificationController');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markRead);
router.put('/mark-all-read', markAllRead);
router.delete('/:id', deleteNotification);

module.exports = router;
