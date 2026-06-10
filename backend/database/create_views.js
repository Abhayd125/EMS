const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating database views in PostgreSQL...');

  try {
    // 1. DepartmentStatsView
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW "DepartmentStatsView" AS
      SELECT 
        d.id AS "departmentId",
        d.name AS "departmentName",
        COUNT(e.id) AS "employeeCount"
      FROM "Department" d
      LEFT JOIN "Employee" e ON d.id = e."departmentId"
      GROUP BY d.id, d.name;
    `);
    console.log('✔ DepartmentStatsView created successfully.');

    // 2. LeaveSummaryView
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW "LeaveSummaryView" AS
      SELECT 
        e.id AS "employeeId",
        e.name AS "employeeName",
        COALESCE(SUM(CASE WHEN lr.status = 'APPROVED' THEN 1 ELSE 0 END), 0) AS "approvedLeaves",
        COALESCE(SUM(CASE WHEN lr.status = 'PENDING_MANAGER' OR lr.status = 'PENDING_HR' THEN 1 ELSE 0 END), 0) AS "pendingLeaves"
      FROM "Employee" e
      LEFT JOIN "LeaveRequest" lr ON e.id = lr."employeeId"
      GROUP BY e.id, e.name;
    `);
    console.log('✔ LeaveSummaryView created successfully.');

    // 3. AssetAllocationView
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW "AssetAllocationView" AS
      SELECT 
        a.id AS "assetId",
        a.name AS "assetName",
        a."serialNumber" AS "serialNumber",
        a.type AS "assetType",
        a.status AS "assetStatus",
        aa.id AS "assignmentId",
        aa."employeeId" AS "employeeId",
        e.name AS "employeeName",
        aa."assignedAt" AS "assignedAt"
      FROM "Asset" a
      LEFT JOIN "AssetAssignment" aa ON a.id = aa."assetId" AND aa.status = 'ACTIVE'
      LEFT JOIN "Employee" e ON aa."employeeId" = e.id;
    `);
    console.log('✔ AssetAllocationView created successfully.');

    console.log('All database views have been initialized.');
  } catch (error) {
    console.error('Error creating database views:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
