# ⚡ Testing Quick Start Guide

> **For:** New developers joining the project  
> **Time to read:** 5 minutes  
> **Last updated:** March 3, 2026

---

## 🚀 Running Tests (30 seconds)

```bash
# 1. Navigate to backend
cd apps/backend

# 2. Run all tests
npm test

# 3. Expected output:
Test Suites: 130 passed, 130 total
Tests:       1903 passed, 1903 total
```

✅ **If you see this, you're good to go!**

---

## 📝 Writing Your First Test (5 minutes)

### Step 1: Create Test File

```bash
# Pattern: {name}.test.ts
touch src/tests/unit/services/myFeature.service.test.ts
```

### Step 2: Copy This Template

```typescript
/**
 * Tests for myFeature.service.ts
 */

import myFeatureService from '../../../services/myFeature.service';

// Mock the service
jest.mock('../../../services/myFeature.service', () => ({
  __esModule: true,  // ⚠️ Don't forget this!
  default: {
    create: jest.fn(),
    getById: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();  // Clean slate for each test
});

describe('MyFeatureService', () => {
  describe('create', () => {
    it('should create new feature', async () => {
      // 1. Arrange - Set up mock data
      const mockFeature = { id: 'f1', name: 'Test Feature' };
      (myFeatureService.create as jest.Mock).mockResolvedValue(mockFeature);

      // 2. Act - Call the method
      const result = await myFeatureService.create({ name: 'Test Feature' });

      // 3. Assert - Verify results
      expect(result).toEqual(mockFeature);
      expect(myFeatureService.create).toHaveBeenCalledWith({ name: 'Test Feature' });
    });
  });
});
```

### Step 3: Run Your Test

```bash
npm test -- myFeature.service.test.ts
```

✅ **Green output = Success!**

---

## 🔧 Common Scenarios

### Testing Default Export (Most Services)

```typescript
// Service file: deposit.service.ts
export default new DepositService();

// Test file
import depositService from '../../../services/deposit.service';

jest.mock('../../../services/deposit.service', () => ({
  __esModule: true,
  default: {  // <-- Use "default"
    create: jest.fn(),
  },
}));
```

### Testing Named Export

```typescript
// Service file: packageCategory.service.ts
export const packageCategoryService = new PackageCategoryService();

// Test file
import { packageCategoryService } from '../../../services/packageCategory.service';

jest.mock('../../../services/packageCategory.service', () => ({
  __esModule: true,
  packageCategoryService: {  // <-- Use export name
    getById: jest.fn(),
  },
}));
```

### Testing Error Cases

```typescript
it('should throw error when not found', async () => {
  (service.getById as jest.Mock)
    .mockRejectedValue(new Error('Not found'));

  await expect(service.getById('invalid'))
    .rejects
    .toThrow('Not found');
});
```

### Testing with Multiple Scenarios

```typescript
describe('applyDiscount', () => {
  it('should handle PERCENTAGE discount', async () => {
    const mock = { discountType: 'PERCENTAGE', amount: 100 };
    (service.applyDiscount as jest.Mock).mockResolvedValue(mock);
    
    const result = await service.applyDiscount('r1', { type: 'PERCENTAGE', value: 10 });
    
    expect(result.discountType).toBe('PERCENTAGE');
  });

  it('should handle FIXED discount', async () => {
    const mock = { discountType: 'FIXED', amount: 200 };
    (service.applyDiscount as jest.Mock).mockResolvedValue(mock);
    
    const result = await service.applyDiscount('r1', { type: 'FIXED', value: 200 });
    
    expect(result.discountType).toBe('FIXED');
  });
});
```

---

## 🚫 Common Mistakes (Avoid These!)

### ❌ Mistake 1: Missing `__esModule: true`

```typescript
// ❌ WRONG - Will fail!
jest.mock('path', () => ({
  default: { method: jest.fn() },
}));

// ✅ CORRECT
jest.mock('path', () => ({
  __esModule: true,  // <-- Add this!
  default: { method: jest.fn() },
}));
```

### ❌ Mistake 2: Trying to Instantiate Singletons

```typescript
// ❌ WRONG - Service is already instantiated!
import { DepositService } from 'service';
const service = new DepositService();

// ✅ CORRECT - Use the singleton
import depositService from 'service';
// Just mock it, don't instantiate!
```

### ❌ Mistake 3: Mocking `@prisma/client` Directly

```typescript
// ❌ WRONG - Causes coverage issues!
jest.mock('@prisma/client');

// ✅ CORRECT - Mock the prisma instance
jest.mock('../../../lib/prisma');
```

### ❌ Mistake 4: Forgetting to Clear Mocks

```typescript
// ❌ WRONG - Stale mocks between tests
describe('Service', () => {
  it('test 1', () => { /* ... */ });
  it('test 2', () => { /* May fail! */ });
});

// ✅ CORRECT
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## 📊 Checking Coverage

```bash
# Run tests with coverage report
npm test -- --coverage

# Generate HTML report (nicer to read)
npm test -- --coverage --coverageReporters=html

# Open in browser
open coverage/lcov-report/index.html
```

**What to look for:**
- 🟢 Green = Covered
- 🟡 Yellow = Partially covered (branches)
- 🔴 Red = Not covered

**Goal:** Keep everything green!

---

## 🔍 Debugging Failed Tests

### Problem: "Cannot find module"

```bash
# Solution: Check your import path
# Use relative paths: ../../../services/...
# NOT absolute: @/services/...
```

### Problem: "Mock not working"

```typescript
// Check 1: Is __esModule: true present?
jest.mock('path', () => ({
  __esModule: true,  // <-- This!
  default: { /* ... */ },
}));

// Check 2: Are you using the right export type?
// Default export: use "default"
// Named export: use the actual name
```

### Problem: "Test passes alone, fails in suite"

```typescript
// Solution: Add clearAllMocks
beforeEach(() => {
  jest.clearAllMocks();  // <-- This fixes it!
});
```

---

## 📚 Further Reading

- **[Testing Patterns Guide](./TESTING_PATTERNS.md)** - Comprehensive patterns and examples
- **[Coverage Analysis](./COVERAGE_ANALYSIS.md)** - Current status and improvement plan
- **[Issue #102](https://github.com/kamil-gol/Go-ciniec_2/issues/102)** - Testing roadmap

---

## 👥 Getting Help

1. **Check existing tests** - Look at similar service tests for examples
2. **Read the docs** - [TESTING_PATTERNS.md](./TESTING_PATTERNS.md) has all patterns
3. **Ask the team** - We're here to help!

---

## ✅ Checklist Before Committing

- [ ] All tests pass: `npm test`
- [ ] New code has tests
- [ ] Coverage didn't drop: `npm test -- --coverage`
- [ ] No `.skip()` or `.only()` in tests
- [ ] `beforeEach(() => jest.clearAllMocks())` is present

---

## 🎉 You're Ready!

Start writing tests and improving our coverage. Remember:

1. ✅ Copy the template
2. ✅ Add `__esModule: true`
3. ✅ Mock return values
4. ✅ Clear mocks between tests
5. ✅ Run tests before commit

**Happy testing!** 🚀
