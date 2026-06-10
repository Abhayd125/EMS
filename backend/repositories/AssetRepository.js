const prisma = require('../database/db');

class AssetRepository {
  async findById(id) {
    return prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            employee: true
          },
          orderBy: { assignedAt: 'desc' }
        }
      }
    });
  }

  async findBySerialNumber(serialNumber) {
    return prisma.asset.findUnique({
      where: { serialNumber }
    });
  }

  async findMany({ skip, take, search, type, status }) {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              employee: true
            }
          }
        }
      }),
      prisma.asset.count({ where })
    ]);

    return { data, total };
  }

  async create(data) {
    return prisma.asset.create({ data });
  }

  async update(id, data) {
    return prisma.asset.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.asset.delete({
      where: { id }
    });
  }

  async assignAsset(assetId, employeeId, notes) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify asset is available
      const asset = await tx.asset.findUnique({
        where: { id: assetId }
      });

      if (!asset || asset.status !== 'AVAILABLE') {
        throw new Error('ASSET_NOT_AVAILABLE');
      }

      // 2. Update Asset status to ASSIGNED
      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'ASSIGNED' }
      });

      // 3. Create AssetAssignment
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId,
          employeeId,
          status: 'ACTIVE',
          notes
        },
        include: {
          asset: true,
          employee: true
        }
      });

      return assignment;
    });
  }

  async returnAsset(assignmentId, notes) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch current assignment
      const assignment = await tx.assetAssignment.findUnique({
        where: { id: assignmentId }
      });

      if (!assignment || assignment.status !== 'ACTIVE') {
        throw new Error('ASSIGNMENT_NOT_ACTIVE');
      }

      // 2. Update assignment status and returnedAt
      const updatedAssignment = await tx.assetAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
          notes: notes || assignment.notes
        }
      });

      // 3. Update Asset status to AVAILABLE
      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { status: 'AVAILABLE' }
      });

      return updatedAssignment;
    });
  }
}

module.exports = new AssetRepository();
