/**
 * CLI tool to change a user's password.
 *
 * Usage:
 *   npx ts-node apps/backend/prisma/change-password.ts \
 *     --email admin@gosciniecrodzinny.pl \
 *     --password 'YourNewStrongPassword!2026'
 *
 * Or via environment variable:
 *   NEW_PASSWORD='YourNewStrongPassword!2026' \
 *   npx ts-node apps/backend/prisma/change-password.ts \
 *     --email admin@gosciniecrodzinny.pl
 *
 * Password requirements:
 *   - Minimum 12 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one digit
 *   - At least one special character (!@#$%^&*)
 */

import { prisma } from './lib/prisma.js';
import * as bcrypt from 'bcryptjs';

interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

function parseArgs(): { email: string; password: string } {
  const args = process.argv.slice(2);
  let email = '';
  let password = process.env.NEW_PASSWORD || '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[i + 1];
      i++;
    }
  }

  if (!email) {
    console.error('\n❌ Missing required --email parameter');
    console.error('\nUsage:');
    console.error(
      "  npx ts-node apps/backend/prisma/change-password.ts --email user@example.com --password 'NewPassword123!'"
    );
    process.exit(1);
  }

  if (!password) {
    console.error('\n❌ Missing password. Provide via --password flag or NEW_PASSWORD env var');
    process.exit(1);
  }

  return { email, password };
}

async function main(): Promise<void> {
  const { email, password } = parseArgs();

  console.log(`\n🔐 Changing password for: ${email}`);

  // Validate password strength
  const validation = validatePassword(password);
  if (!validation.valid) {
    console.error('\n❌ Password does not meet requirements:');
    validation.errors.forEach((err) => console.error(`   • ${err}`));
    process.exit(1);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`\n❌ User with email "${email}" not found`);
    process.exit(1);
  }

  // Hash and update
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log('✅ Password changed successfully');
  console.log(`   User: ${user.email}`);
  console.log(`   Time: ${new Date().toISOString()}`);
}

main()
  .catch((error) => {
    console.error('\n❌ Failed to change password:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
