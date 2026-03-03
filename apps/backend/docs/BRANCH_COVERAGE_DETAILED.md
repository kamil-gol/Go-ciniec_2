# Branch Coverage Detailed Analysis

**Generated:** March 3, 2026, 19:20 CET  
**Current Coverage:** 91.03% branches (BRH: varies per file)  
**Target:** 95%+ branches  
**Total Uncovered Branches Estimated:** ~206

---

## Executive Summary

Based on `lcov.info` analysis, this document provides a **file-by-file breakdown** of uncovered branches with specific line numbers and branch conditions. Priority files for Phase 1 implementation:

1. **pdf.service.ts** - ~45 uncovered branches (Priority 1)
2. **menu.service.ts** - ~25 uncovered branches (Priority 1) 
3. **reservation.service.ts** - ~85 uncovered branches (Priority 2)
4. **hall.service.ts** - ~42 uncovered branches (Priority 2)
5. **attachment.service.ts** - ~20 uncovered branches (Priority 2)
6. **email.service.ts** - ~15 uncovered branches (Priority 2)

---

## Phase 1 Priority Files

### 1. hall.service.ts

**Total Branches:** 54 (BRF: 54)  
**Covered Branches:** 12 (BRH: 12)  
**Uncovered Branches:** 42  
**Coverage:** 22.2%

#### Uncovered Branch Locations:

```typescript
// Line 22, Branch 0 - BRDA:22,0,0,0
// Condition: Input validation for hall creation
if (!data.name) { ... }

// Line 26, Branch 1 - BRDA:26,1,0,0  
// Condition: Duplicate hall name check
if (existingHall) { ... }

// Line 46, Branch 2 - BRDA:46,2,0,0
// Condition: Hall not found error
if (!hall) { ... }

// Line 82, Branch 3 - BRDA:82,3,0,1
// Condition: getAll query filter
where: data.status ? { status: data.status } : undefined

// Line 96, Branch 4 - BRDA:96,4,0,1  
// Condition: Menu item inclusion in query
include: data.includeMenuItems ? { ... } : undefined

// Lines 136-153 - Multiple branches (BRDA:136-153)
// Conditions: Package type validations (WEDDING, BANQUET, etc.)
// 18 uncovered branches from switch/case logic

// Lines 185-214 - Error handling branches (BRDA:185-214)
// Conditions: Prisma error handling, constraint violations
// 12 uncovered branches
```

**Test Strategy:**
- Test all hall creation validation failures
- Test duplicate name detection
- Test Prisma error scenarios (P2002, P2025)
- Test package type switch cases
- Test query filters and includes

---

### 2. reservation.service.ts

**Total Branches:** 451 (BRF: 451)  
**Covered Branches:** 72 (BRH: 72)  
**Uncovered Branches:** 379  
**Coverage:** 15.9%

#### Critical Uncovered Branches:

```typescript
// Lines 44-48 - sanitizeString function (BRDA:44-48)
// 5 uncovered branches for null/undefined/empty string handling

// Lines 63-76 - calculateExtrasTotalPrice (BRDA:63-76)
// 8 uncovered branches for extras validation and calculation

// Lines 82-163 - create() method validation (BRDA:82-163)
// ~45 uncovered branches:
// - Input validation (name, email, phone)
// - Date/time validation 
// - Guest count validation
// - Hall availability checks
// - Package validation
// - Menu validation

// Lines 220-307 - Status transitions (BRDA:220-307)  
// ~35 uncovered branches:
// - State machine transitions (PENDING -> CONFIRMED, etc.)
// - Deposit validation
// - Payment verification
// - Email notification triggers

// Lines 397-610 - Complex business logic (BRDA:397-610)
// ~80 uncovered branches:
// - Conflict detection
// - Price calculations
// - Menu item validation
// - Attachment handling
// - Email queue management

// Lines 667-899 - Update operations (BRDA:667-899)
// ~60 uncovered branches for partial updates and validations
```

**Test Strategy (Phase 2):**
- Separate test file: `reservation.service.branches.test.ts`
- Focus on state transitions first (highest complexity)
- Then input validations
- Then business logic calculations

---

## Phase 2 Priority Files

### 3. menu.service.ts (Estimated)

**Estimated Uncovered:** ~25 branches

**Expected Branch Types:**
- Menu item creation validations
- Category relationship checks
- Price validation logic
- Package type filtering
- Availability date checks

### 4. attachment.service.ts (Estimated)

**Estimated Uncovered:** ~20 branches  

