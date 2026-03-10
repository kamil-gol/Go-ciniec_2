# 🧪 Testing Patterns Guide

> **Last Updated:** March 3, 2026  
> **Coverage:** 96.45% statements, 91.03% branches, 96.97% functions, 97.06% lines  
> **Test Count:** 1903 passing tests across 130 suites

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Running Tests](#running-tests)
3. [Singleton Service Mocking](#singleton-service-mocking)
4. [Controller Testing](#controller-testing)
5. [Prisma Mocking](#prisma-mocking)
6. [Common Patterns](#common-patterns)
7. [Anti-Patterns](#anti-patterns)
8. [Coverage Strategy](#coverage-strategy)

---

## Overview

### Test Structure

```
apps/backend/src/tests/
├── unit/
│   ├── services/           # Service layer tests
│   │   ├── *.test.ts      # Main functionality
│   │   └── *.branches.test.ts  # Branch coverage (conditional paths)
│   └── controllers/       # Controller layer tests
├── integration/           # Database integration tests
└── helpers/              # Test utilities
```

### Test Types

- **Unit Tests** - Isolated component testing with mocked dependencies
- **Integration Tests** - Real database interactions
- **Branch Tests** - Focused on conditional logic coverage
- **E2E Tests** - Full user flows (Playwright)

---

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# With coverage
npm test -- --coverage

# HTML coverage report
npm test -- --coverage --coverageReporters=html
# Open: apps/backend/coverage/lcov-report/index.html

# Watch mode
npm test -- --watch

# Single file
npm test -- deposit.service.test.ts
```

---

## Singleton Service Mocking

### ✅ Default Export Singleton

**Service File:** `apps/backend/src/services/deposit.service.ts`
```typescript
class DepositService {
  async create(data: any) { /* ... */ }
  async getById(id: string) { /* ... */ }
}

export default new DepositService(); // Singleton!
```

**Test File:** `apps/backend/src/tests/unit/services/deposit.service.test.ts`
```typescript
import depositService from '../../../services/deposit.service';

jest.mock('../../../services/deposit.service', () => ({
  __esModule: true,  // ⚠️ CRITICAL - Required for ES modules!
  default: {
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DepositService', () => {
  describe('create', () => {
    it('should create deposit', async () => {
      const mockDeposit = { id: 'd1', amount: 500 };
      
      (depositService.create as jest.Mock).mockResolvedValue(mockDeposit);

      const result = await depositService.create({ amount: 500 }, 'u1');

      expect(result).toEqual(mockDeposit);
      expect(depositService.create).toHaveBeenCalledWith(
        { amount: 500 },
        'u1'
      );
    });
  });
});
```

### ✅ Named Export Singleton

**Service File:** `apps/backend/src/services/packageCategory.service.ts`
```typescript
class PackageCategoryService {
  async getByPackageId(packageId: string) { /* ... */ }
}

export const packageCategoryService = new PackageCategoryService(); // Named export!
```

**Test File:**
```typescript
import { packageCategoryService } from '../../../services/packageCategory.service';

jest.mock('../../../services/packageCategory.service', () => ({
  __esModule: true,  // ⚠️ CRITICAL
  packageCategoryService: {  // Named export, not "default"
    getByPackageId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe('PackageCategoryService', () => {
  it('should get settings by package ID', async () => {
    const mockSettings = [{ id: 's1', minSelect: 1 }];
    
    (packageCategoryService.getByPackageId as jest.Mock)
      .mockResolvedValue(mockSettings);

    const result = await packageCategoryService.getByPackageId('p1');

    expect(result).toEqual(mockSettings);
  });
});
```

---

## Controller Testing

### Pattern: Service Integration Tests

Controllers are thin wrappers around services. Test the **service layer integration**, not HTTP details.

**Controller File:** `apps/backend/src/controllers/auth.controller.ts`
```typescript
import authService from '../services/auth.service';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result });
  }),
};
```

**Test File:** `apps/backend/src/tests/unit/controllers/auth.controller.test.ts`
```typescript
import authService from '../../../services/auth.service';

jest.mock('../../../services/auth.service', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
  },
}));

describe('AuthController', () => {
  describe('service integration', () => {
    it('should call register service method', async () => {
      const mockResult = {
        user: { id: 'u1', email: 'test@example.com' },
        token: 'jwt-token',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual(mockResult);
      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });
    });
  });
});
```

---

## Prisma Mocking

### Pattern: Mock Prisma Client

```typescript
import { prisma } from '../../../lib/prisma';

jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  prisma: {
    reservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deposit: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('ReservationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find reservation by ID', async () => {
    const mockReservation = { id: 'r1', clientId: 'c1' };
    
    (prisma.reservation.findUnique as jest.Mock)
      .mockResolvedValue(mockReservation);

    const result = await prisma.reservation.findUnique({ where: { id: 'r1' } });

    expect(result).toEqual(mockReservation);
  });
});
```

### ⚠️ NEVER Mock `@prisma/client`

```typescript
// ❌ WRONG - Causes coverage regression!
jest.mock('@prisma/client');

// ✅ CORRECT - Mock the prisma instance
jest.mock('../../../lib/prisma');
```

---

## Common Patterns

### 1. Testing Error Scenarios

```typescript
it('should throw error when deposit not found', async () => {
  (depositService.getById as jest.Mock)
    .mockRejectedValue(new Error('Deposit not found'));

  await expect(depositService.getById('invalid-id'))
    .rejects
    .toThrow('Deposit not found');
});
```

### 2. Testing Conditional Logic (Branches)

```typescript
describe('applyDiscount', () => {
  it('should apply PERCENTAGE discount', async () => {
    const mockResult = { discountType: 'PERCENTAGE', discountAmount: 100 };
    (discountService.applyDiscount as jest.Mock).mockResolvedValue(mockResult);

    const result = await discountService.applyDiscount(
      'r1',
      { type: 'PERCENTAGE', value: 10, reason: 'Early booking' },
      'u1'
    );

    expect(result.discountType).toBe('PERCENTAGE');
  });

  it('should apply FIXED discount', async () => {
    const mockResult = { discountType: 'FIXED', discountAmount: 200 };
    (discountService.applyDiscount as jest.Mock).mockResolvedValue(mockResult);

    const result = await discountService.applyDiscount(
      'r1',
      { type: 'FIXED', value: 200, reason: 'Loyalty' },
      'u1'
    );

    expect(result.discountType).toBe('FIXED');
  });
});
```

### 3. Testing Null/Undefined Handling

```typescript
it('should handle null client gracefully', async () => {
  (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

  const result = await clientService.getById('invalid-id');

  expect(result).toBeNull();
});
```

### 4. Testing Array Operations

```typescript
it('should return empty array when no results', async () => {
  (prisma.deposit.findMany as jest.Mock).mockResolvedValue([]);

  const result = await depositService.list({ status: 'PAID' });

  expect(result).toEqual([]);
  expect(result).toHaveLength(0);
});
```

---

## Anti-Patterns

### ❌ DON'T: Try to instantiate singletons

```typescript
// ❌ WRONG - Service is already instantiated!
import { DepositService } from '../../../services/deposit.service';
const service = new DepositService();
```

### ❌ DON'T: Forget `__esModule: true`

```typescript
// ❌ WRONG - Missing __esModule flag
jest.mock('../../../services/deposit.service', () => ({
  default: { create: jest.fn() },
}));

// ✅ CORRECT
jest.mock('../../../services/deposit.service', () => ({
  __esModule: true,  // Required!
  default: { create: jest.fn() },
}));
```

### ❌ DON'T: Mock `@prisma/client` directly

```typescript
// ❌ WRONG - Causes coverage issues
jest.mock('@prisma/client');

// ✅ CORRECT - Mock the prisma instance
jest.mock('../../../lib/prisma');
```

### ❌ DON'T: Skip `clearAllMocks()`

```typescript
// ❌ WRONG - Mocks persist between tests
describe('Service', () => {
  it('test 1', () => { /* ... */ });
  it('test 2', () => { /* ... */ }); // May have stale mocks!
});

// ✅ CORRECT
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## Coverage Strategy

### Current Targets (Issue #102)

| Metric | Target | Minimum | Current |
|--------|--------|---------|----------|
| **Statements** | >80% | 70% | ✅ 96.45% |
| **Branches** | >95% | 91% | 🟡 91.03% |
| **Functions** | >95% | 90% | ✅ 96.97% |
| **Lines** | >95% | 90% | ✅ 97.06% |

### Focus Areas for Branch Coverage

1. **Conditional paths** - Test both `if` and `else` branches
2. **Error handling** - Test `try` and `catch` blocks
3. **Optional chaining** - Test when values are null/undefined
4. **Ternary expressions** - Test both true and false cases
5. **Switch statements** - Test all cases including `default`

### Example: Branch Coverage Test

```typescript
// Source code with branches
async applyDiscount(type: 'PERCENTAGE' | 'FIXED', value: number) {
  if (type === 'PERCENTAGE') {  // Branch 1
    return value / 100;
  } else {  // Branch 2
    return value;
  }
}

// Test covering both branches
describe('applyDiscount branches', () => {
  it('should handle PERCENTAGE type', () => {  // Covers branch 1
    expect(service.applyDiscount('PERCENTAGE', 10)).toBe(0.1);
  });

  it('should handle FIXED type', () => {  // Covers branch 2
    expect(service.applyDiscount('FIXED', 100)).toBe(100);
  });
});
```

---

## File Naming Conventions

- **Main tests:** `{name}.test.ts` - Core functionality
- **Branch tests:** `{name}.branches.test.ts` - Conditional logic
- **Integration tests:** `{name}.integration.test.ts` - Real DB
- **Controller tests:** `{name}.controller.test.ts` - HTTP layer

---

## Quick Reference

```typescript
// ✅ Default export singleton mock
jest.mock('path/to/service', () => ({
  __esModule: true,
  default: { method: jest.fn() },
}));

// ✅ Named export singleton mock
jest.mock('path/to/service', () => ({
  __esModule: true,
  serviceName: { method: jest.fn() },
}));

// ✅ Prisma mock
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  prisma: { model: { findUnique: jest.fn() } },
}));

// ✅ Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// ✅ Mock resolved value
(service.method as jest.Mock).mockResolvedValue(data);

// ✅ Mock rejected value
(service.method as jest.Mock).mockRejectedValue(error);
```

---

## Related Issues

- [#102](https://github.com/kamil-gol/Go-ciniec_2/issues/102) - Faza 4: Coverage targets
- [#104](https://github.com/kamil-gol/Go-ciniec_2/issues/104) - Branch coverage for 8 services (CLOSED)
- [#93](https://github.com/kamil-gol/Go-ciniec_2/issues/93) - Testing environment setup (CLOSED)

---

## Questions?

Refer to existing test files for examples:
- `apps/backend/src/tests/unit/services/deposit.service.test.ts`
- `apps/backend/src/tests/unit/controllers/auth.controller.test.ts`
- `apps/backend/src/tests/unit/services/queue.service.branches.test.ts`
