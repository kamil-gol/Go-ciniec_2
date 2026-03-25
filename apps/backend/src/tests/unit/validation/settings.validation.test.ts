/**
 * settings.validation — Unit Tests
 */

import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  createRoleSchema,
  updateRoleSchema,
  updateRolePermissionsSchema,
  updateCompanySettingsSchema,
  updateArchiveSettingsSchema,
} from '../../../validation/settings.validation';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('settings.validation', () => {
  // ─── Users ─────────────────────────────────────────────────────

  describe('createUserSchema', () => {
    const validData = {
      email: 'jan@example.com',
      password: 'TestPass123',
      firstName: 'Jan',
      lastName: 'Kowalski',
      roleId: validUUID,
    };

    it('should accept valid user', () => {
      const result = createUserSchema.parse(validData);
      expect(result.email).toBe('jan@example.com');
      expect(result.firstName).toBe('Jan');
    });

    it('should reject missing email', () => {
      const { email, ...rest } = validData;
      expect(() => createUserSchema.parse(rest)).toThrow();
    });

    it('should reject invalid email', () => {
      expect(() => createUserSchema.parse({ ...validData, email: 'not-email' })).toThrow();
    });

    it('should reject email > 255 chars', () => {
      expect(() => createUserSchema.parse({ ...validData, email: 'a'.repeat(250) + '@b.com' })).toThrow();
    });

    it('should reject missing password', () => {
      const { password, ...rest } = validData;
      expect(() => createUserSchema.parse(rest)).toThrow();
    });

    it('should reject password < 6 chars', () => {
      expect(() => createUserSchema.parse({ ...validData, password: '12345' })).toThrow();
    });

    it('should reject password > 128 chars', () => {
      expect(() => createUserSchema.parse({ ...validData, password: 'a'.repeat(129) })).toThrow();
    });

    it('should reject missing firstName', () => {
      const { firstName, ...rest } = validData;
      expect(() => createUserSchema.parse(rest)).toThrow();
    });

    it('should reject empty firstName', () => {
      expect(() => createUserSchema.parse({ ...validData, firstName: '' })).toThrow();
    });

    it('should reject firstName > 100 chars', () => {
      expect(() => createUserSchema.parse({ ...validData, firstName: 'A'.repeat(101) })).toThrow();
    });

    it('should reject missing lastName', () => {
      const { lastName, ...rest } = validData;
      expect(() => createUserSchema.parse(rest)).toThrow();
    });

    it('should reject empty lastName', () => {
      expect(() => createUserSchema.parse({ ...validData, lastName: '' })).toThrow();
    });

    it('should reject lastName > 100 chars', () => {
      expect(() => createUserSchema.parse({ ...validData, lastName: 'A'.repeat(101) })).toThrow();
    });

    it('should reject missing roleId', () => {
      const { roleId, ...rest } = validData;
      expect(() => createUserSchema.parse(rest)).toThrow();
    });

    it('should reject invalid roleId', () => {
      expect(() => createUserSchema.parse({ ...validData, roleId: 'bad' })).toThrow();
    });
  });

  describe('updateUserSchema', () => {
    it('should accept partial update', () => {
      const result = updateUserSchema.parse({ firstName: 'Anna' });
      expect(result.firstName).toBe('Anna');
    });

    it('should accept empty update', () => {
      const result = updateUserSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should reject invalid email', () => {
      expect(() => updateUserSchema.parse({ email: 'bad' })).toThrow();
    });

    it('should reject invalid roleId', () => {
      expect(() => updateUserSchema.parse({ roleId: 'bad' })).toThrow();
    });

    it('should reject empty firstName', () => {
      expect(() => updateUserSchema.parse({ firstName: '' })).toThrow();
    });
  });

  describe('changePasswordSchema', () => {
    it('should accept valid password', () => {
      const result = changePasswordSchema.parse({ newPassword: 'NewTestPass123' });
      expect(result.newPassword).toBe('NewTestPass123');
    });

    it('should reject missing newPassword', () => {
      expect(() => changePasswordSchema.parse({})).toThrow();
    });

    it('should reject password < 6 chars', () => {
      expect(() => changePasswordSchema.parse({ newPassword: '12345' })).toThrow();
    });

    it('should reject password > 128 chars', () => {
      expect(() => changePasswordSchema.parse({ newPassword: 'a'.repeat(129) })).toThrow();
    });
  });

  // ─── Roles ─────────────────────────────────────────────────────

  describe('createRoleSchema', () => {
    const validData = {
      name: 'Administrator',
      slug: 'admin',
      permissionIds: [validUUID],
    };

    it('should accept valid role', () => {
      const result = createRoleSchema.parse(validData);
      expect(result.name).toBe('Administrator');
      expect(result.slug).toBe('admin');
      expect(result.permissionIds).toHaveLength(1);
    });

    it('should reject missing name', () => {
      const { name, ...rest } = validData;
      expect(() => createRoleSchema.parse(rest)).toThrow();
    });

    it('should reject empty name', () => {
      expect(() => createRoleSchema.parse({ ...validData, name: '' })).toThrow();
    });

    it('should reject name > 100 chars', () => {
      expect(() => createRoleSchema.parse({ ...validData, name: 'A'.repeat(101) })).toThrow();
    });

    it('should reject missing slug', () => {
      const { slug, ...rest } = validData;
      expect(() => createRoleSchema.parse(rest)).toThrow();
    });

    it('should reject slug with uppercase', () => {
      expect(() => createRoleSchema.parse({ ...validData, slug: 'Admin' })).toThrow();
    });

    it('should reject slug with spaces', () => {
      expect(() => createRoleSchema.parse({ ...validData, slug: 'my role' })).toThrow();
    });

    it('should accept slug with hyphens and underscores', () => {
      const result = createRoleSchema.parse({ ...validData, slug: 'super-admin_v2' });
      expect(result.slug).toBe('super-admin_v2');
    });

    it('should reject slug > 100 chars', () => {
      expect(() => createRoleSchema.parse({ ...validData, slug: 'a'.repeat(101) })).toThrow();
    });

    it('should accept empty permissionIds array', () => {
      const result = createRoleSchema.parse({ ...validData, permissionIds: [] });
      expect(result.permissionIds).toHaveLength(0);
    });

    it('should reject invalid UUID in permissionIds', () => {
      expect(() => createRoleSchema.parse({ ...validData, permissionIds: ['bad'] })).toThrow();
    });

    it('should accept optional description', () => {
      const result = createRoleSchema.parse({ ...validData, description: 'Rola administracyjna' });
      expect(result.description).toBe('Rola administracyjna');
    });

    it('should reject description > 500 chars', () => {
      expect(() => createRoleSchema.parse({ ...validData, description: 'X'.repeat(501) })).toThrow();
    });

    it('should accept nullable description and color', () => {
      const result = createRoleSchema.parse({ ...validData, description: null, color: null });
      expect(result.description).toBeNull();
      expect(result.color).toBeNull();
    });
  });

  describe('updateRoleSchema', () => {
    it('should accept partial update', () => {
      const result = updateRoleSchema.parse({ name: 'Moderator' });
      expect(result.name).toBe('Moderator');
    });

    it('should accept empty update', () => {
      const result = updateRoleSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should reject invalid slug', () => {
      expect(() => updateRoleSchema.parse({ slug: 'BAD SLUG!' })).toThrow();
    });

    it('should accept nullable fields', () => {
      const result = updateRoleSchema.parse({ description: null, color: null });
      expect(result.description).toBeNull();
    });
  });

  describe('updateRolePermissionsSchema', () => {
    it('should accept valid permission IDs', () => {
      const result = updateRolePermissionsSchema.parse({ permissionIds: [validUUID] });
      expect(result.permissionIds).toHaveLength(1);
    });

    it('should accept empty array', () => {
      const result = updateRolePermissionsSchema.parse({ permissionIds: [] });
      expect(result.permissionIds).toHaveLength(0);
    });

    it('should reject missing permissionIds', () => {
      expect(() => updateRolePermissionsSchema.parse({})).toThrow();
    });

    it('should reject invalid UUID', () => {
      expect(() => updateRolePermissionsSchema.parse({ permissionIds: ['bad'] })).toThrow();
    });
  });

  // ─── Company Settings ──────────────────────────────────────────

  describe('updateCompanySettingsSchema', () => {
    it('should accept partial update', () => {
      const result = updateCompanySettingsSchema.parse({ companyName: 'Firma sp. z o.o.' });
      expect(result.companyName).toBe('Firma sp. z o.o.');
    });

    it('should accept empty update', () => {
      const result = updateCompanySettingsSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should reject invalid email', () => {
      expect(() => updateCompanySettingsSchema.parse({ email: 'bad' })).toThrow();
    });

    it('should reject invalid website URL', () => {
      expect(() => updateCompanySettingsSchema.parse({ website: 'not-a-url' })).toThrow();
    });

    it('should reject invalid logoUrl', () => {
      expect(() => updateCompanySettingsSchema.parse({ logoUrl: 'bad' })).toThrow();
    });

    it('should accept nullable fields', () => {
      const result = updateCompanySettingsSchema.parse({
        nip: null,
        regon: null,
        address: null,
        city: null,
        postalCode: null,
        phone: null,
        email: null,
        website: null,
        logoUrl: null,
        invoicePrefix: null,
        receiptPrefix: null,
      });
      expect(result.nip).toBeNull();
      expect(result.website).toBeNull();
    });

    it('should accept valid defaultCurrency (3 chars)', () => {
      const result = updateCompanySettingsSchema.parse({ defaultCurrency: 'PLN' });
      expect(result.defaultCurrency).toBe('PLN');
    });

    it('should reject defaultCurrency != 3 chars', () => {
      expect(() => updateCompanySettingsSchema.parse({ defaultCurrency: 'PL' })).toThrow();
      expect(() => updateCompanySettingsSchema.parse({ defaultCurrency: 'PLNX' })).toThrow();
    });

    it('should accept valid archiveAfterDays', () => {
      const result = updateCompanySettingsSchema.parse({ archiveAfterDays: 30 });
      expect(result.archiveAfterDays).toBe(30);
    });

    it('should reject archiveAfterDays < 1', () => {
      expect(() => updateCompanySettingsSchema.parse({ archiveAfterDays: 0 })).toThrow();
    });

    it('should reject archiveAfterDays > 365', () => {
      expect(() => updateCompanySettingsSchema.parse({ archiveAfterDays: 366 })).toThrow();
    });

    it('should reject companyName > 255 chars', () => {
      expect(() => updateCompanySettingsSchema.parse({ companyName: 'A'.repeat(256) })).toThrow();
    });

    it('should reject empty companyName', () => {
      expect(() => updateCompanySettingsSchema.parse({ companyName: '' })).toThrow();
    });
  });

  // ─── Archive Settings ──────────────────────────────────────────

  describe('updateArchiveSettingsSchema', () => {
    it('should accept valid archiveAfterDays', () => {
      const result = updateArchiveSettingsSchema.parse({ archiveAfterDays: 90 });
      expect(result.archiveAfterDays).toBe(90);
    });

    it('should reject missing archiveAfterDays', () => {
      expect(() => updateArchiveSettingsSchema.parse({})).toThrow();
    });

    it('should reject archiveAfterDays < 1', () => {
      expect(() => updateArchiveSettingsSchema.parse({ archiveAfterDays: 0 })).toThrow();
    });

    it('should reject archiveAfterDays > 365', () => {
      expect(() => updateArchiveSettingsSchema.parse({ archiveAfterDays: 366 })).toThrow();
    });

    it('should reject non-integer archiveAfterDays', () => {
      expect(() => updateArchiveSettingsSchema.parse({ archiveAfterDays: 30.5 })).toThrow();
    });

    it('should accept boundary values', () => {
      expect(() => updateArchiveSettingsSchema.parse({ archiveAfterDays: 1 })).not.toThrow();
      expect(() => updateArchiveSettingsSchema.parse({ archiveAfterDays: 365 })).not.toThrow();
    });
  });
});
