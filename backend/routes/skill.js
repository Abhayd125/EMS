const express = require('express');
const router = express.Router();
const {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill
} = require('../controllers/skillController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSkills);
router.post('/', restrictTo('ADMIN'), createSkill);
router.put('/:id', restrictTo('ADMIN'), updateSkill);
router.delete('/:id', restrictTo('ADMIN'), deleteSkill);

module.exports = router;
