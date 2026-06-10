const assetRepository = require('../repositories/AssetRepository');
const employeeRepository = require('../repositories/EmployeeRepository');
const notificationService = require('./NotificationService');
const auditTrailService = require('./AuditTrailService');
const AppError = require('../utils/AppError');

class AssetService {
  async getAssetById(id) {
    const assetId = parseInt(id);
    if (isNaN(assetId)) {
      throw new AppError('Invalid asset ID', 400);
    }
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new AppError('Asset not found', 404);
    }
    return asset;
  }

  async getAssets(query) {
    const { page = 1, limit = 10, search, type, status } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const { data, total } = await assetRepository.findMany({
      skip,
      take,
      search,
      type,
      status
    });

    return {
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  async createAsset(data, actor) {
    const { name, serialNumber, type, status } = data;

    if (!name || !serialNumber || !type) {
      throw new AppError('Name, serial number and type are required', 400);
    }

    const existing = await assetRepository.findBySerialNumber(serialNumber);
    if (existing) {
      throw new AppError('Asset with this serial number already exists', 400);
    }

    const asset = await assetRepository.create({
      name,
      serialNumber,
      type,
      status: status || 'AVAILABLE'
    });

    await auditTrailService.log(
      'Asset',
      asset.id,
      'CREATE',
      null,
      asset,
      actor ? actor.id : null,
      actor ? actor.name : null
    );

    return asset;
  }

  async updateAsset(id, data, actor) {
    const assetId = parseInt(id);
    if (isNaN(assetId)) {
      throw new AppError('Invalid asset ID', 400);
    }

    const existing = await assetRepository.findById(assetId);
    if (!existing) {
      throw new AppError('Asset not found', 404);
    }

    const { name, serialNumber, type, status } = data;

    if (serialNumber && serialNumber !== existing.serialNumber) {
      const serialTaken = await assetRepository.findBySerialNumber(serialNumber);
      if (serialTaken && serialTaken.id !== assetId) {
        throw new AppError('Asset with this serial number already exists', 400);
      }
    }

    const updateData = {};
    const oldValues = {};
    const newValues = {};

    if (name) {
      updateData.name = name;
      oldValues.name = existing.name;
      newValues.name = name;
    }
    if (serialNumber) {
      updateData.serialNumber = serialNumber;
      oldValues.serialNumber = existing.serialNumber;
      newValues.serialNumber = serialNumber;
    }
    if (type) {
      updateData.type = type;
      oldValues.type = existing.type;
      newValues.type = type;
    }
    if (status) {
      updateData.status = status;
      oldValues.status = existing.status;
      newValues.status = status;
    }

    const updated = await assetRepository.update(assetId, updateData);

    await auditTrailService.log(
      'Asset',
      assetId,
      'UPDATE',
      oldValues,
      newValues,
      actor ? actor.id : null,
      actor ? actor.name : null
    );

    return updated;
  }

  async deleteAsset(id, actor) {
    const assetId = parseInt(id);
    if (isNaN(assetId)) {
      throw new AppError('Invalid asset ID', 400);
    }

    const existing = await assetRepository.findById(assetId);
    if (!existing) {
      throw new AppError('Asset not found', 404);
    }

    if (existing.status === 'ASSIGNED') {
      throw new AppError('Cannot delete an asset that is currently assigned to an employee', 400);
    }

    await assetRepository.delete(assetId);

    await auditTrailService.log(
      'Asset',
      assetId,
      'DELETE',
      existing,
      null,
      actor ? actor.id : null,
      actor ? actor.name : null
    );
  }

  async assignAsset(assetId, employeeId, notes, actor) {
    const aId = parseInt(assetId);
    const empId = parseInt(employeeId);

    if (isNaN(aId) || isNaN(empId)) {
      throw new AppError('Invalid asset or employee ID', 400);
    }

    const asset = await assetRepository.findById(aId);
    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    const employee = await employeeRepository.findById(empId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (asset.status !== 'AVAILABLE') {
      throw new AppError('Asset is not available for assignment', 400);
    }

    const assignment = await assetRepository.assignAsset(aId, empId, notes);

    // Notify employee
    try {
      await notificationService.createNotification(
        empId,
        'Asset Assigned',
        `A new asset (${asset.name} - ${asset.serialNumber}) has been assigned to you.`,
        'ASSET'
      );
    } catch (err) {
      const logger = require('../config/logger');
      logger.error('Asset assignment notification failed: %s', err.message);
    }

    await auditTrailService.log(
      'AssetAssignment',
      assignment.id,
      'CREATE',
      null,
      assignment,
      actor ? actor.id : null,
      actor ? actor.name : null
    );

    return assignment;
  }

  async returnAsset(assignmentId, notes, actor) {
    const assignId = parseInt(assignmentId);
    if (isNaN(assignId)) {
      throw new AppError('Invalid assignment ID', 400);
    }

    const prisma = require('../database/db');
    const assignment = await prisma.assetAssignment.findUnique({
      where: { id: assignId },
      include: { asset: true }
    });

    if (!assignment) {
      throw new AppError('Asset assignment not found', 404);
    }

    if (assignment.status !== 'ACTIVE') {
      throw new AppError('Asset assignment is already closed', 400);
    }

    const updatedAssignment = await assetRepository.returnAsset(assignId, notes);

    // Notify employee
    try {
      await notificationService.createNotification(
        assignment.employeeId,
        'Asset Returned',
        `The asset (${assignment.asset.name} - ${assignment.asset.serialNumber}) has been successfully returned.`,
        'ASSET'
      );
    } catch (err) {
      const logger = require('../config/logger');
      logger.error('Asset return notification failed: %s', err.message);
    }

    await auditTrailService.log(
      'AssetAssignment',
      assignId,
      'UPDATE',
      { status: 'ACTIVE' },
      { status: 'RETURNED', notes },
      actor ? actor.id : null,
      actor ? actor.name : null
    );

    return updatedAssignment;
  }
}

module.exports = new AssetService();
