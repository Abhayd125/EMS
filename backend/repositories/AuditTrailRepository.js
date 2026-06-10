const prisma = require('../database/db');

class AuditTrailRepository {
  async create(data) {
    return prisma.auditTrail.create({ data });
  }

  async findMany({ skip, take, tableName, recordId, action }) {
    const where = {};
    if (tableName) where.tableName = tableName;
    if (recordId) where.recordId = recordId;
    if (action) where.action = action;

    const [data, total] = await Promise.all([
      prisma.auditTrail.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditTrail.count({ where })
    ]);

    return { data, total };
  }
}

module.exports = new AuditTrailRepository();
