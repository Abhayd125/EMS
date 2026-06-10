const express = require('express');
const router = express.Router();
const { getUsers, updateUser } = require('../../controllers/userController');
const { protect, restrictTo } = require('../../middleware/authMiddleware');

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/', getUsers);
router.put('/:id', updateUser);

module.exports = router;
