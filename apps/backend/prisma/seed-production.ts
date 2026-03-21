/**
 * 🔒 PRODUCTION SEED SCRIPT
 *
 * Safe seed for production environments.
 * Creates ONLY:
 *   1. RBAC roles & permissions
 *   2. Company settings
 *   3. Dish categories
 *   4. Menu data (dishes, templates, packages)
 *   5. ONE admin user (password from SEED_ADMIN_PASSWORD env variable)
 *   6. Document templates (10 default templates)
 *
 * Does NOT create:
 *   ❌ Test users with known passwords
 *   ❌ Demo clients
 *   ❌ Demo reservations
 *   ❌ Demo deposits
 *
 * Usage:
 *   SEED_ADMIN_PASSWORD='YourStr0ng!Pass' npx ts-node prisma/seed-production.ts
 *
 * ⚠️  SEED_ADMIN_PASSWORD is REQUIRED. Script will exit if not set.
 */

import { prisma } from './lib/prisma.js';
import * as bcrypt from 'bcryptjs';
import { seedRBAC } from './seeds/rbac.seed';
import { seedDishCategories } from './seeds/dish-categories.seed';
import { seedComprehensiveDishes } from './seeds/menu-comprehensive.seed';
import { seedMenuTemplatesAndPackages } from './seeds/menu-templates.seed';
import { seedDocumentTemplates } from './seeds/document-templates.seed';

async function main() {
  console.log('\ud83d\udd12 PRODUCTION SEED — Safe mode');
  console.log('='.repeat(60));

  // ─── Validate required env vars ─────────────────────────────
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@gosciniecrodzinny.pl';

  if (!adminPassword) {
    console.error('\n\u274c SEED_ADMIN_PASSWORD is REQUIRED for production seed!');
    console.error('   Usage: SEED_ADMIN_PASSWORD="YourStr0ng!Pass" npx ts-node prisma/seed-production.ts');
    console.error('\n   Password requirements:');
    console.error('   - Minimum 12 characters');
    console.error('   - At least 1 uppercase letter');
    console.error('   - At least 1 lowercase letter');
    console.error('   - At least 1 number');
    console.error('   - At least 1 special character (!@#$%^&*)');
    process.exit(1);
  }

  // Validate password strength
  if (adminPassword.length < 12) {
    console.error('\n\u274c SEED_ADMIN_PASSWORD must be at least 12 characters!');
    process.exit(1);
  }

  const hasUpper = /[A-Z]/.test(adminPassword);
  const hasLower = /[a-z]/.test(adminPassword);
  const hasNumber = /[0-9]/.test(adminPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(adminPassword);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    console.error('\n\u274c SEED_ADMIN_PASSWORD is too weak!');
    console.error('   Must contain: uppercase, lowercase, number, and special character');
    process.exit(1);
  }

  try {
    // ─── Step 1: RBAC ─────────────────────────────────────────
    console.log('\n\ud83d\udd10 STEP 1: Seeding RBAC...');
    const rbacResult = await seedRBAC();
    console.log(`\u2705 RBAC: ${rbacResult.permissionsCount} permissions, ${rbacResult.rolesCount} roles`);

    // ─── Step 2: Dish categories ──────────────────────────────
    console.log('\n\ud83c\udff7\ufe0f  STEP 2: Seeding dish categories...');
    await seedDishCategories();

    // ─── Step 3: Dishes ───────────────────────────────────────
    console.log('\n\ud83c\udf7d\ufe0f STEP 3: Seeding dishes...');
    const dishCount = await seedComprehensiveDishes();
    console.log(`\u2705 Seeded ${dishCount} dishes`);

    // ─── Step 4: Menu templates & packages ────────────────────
    console.log('\n\ud83d\udcdd STEP 4: Seeding menu templates & packages...');
    await seedMenuTemplatesAndPackages();
    console.log('\u2705 Seeded templates and packages');

    // ─── Step 5: Admin user ───────────────────────────────────
    console.log('\n\ud83d\udc64 STEP 5: Creating admin user...');

    const adminRole = await prisma.role.findUnique({ where: { slug: 'admin' } });
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (existingAdmin) {
      // Update password for existing admin
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          roleId: adminRole?.id ?? existingAdmin.roleId,
          isActive: true,
        },
      });
      console.log(`\u2705 Admin user updated: ${adminEmail}`);
    } else {
      // Create new admin
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'G\u0142\u00f3wny',
          role: 'ADMIN',
          roleId: adminRole?.id ?? null,
          isActive: true,
        },
      });
      console.log(`\u2705 Admin user created: ${adminEmail}`);
    }

    // ─── Step 6: Document templates ───────────────────────────
    console.log('\n\ud83d\udcdd STEP 6: Seeding document templates...');
    const templateCount = await seedDocumentTemplates();
    console.log(`\u2705 Seeded ${templateCount} document templates`);

    // ─── Summary ──────────────────────────────────────────────
    console.log('\n' + '='.repeat(60));
    console.log('\ud83c\udf89 Production seed completed successfully!');
    console.log('='.repeat(60));

    const stats = {
      permissions: await prisma.permission.count(),
      roles: await prisma.role.count(),
      dishes: await prisma.dish.count(),
      users: await prisma.user.count(),
      documentTemplates: await prisma.documentTemplate.count(),
    };

    console.log(`\n\ud83d\udcca Production Stats:`);
    console.log(`   \ud83d\udd11 Permissions: ${stats.permissions}`);
    console.log(`   \ud83d\udee1\ufe0f  Roles: ${stats.roles}`);
    console.log(`   \ud83c\udf7d\ufe0f Dishes: ${stats.dishes}`);
    console.log(`   \ud83d\udc64 Users: ${stats.users}`);
    console.log(`   \ud83d\udcdd Templates: ${stats.documentTemplates}`);
    console.log('');
    console.log('\ud83d\udd12 No test data was created. System is production-ready.');

  } catch (error) {
    console.error('\u274c Production seed failed:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
