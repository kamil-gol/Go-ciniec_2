/**
 * 🔐 RBAC Seed Script
 * 
 * Creates:
 * 1. All system permissions (55 entries)
 * 2. Four system roles (admin, manager, employee, viewer)
 * 3. Assigns permissions to roles
 * 4. Migrates existing users from legacy role string to new Role relation
 * 
 * Run: npx ts-node prisma/seeds/rbac.seed.ts
 * Or via: docker compose exec backend npx ts-node prisma/seeds/rbac.seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { PERMISSION_DEFINITIONS, ROLE_DEFINITIONS } from '../../src/constants/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Starting RBAC seed...');
  console.log('═'.repeat(60));

  // ─── Step 1: Create Permissions ──────────────────────────
  console.log('\n📋 Creating permissions...');

  const permissionMap = new Map<string, string>(); // slug → id

  for (const [slug, module, action, name, description] of PERMISSION_DEFINITIONS) {
    const permission = await prisma.permission.upsert({
      where: { slug },
      update: { name, description },
      create: { module, action, slug, name, description },
    });
    permissionMap.set(slug, permission.id);
    console.log(`  ✅ ${slug} — ${name}`);
  }

  console.log(`\n  📊 Łącznie: ${permissionMap.size} uprawnień`);

  // ─── Step 2: Create Roles ────────────────────────────────
  console.log('\n👥 Creating roles...');

  const roleMap = new Map<string, string>(); // slug → id
  const allPermissionSlugs = Array.from(permissionMap.keys());

  for (const [key, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
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
    console.log(`  ✅ ${roleDef.name} (${roleDef.slug}) — color: ${roleDef.color}`);

    // Assign permissions
    const permSlugs = roleDef.permissions === 'ALL'
      ? allPermissionSlugs
      : roleDef.permissions;

    // Remove existing role permissions first (for idempotent re-runs)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    // Create role-permission links
    const rolePermissions = permSlugs
      .map((slug: string) => {
        const permId = permissionMap.get(slug);
        if (!permId) {
          console.warn(`  ⚠️  Uprawnienie ${slug} nie znalezione — pominięto`);
          return null;
        }
        return { roleId: role.id, permissionId: permId };
      })
      .filter(Boolean) as Array<{ roleId: string; permissionId: string }>;

    await prisma.rolePermission.createMany({ data: rolePermissions });
    console.log(`     → Przypisano ${rolePermissions.length} uprawnień`);
  }

  // ─── Step 3: Migrate existing users ──────────────────────
  console.log('\n🔄 Migrating existing users to new RBAC...');

  // Map legacy role strings to new role slugs
  const legacyToSlug: Record<string, string> = {
    'ADMIN': 'admin',
    'EMPLOYEE': 'employee',
    'CLIENT': 'viewer',  // clients get read-only access
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
      console.log(`  ✅ ${user.email}: ${legacyRole} → ${targetSlug}`);
      migratedCount++;
    } else {
      console.warn(`  ⚠️  Nie znaleziono roli ${targetSlug} dla ${user.email}`);
    }
  }

  console.log(`\n  📊 Zmigrowano: ${migratedCount} użytkowników`);

  // ─── Step 4: Create default CompanySettings ──────────────
  console.log('\n🏢 Creating default company settings...');

  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'Gościniec Rodzinny',
        email: 'kontakt@gosciniecrodzinny.pl',
        timezone: 'Europe/Warsaw',
        defaultCurrency: 'PLN',
      },
    });
    console.log('  ✅ Utworzono domyślne ustawienia firmy');
  } else {
    console.log('  ℹ️  Ustawienia firmy już istnieją — pominięto');
  }

  // ─── Summary ─────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 RBAC seed zakończony pomyślnie!');
  console.log(`   Uprawnienia: ${permissionMap.size}`);
  console.log(`   Role: ${roleMap.size}`);
  console.log(`   Zmigrowanych użytkowników: ${migratedCount}`);
  console.log('═'.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ RBAC seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
