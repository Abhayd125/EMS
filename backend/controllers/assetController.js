const assetService = require('../services/AssetService');

const getAssets = async (req, res, next) => {
  try {
    const result = await assetService.getAssets(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAssetById = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    res.status(200).json({ asset });
  } catch (error) {
    next(error);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body, req.user);
    res.status(201).json({ message: 'Asset created successfully', asset });
  } catch (error) {
    next(error);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body, req.user);
    res.status(200).json({ message: 'Asset updated successfully', asset });
  } catch (error) {
    next(error);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.params.id, req.user);
    res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const assignAsset = async (req, res, next) => {
  try {
    const { employeeId, notes } = req.body;
    const assignment = await assetService.assignAsset(req.params.id, employeeId, notes, req.user);
    res.status(200).json({ message: 'Asset assigned successfully', assignment });
  } catch (error) {
    next(error);
  }
};

const returnAsset = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const assignment = await assetService.returnAsset(req.params.id, notes, req.user);
    res.status(200).json({ message: 'Asset returned successfully', assignment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  returnAsset
};
