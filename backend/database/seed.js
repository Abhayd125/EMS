const prisma = require('./db');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Seeding database with advanced corporate roles...');

  // 1. Seed Departments
  const departments = [
    { name: 'Engineering', description: 'Software engineering, DevOps, QA, and product delivery teams.' },
    { name: 'Human Resources', description: 'Talent acquisition, employee welfare, operations, and culture.' },
    { name: 'Sales & Marketing', description: 'Client acquisition, branding, campaigns, and customer success.' },
    { name: 'Product Management', description: 'Product design, UI/UX research, and roadmap planning.' }
  ];

  const deptMap = {};
  for (const dept of departments) {
    const createdDept = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept
    });
    deptMap[dept.name] = createdDept.id;
  }
  console.log('Departments seeded.');

  // 2. Seed Skills
  const skills = [
    'React.js', 'Node.js', 'PostgreSQL', 'Express.js', 'Redux Toolkit',
    'JavaScript', 'Python', 'DevOps & Docker', 'UI/UX Design', 'Project Management'
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill },
      update: {},
      create: { name: skill }
    });
  }
  console.log('Skills seeded.');

  // 3. Seed Users with linked Employee profiles
  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('password123', salt);

  const usersData = [
    {
      email: 'admin@company.com',
      name: 'Corporate Admin',
      role: 'ADMIN',
      empName: 'Admin Staff Member',
      deptName: 'Engineering'
    },
    {
      email: 'hr@company.com',
      name: 'Jane HR Director',
      role: 'HR',
      empName: 'Jane HR Director',
      deptName: 'Human Resources'
    },
    {
      email: 'manager@company.com',
      name: 'Bob Engineering Manager',
      role: 'MANAGER',
      empName: 'Bob Manager',
      deptName: 'Engineering'
    },
    {
      email: 'employee@company.com',
      name: 'Alice Software Engineer',
      role: 'EMPLOYEE',
      empName: 'Alice Developer',
      deptName: 'Engineering',
      managerEmail: 'manager@company.com'
    }
  ];

  const empMap = {};
  for (const ud of usersData) {
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email: ud.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: ud.email,
          name: ud.name,
          password: commonPassword,
          role: ud.role,
          isVerified: true
        }
      });
    }

    // Check if Employee profile exists
    let employee = await prisma.employee.findUnique({ where: { email: ud.email } });
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          name: ud.empName,
          email: ud.email,
          phone: '+91 9999999999',
          address: 'Company Headquarters',
          departmentId: deptMap[ud.deptName],
          userId: user.id,
          leaveBalance: {
            create: { sick: 12, casual: 15, paid: 20 }
          }
        }
      });
    }
    empMap[ud.email] = employee.id;
  }
  console.log('Users and Employee Profiles seeded.');

  // 4. Update Manager hierarchy links (Alice reports to Bob)
  const employeeUser = usersData.find(u => u.managerEmail);
  if (employeeUser) {
    const employeeId = empMap[employeeUser.email];
    const managerId = empMap[employeeUser.managerEmail];
    
    await prisma.employee.update({
      where: { id: employeeId },
      data: { managerId }
    });
    console.log('Manager hierarchical relationship mapped: Alice reports to Bob.');
  }

  console.log('\n==================================================');
  console.log(' SEEDING COMPLETED SUCCESSFUL!');
  console.log(' Credentials for login (Password is "password123"):');
  console.log(' - Admin: admin@company.com');
  console.log(' - HR: hr@company.com');
  console.log(' - Manager: manager@company.com');
  console.log(' - Employee: employee@company.com');
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
