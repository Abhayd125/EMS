const auditTrailRepository = require('../repositories/AuditTrailRepository');

class AuditTrailService {
  async log(tableName, recordId, action, oldValues, newValues, actorId, actorName) {
    try {
      return await auditTrailRepository.create({
        tableName,
        recordId,
        action,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        actorId,
        actorName
      });
    } catch (err) {
      const logger = require('../config/logger');
      logger.error('Audit trail logging failed: %s', err.message);
    }
  }

  async getLogs(params) {
    return auditTrailRepository.findMany(params);
  }
}

module.exports = new AuditTrailService();