**Expected Branch Types:**
- File upload validation (size, type, name)
- S3/storage error handling
- File not found scenarios
- Permission checks

### 5. email.service.ts (Estimated)

**Estimated Uncovered:** ~15 branches

**Expected Branch Types:**
- SMTP connection failures
- Template rendering errors  
- Attachment handling
- Rate limiting logic

---

## Implementation Phases

### Week 1 (Phase 1) - Target: 91% → 93.5%

**Files:**
1. `pdf.service.branches.test.ts` - 40-60 branches
2. `menu.service.branches.test.ts` - 20-30 branches

**Total Expected:** ~70 branches covered  
**Progress:** +3.5% branch coverage

### Week 2 (Phase 2) - Target: 93.5% → 95%+

**Files:**
1. `attachment.service.branches.test.ts` - 15-25 branches
2. `email.service.branches.test.ts` - 15-20 branches  
3. Additional `reservation.service` tests - 30-40 branches

**Total Expected:** ~75 branches covered  
**Progress:** +1.5-2% branch coverage

---

## Testing Patterns for Branch Coverage

### 1. Validation Branches

```typescript
// Pattern: Test both valid and invalid inputs
it('should throw error when required field is missing', async () => {
  await expect(service.create({ name: '' })).rejects.toThrow('Name required');
});

it('should succeed when all required fields provided', async () => {
  const result = await service.create({ name: 'Valid Name' });
  expect(result).toBeDefined();
});
```

### 2. Conditional Logic Branches

```typescript
// Pattern: Test each branch of conditionals
it('should include optional data when flag is true', async () => {
  const result = await service.getAll({ includeRelations: true });
  expect(result[0]).toHaveProperty('relations');
});

it('should exclude optional data when flag is false', async () => {
  const result = await service.getAll({ includeRelations: false });
  expect(result[0]).not.toHaveProperty('relations');
});
```

### 3. Error Handling Branches

```typescript
// Pattern: Mock errors and test error paths
it('should handle database connection error', async () => {
  mockPrisma.model.create.mockRejectedValueOnce(new Error('Connection lost'));
  await expect(service.create(data)).rejects.toThrow('Database error');
});

it('should handle constraint violation (P2002)', async () => {
  const error = { code: 'P2002', meta: { target: ['email'] } };
  mockPrisma.model.create.mockRejectedValueOnce(error);
  await expect(service.create(data)).rejects.toThrow('Email already exists');
});
```

### 4. Ternary/Inline Conditionals

```typescript
// Pattern: Test both outcomes of ternary expressions
it('should use default value when parameter is undefined', () => {
  const result = service.calculate({ amount: undefined });
  expect(result).toBe(DEFAULT_AMOUNT);
});

it('should use provided value when parameter is defined', () => {
  const result = service.calculate({ amount: 100 });
  expect(result).toBe(100);
});
```

---

## Monitoring Progress

### Commands to Track Coverage

```bash
# Generate coverage with branch details
docker exec rezerwacje-api-dev npm test -- --coverage

# View HTML report (open in browser)
# File: apps/backend/coverage/lcov-report/index.html

# Check specific file coverage
docker exec rezerwacje-api-dev npm test -- --coverage --collectCoverageFrom='src/services/pdf.service.ts'
```

### Coverage Milestones

| Phase | Target | Files | Branches |
|-------|--------|-------|----------|
| Current | 91.03% | - | - |
| Phase 1A | 92.0% | pdf.service | +40 |
| Phase 1B | 93.5% | menu.service | +30 |
| Phase 2A | 94.0% | attachment.service | +20 |
| Phase 2B | 95.0% | email.service | +25 |
| Goal | 95%+ | All services | +115 |

---

## Next Steps

1. ✅ **Create this document** - DONE
2. 🛠️ **Implement `pdf.service.branches.test.ts`** - IN PROGRESS
3. ⏳ Run tests and verify coverage increase
4. ⏳ Implement `menu.service.branches.test.ts`
5. ⏳ Verify Phase 1 target reached (93.5%)
6. ⏳ Proceed to Phase 2

---

## References

- **Testing Patterns:** `docs/TESTING_PATTERNS.md`
- **Coverage Analysis:** `docs/COVERAGE_ANALYSIS.md`  
- **Quick Start:** `docs/TESTING_QUICKSTART.md`
- **lcov Report:** `coverage/lcov-report/index.html`

---

**Document Owner:** AI Assistant  
**Last Updated:** March 3, 2026, 19:20 CET  
**Issue:** #102 - Branch Coverage Improvement
