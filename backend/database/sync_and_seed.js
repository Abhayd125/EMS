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
  console.log('Starting custom database sync and seed...');

  // Create common password hash
  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('password123', salt);

  // 1. Clean up all existing tables except Admin, Abhay, Idita, Samiya
  console.log('Cleaning up non-essential records...');
  
  // We want to delete dependent tables first
  await prisma.auditTrail.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.assetAssignment.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.performance.deleteMany({});

  // Break manager self-relation to delete employees
  await prisma.employee.updateMany({ data: { managerId: null } });
  
  // Delete all employees except we will manually manage them
  await prisma.employee.deleteMany({});

  // Delete all users except Admin, Abhay, Idita, Samiya
  const preservedEmails = [
    'admin@company.com',
    'dubeyabhay910@gmail.com',
    'idita@gmail.com',
    'samiya@gmail.com'
  ];

  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: preservedEmails
      }
    }
  });

  // Delete departments and skills to re-seed cleanly
  await prisma.skill.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('Essential cleanup complete.');

  // 2. Seed Departments
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

  // 3. Seed Skills
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

  // 4. Create/Verify Admin User (no employee link)
  console.log('Checking Admin account...');
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@company.com' } });
  if (adminUser) {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        name: 'Admin Principal',
        password: commonPassword,
        role: 'ADMIN',
        isVerified: true
      }
    });
  } else {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@company.com',
        name: 'Admin Principal',
        password: commonPassword,
        role: 'ADMIN',
        isVerified: true
      }
    });
  }

  // 5. Seed Department Managers (Jane, Bob, David, Sarah, Alice)
  const managersData = [
    { name: 'Jane HR Director', email: 'hr@company.com', role: 'HR', deptName: 'Human Resources' },
    { name: 'Bob Engineering Manager', email: 'manager@company.com', role: 'MANAGER', deptName: 'Engineering' },
    { name: 'David Sales Lead', email: 'sales@company.com', role: 'MANAGER', deptName: 'Sales & Marketing' },
    { name: 'Sarah Product Lead', email: 'product@company.com', role: 'MANAGER', deptName: 'Product Management' },
    { name: 'Alice Finance Lead', email: 'finance@company.com', role: 'MANAGER', deptName: 'Finance & Operations' }
  ];

  const managerEmpMap = {}; // Maps deptName to Manager Employee ID
  const seededEmployees = [];

  for (const mgr of managersData) {
    let u = await prisma.user.findUnique({ where: { email: mgr.email } });
    if (u) {
      u = await prisma.user.update({
        where: { id: u.id },
        data: {
          name: mgr.name,
          password: commonPassword,
          role: mgr.role,
          isVerified: true
        }
      });
    } else {
      u = await prisma.user.create({
        data: {
          email: mgr.email,
          name: mgr.name,
          password: commonPassword,
          role: mgr.role,
          isVerified: true
        }
      });
    }

    const employee = await prisma.employee.create({
      data: {
        name: mgr.name,
        email: mgr.email,
        phone: `+91 ${Math.floor(6000000000 + Math.random() * 4000000000)}`,
        address: 'Company Headquarters, Building A',
        departmentId: deptMap[mgr.deptName],
        userId: u.id,
        leaveBalance: {
          create: { sick: 12, casual: 15, paid: 20 }
        }
      }
    });

    managerEmpMap[mgr.deptName] = employee.id;
    seededEmployees.push(employee);
  }
  console.log('Seeded 5 Managers/HR.');

  // 6. Seed/Preserve the 3 Real Employees (Abhay, Idita, Samiya)
  const realStaffData = [
    { name: 'abhay', email: 'dubeyabhay910@gmail.com', deptName: 'Engineering' },
    { name: 'idita', email: 'idita@gmail.com', deptName: 'Human Resources' },
    { name: 'samiya', email: 'samiya@gmail.com', deptName: 'Sales & Marketing' }
  ];

  for (const rs of realStaffData) {
    let u = await prisma.user.findUnique({ where: { email: rs.email } });
    if (u) {
      u = await prisma.user.update({
        where: { id: u.id },
        data: {
          name: rs.name,
          password: commonPassword,
          role: 'EMPLOYEE',
          isVerified: true
        }
      });
    } else {
      u = await prisma.user.create({
        data: {
          email: rs.email,
          name: rs.name,
          password: commonPassword,
          role: 'EMPLOYEE',
          isVerified: true
        }
      });
    }

    const employee = await prisma.employee.create({
      data: {
        name: rs.name,
        email: rs.email,
        phone: `+91 ${Math.floor(7000000000 + Math.random() * 3000000000)}`,
        address: 'Ora Corporate Hub, Bangalore',
        departmentId: deptMap[rs.deptName],
        userId: u.id,
        managerId: managerEmpMap[rs.deptName],
        leaveBalance: {
          create: { sick: 12, casual: 15, paid: 20 }
        }
      }
    });

    seededEmployees.push(employee);
  }
  console.log('Preserved/Seeded 3 Real Employees (Abhay, Idita, Samiya).');

  // 7. Seed remaining standard employees to reach exactly 110 employees
  // Current count = 5 (managers) + 3 (real) = 8 employees. We need 102 more.
  const targetTotal = 110;
  const neededRandom = targetTotal - seededEmployees.length;
  console.log(`Generating ${neededRandom} standard employees to reach total of ${targetTotal}...`);

  const usedEmails = new Set(preservedEmails.concat(managersData.map(m => m.email)));
  const deptList = Object.keys(deptMap);

  for (let i = 1; i <= neededRandom; i++) {
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
    const managerId = managerEmpMap[deptName] || null;

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
            sick: 12,
            casual: 15,
            paid: 20
          }
        }
      }
    });

    seededEmployees.push(employee);
  }

  // 8. Seed Assets
  console.log('Seeding company assets...');
  const assetTypes = ['LAPTOP', 'MONITOR', 'ID_CARD'];
  const laptopModels = ['MacBook Pro 14"', 'Lenovo ThinkPad X1', 'Dell Latitude 7420', 'HP EliteBook 840'];
  const monitorModels = ['Dell 24" UltraSharp', 'LG 27" DualUp', 'Samsung 27" Odyssey', 'HP 24" ProMonitor'];

  const allAssets = [];

  // Generate 120 Laptops
  for (let l = 1; l <= 120; l++) {
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

  // Generate 120 ID Cards
  for (let idc = 1; idc <= 120; idc++) {
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

  // Allocate Assets to Employees
  console.log('Assigning assets to employees...');
  const laptops = allAssets.filter(a => a.type === 'LAPTOP');
  const idCards = allAssets.filter(a => a.type === 'ID_CARD');

  let lapIdx = 0;
  let idcIdx = 0;

  for (const staff of seededEmployees) {
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

    // 100% get ID badge
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
  }

  console.log('\n======================================================');
  console.log(' DATABASE SEEDING & SYNC COMPLETED SUCCESSFULLY!');
  console.log(` - Total User Accounts: ${await prisma.user.count()} (should be 111)`);
  console.log(` - Total Employees: ${await prisma.employee.count()} (should be 110)`);
  console.log(` - Total Assets: ${await prisma.asset.count()}`);
  console.log(` - Total Allocated Assets: ${await prisma.assetAssignment.count({ where: { status: 'ACTIVE' } })}`);
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
