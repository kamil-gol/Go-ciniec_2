import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test users...');
  
  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin123!@#', 10);
  const employeePassword = await bcrypt.hash('Employee123!@#', 10);
  
  // Create/update admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gosciniecrodzinny.pl' },
    update: { 
      password: adminPassword, 
      isActive: true 
    },
    create: {
      email: 'admin@gosciniecrodzinny.pl',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user:', admin.email);
  
  // Create/update employee user
  const employee = await prisma.user.upsert({
    where: { email: 'pracownik@gosciniecrodzinny.pl' },
    update: { 
      password: employeePassword, 
      isActive: true 
    },
    create: {
      email: 'pracownik@gosciniecrodzinny.pl',
      password: employeePassword,
      firstName: 'Pracownik',
      lastName: 'Testowy',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });
  console.log('✅ Employee user:', employee.email);
  
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
