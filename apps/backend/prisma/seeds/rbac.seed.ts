/**
 * 🔐 RBAC Seed Script
 *
 * Creates:
 * 1. All system permissions (47 entries across 12 modules)
 * 2. Four system roles (admin, manager, employee, viewer)
 * 3. Assigns permissions to each role
 * 4. Migrates existing users from legacy role string to new Role relation
 * 5. Creates default CompanySettings if none exist
 *
 * Can be run standalone:
 *   npx ts-node prisma/seeds/rbac.seed.ts
 *
 * Or called from seed.ts via seedRBAC().
 */

import { prisma } from '../lib/prisma.js';

// Use relative path since this runs via ts-node from prisma/ directory
const { PERMISSION_DEFINITIONS, ROLE_DEFINITIONS } = require('../../src/constants/permissions');

export async function seedRBAC() {
  console.log('\ud83d\udd10 Starting RBAC seed...');
  console.log('\u2550'.repeat(60));

  // ─── Step 1: Create Permissions ────────────────────────────
  console.log('\n\ud83d\udccb Creating permissions...');

  const permissionMap = new Map<string, string>(); // slug → id

  for (const [slug, module, action, name, description] of PERMISSION_DEFINITIONS) {
    const permission = await prisma.permission.upsert({
      where: { slug },
      update: { name, description, module, action },
      create: { module, action, slug, name, description },
    });
    permissionMap.set(slug, permission.id);
  }

  console.log(`  \u2705 Utworzono/zaktualizowano ${permissionMap.size} uprawnie\u0144`);

  // List modules
  const modules = [...new Set(PERMISSION_DEFINITIONS.map((p: any) => p[1]))];
  console.log(`  \ud83d\udcda Modu\u0142y: ${modules.join(', ')}`);

  // ─── Step 2: Create Roles ────────────────────────────────
  console.log('\n\ud83d\udc65 Creating roles...');

  const roleMap = new Map<string, string>(); // slug → id
  const allPermissionSlugs = Array.from(permissionMap.keys());

  for (const [key, roleDef] of Object.entries(ROLE_DEFINITIONS) as any[]) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        color: roleDef.color,
        isSystem: roleDef.isSystem,
      },
      create: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        color: roleDef.color,
        isSystem: roleDef.isSystem,
      },
    });

    roleMap.set(roleDef.slug, role.id);

    // Resolve permission slugs
    const permSlugs: string[] =
      roleDef.permissions === 'ALL' ? allPermissionSlugs : roleDef.permissions;

    // Remove existing role→permission links (idempotent re-run)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    // Create role→permission links
    const rolePermissions = permSlugs
      .map((slug: string) => {
        const permId = permissionMap.get(slug);
        if (!permId) {
          console.warn(`  \u26a0\ufe0f  Uprawnienie ${slug} nie znalezione \u2014 pomini\u0119to`);
          return null;
        }
        return { roleId: role.id, permissionId: permId };
      })
      .filter(Boolean) as Array<{ roleId: string; permissionId: string }>;

    await prisma.rolePermission.createMany({ data: rolePermissions });

    console.log(
      `  \u2705 ${roleDef.name} (${roleDef.slug}) \u2014 ` +
      `${rolePermissions.length} uprawnie\u0144, kolor: ${roleDef.color}`
    );
  }

  // ─── Step 3: Migrate existing users ──────────────────────
  console.log('\n\ud83d\udd04 Migrating existing users to RBAC roles...');

  const legacyToSlug: Record<string, string> = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    CLIENT: 'viewer',
  };

  const usersWithoutRole = await prisma.user.findMany({
    where: { roleId: null },
  });

  let migratedCount = 0;

  for (const user of usersWithoutRole) {
    const legacyRole = (user as any).legacyRole || 'EMPLOYEE';
    const targetSlug = legacyToSlug[legacyRole] || 'employee';
    const targetRoleId = roleMap.get(targetSlug);

    if (targetRoleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: targetRoleId },
      });
      console.log(`  \u2705 ${user.email}: ${legacyRole} \u2192 ${targetSlug}`);
      migratedCount++;
    } else {
      console.warn(`  \u26a0\ufe0f  Brak roli ${targetSlug} dla ${user.email}`);
    }
  }

  if (migratedCount === 0 && usersWithoutRole.length === 0) {
    console.log('  \u2139\ufe0f  Wszyscy u\u017cytkownicy maj\u0105 ju\u017c przypisane role');
  } else {
    console.log(`  \ud83d\udcca Zmigrowano: ${migratedCount} u\u017cytkownik\u00f3w`);
  }

  // ─── Step 4: Create default CompanySettings ────────────────
  console.log('\n\ud83c\udfe2 Creating default company settings...');

  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'Go\u015bciniec Rodzinny',
        email: 'kontakt@gosciniecrodzinny.pl',
        phone: '+48 123 456 789',
        timezone: 'Europe/Warsaw',
        defaultCurrency: 'PLN',
      },
    });
    console.log('  \u2705 Utworzono domy\u015blne ustawienia firmy');
  } else {
    console.log('  \u2139\ufe0f  Ustawienia firmy ju\u017c istniej\u0105 \u2014 pomini\u0119to');
  }

  // ─── Summary ───────────────────────────────────────────
  console.log('\n' + '\u2550'.repeat(60));
  console.log('\ud83c\udf89 RBAC seed zako\u0144czony pomy\u015blnie!');
  console.log(`   Uprawnienia: ${permissionMap.size}`);
  console.log(`   Role: ${roleMap.size}`);
  console.log(`   Zmigrowanych u\u017cytkownik\u00f3w: ${migratedCount}`);
  console.log('\u2550'.repeat(60));

  return {
    permissionsCount: permissionMap.size,
    rolesCount: roleMap.size,
    migratedUsersCount: migratedCount,
  };
}

// Allow standalone execution
if (require.main === module) {
  seedRBAC()
    .catch((e) => {
      console.error('\u274c RBAC seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
