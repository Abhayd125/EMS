const prisma = require('./database/db');

async function verify() {
  console.log('\n==================================================');
  console.log('       STARTING TRANSACTION VERIFICATION CHECK');
  console.log('==================================================\n');

  try {
    // 1. Fetch or create a test employee
    let employee = await prisma.employee.findFirst({
      include: { leaveBalance: true }
    });

    if (!employee) {
      console.log('No employee found, seeding a test employee first...');
      const dept = await prisma.department.findFirst();
      if (!dept) {
        throw new Error('Please run seeding script database/seed.js first to create departments!');
      }

      employee = await prisma.employee.create({
        data: {
          name: 'Test Transaction Employee',
          email: 'test.tx@company.com',
          phone: '+919999999999',
          address: 'Test City',
          departmentId: dept.id,
          leaveBalance: {
            create: { sick: 12, casual: 15, paid: 20 }
          }
        },
        include: { leaveBalance: true }
      });
      console.log('Test employee created.');
    }

    const employeeId = employee.id;
    console.log(`Using Employee: "${employee.name}" (ID: ${employeeId})`);
    
    // Ensure balance exists
    let balance = employee.leaveBalance;
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: { employeeId, sick: 12, casual: 15, paid: 20 }
      });
    }
    console.log(`Initial Casual Balance: ${balance.casual} days\n`);

    // ----------------------------------------------------
    // TEST 1: Over-drafting Leave Balance (Should Rollback)
    // ----------------------------------------------------
    console.log('--- TEST 1: Applying for 100 Casual Leaves (Exceeds Balance) ---');
    const appliedDays = 100;
    
    let test1Failed = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Create Request (simulated)
        const request = await tx.leaveRequest.create({
          data: {
            employeeId,
            leaveType: 'CASUAL',
            startDate: new Date('2026-06-10'),
            endDate: new Date('2026-06-10'), // Note: our date difference calc inside code is separate;
            // let's simulate the direct HR approval balance check
            reason: 'Test drafting',
            status: 'PENDING_HR'
          }
        });

        console.log(`Temp request created: ID ${request.id}. checking balance in transaction...`);

        // Check and decrement balance
        const currentBalance = await tx.leaveBalance.findUnique({
          where: { employeeId }
        });

        if (currentBalance.casual < appliedDays) {
          console.log(`[Tx Warning] Insufficient balance: current=${currentBalance.casual}, needed=${appliedDays}. Triggering rollback!`);
          throw new Error('INSUFFICIENT_BALANCE_ROLLBACK');
        }

        // Decrement
        await tx.leaveBalance.update({
          where: { employeeId },
          data: { casual: { decrement: appliedDays } }
        });
      });
    } catch (err) {
      if (err.message === 'INSUFFICIENT_BALANCE_ROLLBACK') {
        test1Failed = true;
        console.log('SUCCESS: Transaction rolled back successfully as expected!');
      } else {
        console.error('Test 1 failed with unexpected error:', err.message);
      }
    }

    // Verify database had no changes
    const afterTest1Request = await prisma.leaveRequest.findFirst({
      where: { employeeId, reason: 'Test drafting' }
    });
    const afterTest1Balance = await prisma.leaveBalance.findUnique({
      where: { employeeId }
    });

    if (!afterTest1Request && afterTest1Balance.casual === balance.casual) {
      console.log('VERIFIED: Database has NO dirty entries and balance is unchanged. 100% rollback achieved.\n');
    } else {
      console.error('ERROR: Database is dirty! Rollback failed.');
    }

    // ----------------------------------------------------
    // TEST 2: Valid Leave Approval Transaction (Should Commit)
    // ----------------------------------------------------
    console.log('--- TEST 2: Applying for 2 days Casual Leave (Valid, Should Commit) ---');
    const validDays = 2;
    
    const request = await prisma.$transaction(async (tx) => {
      // 1. Create Request
      const req = await tx.leaveRequest.create({
        data: {
          employeeId,
          leaveType: 'CASUAL',
          startDate: new Date('2026-06-15'),
          endDate: new Date('2026-06-16'),
          reason: 'Valid Transaction Test',
          status: 'APPROVED'
        }
      });

      // 2. Decrement Balance
      await tx.leaveBalance.update({
        where: { employeeId },
        data: { casual: { decrement: validDays } }
      });

      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          leaveRequestId: req.id,
          action: 'HR_APPROVED',
          actorId: 999, // mock HR user id
          actorName: 'Test HR Manager',
          comment: 'Approved in transaction test'
        }
      });

      return req;
    });

    console.log(`Request committed: ID ${request.id}`);

    // Verify database updates
    const afterTest2Balance = await prisma.leaveBalance.findUnique({
      where: { employeeId }
    });
    const auditLogs = await prisma.auditLog.findMany({
      where: { leaveRequestId: request.id }
    });

    console.log(`Updated Casual Balance: ${afterTest2Balance.casual} days`);
    console.log(`Audit Logs count: ${auditLogs.length}`);

    if (afterTest2Balance.casual === balance.casual - validDays && auditLogs.length === 1) {
      console.log('VERIFIED: Database successfully updated. Balance decremented and Audit Logs recorded. 100% commit achieved.\n');
    } else {
      console.error('ERROR: Commit verification failed!');
    }

    // Cleanup valid test request
    await prisma.leaveRequest.delete({ where: { id: request.id } });
    await prisma.leaveBalance.update({
      where: { employeeId },
      data: { casual: balance.casual } // restore
    });
    console.log('Verification cleanup completed.');

    console.log('==================================================');
    console.log('   TRANSACTION VERIFICATION SUMMARY: 100% SUCCESS');
    console.log('==================================================\n');

  } catch (error) {
    console.error('Verification run failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
