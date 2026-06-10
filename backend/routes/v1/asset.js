const express = require('express');
const router = express.Router();
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  returnAsset
} = require('../../controllers/assetController');
const { protect, restrictTo } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validationMiddleware');
const {
  createAssetSchema,
  assignAssetSchema
} = require('../../validators/assetValidator');

router.use(protect);

router.get('/', getAssets);
router.get('/:id', getAssetById);
router.post('/', restrictTo('ADMIN', 'HR'), validate(createAssetSchema), createAsset);
router.put('/:id', restrictTo('ADMIN', 'HR'), updateAsset);
router.delete('/:id', restrictTo('ADMIN'), deleteAsset);
router.post('/:id/assign', restrictTo('ADMIN', 'HR'), validate(assignAssetSchema), assignAsset);
router.post('/assignment/:id/return', restrictTo('ADMIN', 'HR'), returnAsset); // Note: returns by assignment ID

module.exports = router;
