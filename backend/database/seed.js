const prisma = require('./db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
  'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
  'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah',
  'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia',
  'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna',
  'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Gregory', 'Christine', 'Alexander', 'Debra', 'Frank', 'Rachel',
  'Patrick', 'Carolyn', 'Raymond', 'Janet', 'Jack', 'Maria', 'Dennis', 'Catherine', 'Jerry', 'Heather'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

async function main() {
  // Check if database is already populated
  const userCount = await prisma.user.count();
  if (userCount > 0 && process.env.FORCE_SEED !== 'true') {
    console.log('Database already has records. Skipping seeding to prevent overwriting/data loss.');
    return;
  }

  console.log('Cleaning existing database records...');
  
  // Delete in dependency order
  await prisma.auditTrail.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.assetAssignment.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  
  // Break manager self-relation to delete employees
  await prisma.employee.updateMany({ data: { managerId: null } });
  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('Database cleaned. Starting seeding of 100+ realistic records...');

  // 1. Seed Departments
  const depts = [
    { name: 'Engineering', description: 'Software engineering, QA, DevOps, and cloud systems.' },
    { name: 'Human Resources', description: 'Talent acquisition, operations, and employee success.' },
    { name: 'Sales & Marketing', description: 'Client acquisition, marketing campaigns, and growth.' },
    { name: 'Product Management', description: 'Product roadmap, design, and UI/UX research.' },
    { name: 'Finance & Operations', description: 'Financial planning, accounting, and office logistics.' }
  ];

  const deptMap = {};
  for (const dept of depts) {
    const created = await prisma.department.create({ data: dept });
    deptMap[dept.name] = created.id;
  }
  console.log('Departments seeded.');

  // 2. Seed Skills
  const skillsData = [
    'React.js', 'Node.js', 'PostgreSQL', 'Express.js', 'Redux Toolkit',
    'JavaScript', 'Python', 'DevOps & Docker', 'UI/UX Design', 'Project Management',
    'Financial Analysis', 'B2B Sales', 'SEO Marketing', 'Talent Sourcing', 'Customer Success'
  ];

  const skills = [];
  for (const skillName of skillsData) {
    const created = await prisma.skill.create({ data: { name: skillName } });
    skills.push(created);
  }
  console.log('Skills seeded.');

  // 3. Create common password hash
  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('password123', salt);

  // 4. Create Directors / Department Managers
  const managersData = [
    { name: 'Jane HR Director', email: 'hr@company.com', role: 'HR', deptName: 'Human Resources' },
    { name: 'Bob Engineering Manager', email: 'manager@company.com', role: 'MANAGER', deptName: 'Engineering' },
    { name: 'David Sales Lead', email: 'sales@company.com', role: 'MANAGER', deptName: 'Sales & Marketing' },
    { name: 'Sarah Product Lead', email: 'product@company.com', role: 'MANAGER', deptName: 'Product Management' },
    { name: 'Alice Finance Lead', email: 'finance@company.com', role: 'MANAGER', deptName: 'Finance & Operations' },
    { name: 'Admin Principal', email: 'admin@company.com', role: 'ADMIN', deptName: 'Engineering' }
  ];

  const managerEmpMap = {}; // Maps deptName to Manager Employee ID
  
  for (const mgr of managersData) {
    const user = await prisma.user.create({
      data: {
        email: mgr.email,
        name: mgr.name,
        password: commonPassword,
        role: mgr.role,
        isVerified: true
      }
    });

    const employee = await prisma.employee.create({
      data: {
        name: mgr.name,
        email: mgr.email,
        phone: `+91 ${Math.floor(6000000000 + Math.random() * 4000000000)}`,
        address: 'Company Headquarters, Building A',
        departmentId: deptMap[mgr.deptName],
        userId: user.id,
        leaveBalance: {
          create: { sick: 12, casual: 15, paid: 20 }
        }
      }
    });

    if (mgr.role === 'MANAGER' || mgr.role === 'HR') {
      managerEmpMap[mgr.deptName] = employee.id;
    }

    // Audit logs for managers
    await prisma.auditTrail.create({
      data: {
        tableName: 'User/Employee',
        recordId: employee.id,
        action: 'CREATE',
        newValues: { name: mgr.name, email: mgr.email, role: mgr.role }
      }
    });
  }
  console.log('Managers/Admins seeded.');

  // 5. Generate remaining 100 Employees
  console.log('Generating 100+ standard employees...');
  const usedEmails = new Set(managersData.map(m => m.email));
  const deptList = Object.keys(deptMap);
  
  const createdEmployees = [];

  for (let i = 1; i <= 104; i++) {
    // Generate unique name
    let firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    let lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    let fullName = `${firstName} ${lastName}`;
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
    
    // De-duplicate email
    let counter = 1;
    while (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}@company.com`;
      counter++;
    }
    usedEmails.add(email);

    // Assign Department & Manager
    const deptName = deptList[i % deptList.length];
    const departmentId = deptMap[deptName];
    const managerId = managerEmpMap[deptName] || null; // Reports to their department manager

    const user = await prisma.user.create({
      data: {
        email,
        name: fullName,
        password: commonPassword,
        role: 'EMPLOYEE',
        isVerified: true
      }
    });

    // Random skills
    const randomSkills = [];
    const skillCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 skills
    const shuffledSkills = [...skills].sort(() => 0.5 - Math.random());
    for (let s = 0; s < skillCount; s++) {
      randomSkills.push({ id: shuffledSkills[s].id });
    }

    const employee = await prisma.employee.create({
      data: {
        name: fullName,
        email,
        phone: `+91 ${Math.floor(7000000000 + Math.random() * 3000000000)}`,
        address: `${10 + i}, Tech Boulevard, Sector ${20 + (i % 10)}, Bangalore`,
        departmentId,
        userId: user.id,
        managerId,
        skills: {
          connect: randomSkills
        },
        leaveBalance: {
          create: {
            sick: 10 + Math.floor(Math.random() * 5),
            casual: 12 + Math.floor(Math.random() * 5),
            paid: 15 + Math.floor(Math.random() * 8)
          }
        }
      }
    });

    createdEmployees.push(employee);

    await prisma.auditTrail.create({
      data: {
        tableName: 'Employee',
        recordId: employee.id,
        action: 'CREATE',
        newValues: { name: fullName, email, departmentId }
      }
    });
  }
  console.log(`Generated ${createdEmployees.length} standard employees.`);

  // 6. Seed Assets
  console.log('Seeding company assets...');
  const assetTypes = ['LAPTOP', 'MONITOR', 'ID_CARD'];
  const laptopModels = ['MacBook Pro 14"', 'Lenovo ThinkPad X1', 'Dell Latitude 7420', 'HP EliteBook 840'];
  const monitorModels = ['Dell 24" UltraSharp', 'LG 27" DualUp', 'Samsung 27" Odyssey', 'HP 24" ProMonitor'];

  const allAssets = [];

  // Generate 110 Laptops
  for (let l = 1; l <= 110; l++) {
    const model = laptopModels[l % laptopModels.length];
    const serialNumber = `LAP-${1000 + l}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const asset = await prisma.asset.create({
      data: {
        name: model,
        serialNumber,
        type: 'LAPTOP',
        status: 'AVAILABLE'
      }
    });
    allAssets.push(asset);
  }

  // Generate 90 Monitors
  for (let m = 1; m <= 90; m++) {
    const model = monitorModels[m % monitorModels.length];
    const serialNumber = `MON-${2000 + m}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const asset = await prisma.asset.create({
      data: {
        name: model,
        serialNumber,
        type: 'MONITOR',
        status: 'AVAILABLE'
      }
    });
    allAssets.push(asset);
  }

  // Generate 125 ID Cards
  for (let idc = 1; idc <= 125; idc++) {
    const serialNumber = `ORA-ID-${3000 + idc}`;
    const asset = await prisma.asset.create({
      data: {
        name: 'ORA Corporate Badge',
        serialNumber,
        type: 'ID_CARD',
        status: 'AVAILABLE'
      }
    });
    allAssets.push(asset);
  }
  console.log('Assets catalog created.');

  // 7. Allocate Assets to Employees (Assign laptops and ID cards to almost everyone, monitors to some)
  console.log('Assigning assets to employees...');
  const allStaff = await prisma.employee.findMany();
  
  const laptops = allAssets.filter(a => a.type === 'LAPTOP');
  const monitors = allAssets.filter(a => a.type === 'MONITOR');
  const idCards = allAssets.filter(a => a.type === 'ID_CARD');

  let lapIdx = 0;
  let monIdx = 0;
  let idcIdx = 0;

  for (const staff of allStaff) {
    // 95% get a laptop
    if (Math.random() < 0.95 && lapIdx < laptops.length) {
      const laptop = laptops[lapIdx++];
      await prisma.assetAssignment.create({
        data: {
          assetId: laptop.id,
          employeeId: staff.id,
          status: 'ACTIVE',
          notes: 'Standard provisioning on onboarding.'
        }
      });
      await prisma.asset.update({
        where: { id: laptop.id },
        data: { status: 'ASSIGNED' }
      });
    }

    // 100% get an ID badge
    if (idcIdx < idCards.length) {
      const idc = idCards[idcIdx++];
      await prisma.assetAssignment.create({
        data: {
          assetId: idc.id,
          employeeId: staff.id,
          status: 'ACTIVE',
          notes: 'Access badge provisioned.'
        }
      });
      await prisma.asset.update({
        where: { id: idc.id },
        data: { status: 'ASSIGNED' }
      });
    }

    // 50% get a monitor
    if (Math.random() < 0.50 && monIdx < monitors.length) {
      const monitor = monitors[monIdx++];
      await prisma.assetAssignment.create({
        data: {
          assetId: monitor.id,
          employeeId: staff.id,
          status: 'ACTIVE',
          notes: 'Dual screen desktop setup.'
        }
      });
      await prisma.asset.update({
        where: { id: monitor.id },
        data: { status: 'ASSIGNED' }
      });
    }
  }
  console.log('Asset allocations completed.');

  // 8. Seed Leave History (approved, pending, rejected)
  console.log('Seeding leave history logs...');
  const leaveTypes = ['SICK', 'CASUAL', 'PAID'];
  const leaveStatuses = ['APPROVED', 'PENDING_MANAGER', 'PENDING_HR', 'REJECTED'];
  const reasons = [
    'Annual family holiday trip',
    'Personal health checkup',
    'Moving to a new apartment',
    'High fever and bed rest',
    'Dental surgery recovery',
    'Attending a family wedding function',
    'Urgent personal bank work'
  ];

  let leavesSeededCount = 0;
  for (const staff of allStaff) {
    // 70% of staff have filed a leave request
    if (Math.random() < 0.70) {
      const count = 1 + Math.floor(Math.random() * 2); // 1 or 2 requests
      for (let l = 0; l < count; l++) {
        const type = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        const status = leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        
        // Dates (randomly in the past or future)
        const offset = Math.floor(Math.random() * 30);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (offset - 5)); // shift around
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (1 + Math.floor(Math.random() * 4))); // 1 to 5 days

        const leaveField = type.toLowerCase(); // 'sick', 'casual', 'paid'
        const duration = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // Ensure we don't exceed balances for approved ones
        const balance = await prisma.leaveBalance.findUnique({ where: { employeeId: staff.id } });
        if (status === 'APPROVED' && balance && balance[leaveField] >= duration) {
          // Decrement balance
          await prisma.leaveBalance.update({
            where: { employeeId: staff.id },
            data: {
              [leaveField]: { decrement: duration }
            }
          });
        }

        const leave = await prisma.leaveRequest.create({
          data: {
            employeeId: staff.id,
            leaveType: type,
            startDate,
            endDate,
            reason,
            status: status === 'APPROVED' ? 'APPROVED' : status,
            managerComment: status !== 'PENDING_MANAGER' ? 'Approved based on team bandwidth.' : null,
            hrComment: status === 'APPROVED' || status === 'REJECTED' ? 'Reviewed and updated in system.' : null
          }
        });

        // Add audit logs
        await prisma.auditLog.create({
          data: {
            leaveRequestId: leave.id,
            action: 'APPLIED',
            actorId: staff.userId || 1,
            actorName: staff.name,
            comment: 'System generated request creation.'
          }
        });

        if (status === 'APPROVED') {
          await prisma.auditLog.create({
            data: {
              leaveRequestId: leave.id,
              action: 'HR_APPROVED',
              actorId: 2, // HR Director ID
              actorName: 'Jane HR Director',
              comment: 'Auto-approved in historical migration.'
            }
          });
        }

        leavesSeededCount++;
      }
    }
  }
  console.log(`Seeded ${leavesSeededCount} leave requests.`);

  // 9. Seed System Notifications
  console.log('Seeding notifications...');
  for (const staff of allStaff) {
    if (Math.random() < 0.40) {
      await prisma.notification.create({
        data: {
          employeeId: staff.id,
          title: 'Welcome to Ora EMS!',
          message: 'Your portal access is fully set up. Please review your profile details.',
          type: 'SYSTEM',
          isRead: Math.random() < 0.70
        }
      });
    }
  }
  console.log('Notifications seeded.');

  console.log('\n======================================================');
  console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log(` - Total Departments: ${depts.length}`);
  console.log(` - Total Skills: ${skills.length}`);
  console.log(` - Total User Accounts: ${await prisma.user.count()}`);
  console.log(` - Total Employees: ${await prisma.employee.count()}`);
  console.log(` - Total Assets: ${await prisma.asset.count()}`);
  console.log(` - Total Allocated Assets: ${await prisma.assetAssignment.count({ where: { status: 'ACTIVE' } })}`);
  console.log(` - Total Leave History Records: ${await prisma.leaveRequest.count()}`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
