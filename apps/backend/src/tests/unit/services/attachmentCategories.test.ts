/**
 * AttachmentCategories Service — Unit Tests
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    attachmentCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number) {
      super(message);
      this.statusCode = statusCode || 500;
    }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
  }
  return { AppError: MockAppError };
});

import { AttachmentCategoriesService } from '../../../services/attachmentCategories.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;
const service = new AttachmentCategoriesService();

beforeEach(() => jest.clearAllMocks());

describe('AttachmentCategoriesService', () => {

  it('should return all categories', async () => {
    mockPrisma.attachmentCategory.findMany.mockResolvedValue([{ id: '1', name: 'Contracts' }]);
    const result = await service.getCategories();
    expect(result).toHaveLength(1);
  });

  it('should return category by id', async () => {
    mockPrisma.attachmentCategory.findUnique.mockResolvedValue({ id: '1', name: 'Invoices' });
    const result = await service.getCategoryById('1');
    expect(result.name).toBe('Invoices');
  });

  it('should create category', async () => {
    mockPrisma.attachmentCategory.create.mockResolvedValue({ id: '2', name: 'New', description: null });
    const result = await service.createCategory({ name: 'New' });
    expect(result.id).toBe('2');
  });

  it('should update category', async () => {
    mockPrisma.attachmentCategory.findUnique.mockResolvedValue({ id: '1', name: 'Old' });
    mockPrisma.attachmentCategory.update.mockResolvedValue({ id: '1', name: 'Updated' });
    const result = await service.updateCategory('1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('should delete category', async () => {
    mockPrisma.attachmentCategory.findUnique.mockResolvedValue({ id: '1' });
    mockPrisma.attachmentCategory.delete.mockResolvedValue(undefined);
    await service.deleteCategory('1');
    expect(mockPrisma.attachmentCategory.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should throw badRequest when name is empty', async () => {
    await expect(service.createCategory({ name: '' })).rejects.toThrow(/required/);
  });

  it('should throw notFound when category does not exist for update', async () => {
    mockPrisma.attachmentCategory.findUnique.mockResolvedValue(null);
    await expect(service.updateCategory('x', { name: 'A' })).rejects.toThrow(/not found/);
  });

  it('should throw notFound when category does not exist for delete', async () => {
    mockPrisma.attachmentCategory.findUnique.mockResolvedValue(null);
    await expect(service.deleteCategory('x')).rejects.toThrow(/not found/);
  });

  it('should filter active categories', async () => {
    mockPrisma.attachmentCategory.findMany.mockResolvedValue([{ id: '1', isActive: true }]);
    await service.getCategories({ isActive: true });
    expect(mockPrisma.attachmentCategory.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isActive: true }
    }));
  });

  it('should throw notFound when getCategoryById returns null (coverage line ~108)', async () => {
    mockPrisma.attachmentCategory.findUnique.mockResolvedValue(null);
    await expect(service.getCategoryById('nonexistent')).rejects.toThrow(/not found/);
  });
});
