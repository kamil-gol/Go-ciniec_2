# 📊 Coverage Analysis & Improvement Roadmap

> **Generated:** March 3, 2026  
> **Test Run:** 1903/1904 tests passing (99.9%)  
> **Overall Coverage:** 96.45% statements, 91.03% branches, 96.97% functions, 97.06% lines

---

## 🎯 Current State

### Overall Metrics

```
✅ Statements: 96.45% (4626/4796) - TARGET EXCEEDED
🟡 Branches:   91.03% (2091/2297) - 4% below target (206 uncovered)
✅ Functions:  96.97% (610/629)  - TARGET EXCEEDED
✅ Lines:      97.06% (4237/4365) - TARGET EXCEEDED
```

### Test Suite Status

```
Test Suites: 1 skipped, 130 passed, 130 of 131 total
Tests:       1 skipped, 1903 passed, 1904 total
```

**Skipped:** `attachmentCategories.test.ts` (service doesn't exist - feature in attachment.service.ts)

---

## 🔴 Critical Focus: Branches (91.03% → 95%+)

### Estimated Uncovered Branches by Service

Based on Issue #104 analysis and file sizes:

| Service | Size | Est. Uncovered Branches | Priority |
|---------|------|------------------------|----------|
| `pdf.service.ts` | 72 KB | 40-60 | 🔴 **CRITICAL** |
| `menu.service.ts` | 19 KB | 20-30 | 🔴 **CRITICAL** |
| `attachment.service.ts` | 21 KB | 15-25 | 🟠 **HIGH** |
| `email.service.ts` | 25 KB | 15-20 | 🟠 **HIGH** |
| `reports-export.service.ts` | 14 KB | 10-20 | 🟡 **MEDIUM** |
| `menuSnapshot.service.ts` | 12 KB | 5-15 | 🟡 **MEDIUM** |
| `users.service.ts` | 9 KB | 5-10 | 🟢 **LOW** |
| `stats.service.ts` | 6 KB | 3-8 | 🟢 **LOW** |
| **TOTAL** | | **~206** | |

---

## 👉 Action Plan: Reach 95% Branch Coverage

### Phase 1: Large Services (Week 1)

#### 1.1 `pdf.service.ts` (40-60 branches)

**Location:** `apps/backend/src/services/pdf.service.ts`  
**Test File:** `apps/backend/src/tests/unit/services/pdf.service.branches.test.ts`

**Focus Areas:**
- [ ] Conditional PDF template selection
- [ ] Error handling in PDF generation
- [ ] Optional field rendering (`?.` chains)
- [ ] Different reservation types (wedding, communion, etc.)
- [ ] Image loading fallbacks
- [ ] Font loading error paths
- [ ] Empty/null data handling

**Example Uncovered Branches:**
```typescript
// Likely uncovered:
if (reservation.menu?.packages?.length) {  // Test both truthy and falsy
  // ... render menu
} else {
  // ... empty state
}

// Test both error types:
try {
  await generatePDF();
} catch (error) {
  if (error instanceof PDFError) {  // Branch 1
    // ...
  } else {  // Branch 2
    // ...
  }
}
```

#### 1.2 `menu.service.ts` (20-30 branches)

**Location:** `apps/backend/src/services/menu.service.ts`  
**Test File:** `apps/backend/src/tests/unit/services/menu.service.branches.test.ts`

**Focus Areas:**
- [ ] Menu validation logic
- [ ] Package availability checks
- [ ] Price calculation branches
- [ ] Date range filtering
- [ ] Active/inactive menu selection
- [ ] Null handling for optional menu fields

### Phase 2: Medium Services (Week 2)

#### 2.1 `attachment.service.ts` (15-25 branches)

**Location:** `apps/backend/src/services/attachment.service.ts`  
**Test File:** `apps/backend/src/tests/unit/services/attachment.service.branches.test.ts`

**Focus Areas:**
- [ ] File type validation branches
- [ ] RODO redirect logic (CLIENT vs RESERVATION)
- [ ] Storage backend selection (MinIO vs local)
- [ ] Deduplication logic (SHA-256 checks)
- [ ] Image compression branches
- [ ] Error handling (file not found, storage errors)
- [ ] Presigned URL generation vs fallback

**Example:**
```typescript
// RODO redirect branch
if (dto.category === 'RODO' && dto.entityType !== 'CLIENT') {
  const clientId = await this.resolveClientId(dto.entityType, dto.entityId);
  if (!clientId) {  // Branch: clientId null check
    throw AppError.badRequest('Cannot find client');
  }
  // ... redirect to CLIENT
}
```

#### 2.2 `email.service.ts` (15-20 branches)

**Location:** `apps/backend/src/services/email.service.ts`  
**Test File:** `apps/backend/src/tests/unit/services/email.service.branches.test.ts`

**Focus Areas:**
- [ ] Different email templates (confirmation, reminder, etc.)
- [ ] SMTP vs test mode branches
- [ ] Email queue vs immediate send
- [ ] Attachment handling
- [ ] Error retry logic
- [ ] Template variable substitution fallbacks

### Phase 3: Smaller Services (Week 3)

#### 3.1 `reports-export.service.ts` (10-20 branches)
#### 3.2 `menuSnapshot.service.ts` (5-15 branches)
#### 3.3 `users.service.ts` (5-10 branches)
#### 3.4 `stats.service.ts` (3-8 branches)

---

## 📝 Branch Coverage Testing Checklist

For each service, ensure tests cover:

### ✅ Conditional Statements
- [ ] Both sides of `if/else`
- [ ] All `switch` cases including `default`
- [ ] Ternary operator both outcomes: `condition ? true : false`
- [ ] Logical operators: `a && b` (test when `a` is false, when `b` is false)
- [ ] Logical operators: `a || b` (test when `a` is true, when `a` is false)

### ✅ Error Handling
- [ ] `try` block success path
- [ ] `catch` block with different error types
- [ ] Error re-throw vs wrap logic
- [ ] Prisma errors (P2002, P2025, etc.)
- [ ] Custom AppError branches

### ✅ Null/Undefined Handling
- [ ] Optional chaining `?.` both paths
- [ ] Nullish coalescing `??` both paths
- [ ] `if (x)` and `if (!x)` branches
- [ ] `x || defaultValue` when x is falsy

### ✅ Array/Object Operations
- [ ] Empty array `[]` handling
- [ ] Array with items handling
- [ ] `array.length > 0` both branches
- [ ] `Object.keys(obj).length` both branches

### ✅ Guard Clauses
- [ ] Early returns
- [ ] Validation failures
- [ ] Permission checks (authorized vs unauthorized)

---

## 📊 Expected Impact

### After Phase 1 (pdf + menu)
```
Branches: 91.03% → 93.5% (+2.5%)
Uncovered: 206 → ~150
```

### After Phase 2 (attachment + email)
```
Branches: 93.5% → 95.0% (+1.5%)
Uncovered: ~150 → ~115
```

### After Phase 3 (4 smaller services)
```
Branches: 95.0% → 95.5%+ (+0.5%)
Uncovered: ~115 → <100
```

---

## 🛠️ Tools & Commands

### Generate HTML Coverage Report
```bash
docker exec rezerwacje-api-dev npm test -- --coverage --coverageReporters=html
```

**Open Report:**
```bash
open apps/backend/coverage/lcov-report/index.html
```

### Identify Uncovered Lines
```bash
# Look for red/yellow highlighting in HTML report
# Navigate to: coverage/lcov-report/services/{service-name}.ts.html
```

### Run Specific Service Tests
```bash
# Test only pdf.service
npm test -- pdf.service

# Test with coverage
npm test -- pdf.service --coverage
```

---

## 📚 Testing Patterns for Branches

### Pattern 1: Test Both Sides of Conditionals

```typescript
// Source code
if (discountType === 'PERCENTAGE') {
  return price * (value / 100);
} else {
  return value;
}

// Tests
it('should calculate PERCENTAGE discount', () => { /* ... */ });
it('should apply FIXED discount', () => { /* ... */ });
```

### Pattern 2: Test Error Branches

```typescript
// Source code
try {
  await sendEmail();
} catch (error) {
  if (error instanceof SMTPError) {
    logger.error('SMTP failed');
  } else {
    logger.error('Unknown error');
  }
}

// Tests
it('should handle SMTP errors', async () => {
  mockSendEmail.mockRejectedValue(new SMTPError());
  // ... assert error handling
});

it('should handle unknown errors', async () => {
  mockSendEmail.mockRejectedValue(new Error('Unknown'));
  // ... assert error handling
});
```

### Pattern 3: Test Null/Undefined Paths

```typescript
// Source code
const clientName = client?.firstName || 'Guest';

// Tests
it('should use client name when available', () => {
  const result = format({ firstName: 'John' });
  expect(result).toContain('John');
});

it('should use Guest when client is null', () => {
  const result = format(null);
  expect(result).toContain('Guest');
});
```

---

## 🔗 Related Documentation

- [Testing Patterns Guide](./TESTING_PATTERNS.md) - Comprehensive testing patterns
- [Issue #102](https://github.com/kamil-gol/Go-ciniec_2/issues/102) - Faza 4: Coverage targets
- [Issue #104](https://github.com/kamil-gol/Go-ciniec_2/issues/104) - Branch coverage task (CLOSED)

---

## 🎯 Success Criteria

- [ ] Branch coverage ≥ 95%
- [ ] All critical services have `.branches.test.ts` files
- [ ] 0 flaky tests (10 consecutive runs)
- [ ] HTML coverage report generated and reviewed
- [ ] All team members trained on branch testing patterns

---

**Next Review:** After Phase 1 completion (pdf + menu services)
