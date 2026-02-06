# 🐛 Contributing Guide - Rezerwacje Sal

Dziękujemy za zainteresowanie wkładem w projekt! Ten dokument zawiera wytyczne dla developerów.

---

## 🔐 Getting Started

### 1. Fork & Clone

```bash
# Fork na GitHubie
# Clone
git clone https://github.com/YOUR_USERNAME/rezerwacje.git
cd rezerwacje

# Add upstream
git remote add upstream https://github.com/kamil-gol/rezerwacje.git
```

### 2. Setup Development Environment

```bash
# Copy environment
cp .env.example .env.local

# Install dependencies (optional, Docker handles it)
npm install --workspaces

# Or use Docker
docker-compose up -d

# Verify setup
docker-compose exec backend npm run prisma:studio
```

---

## 🗓️ Development Workflow

### 1. Create Feature Branch

```bash
# Sync with upstream
git fetch upstream
git rebase upstream/main

# Create feature branch
git checkout -b feature/FEATURE_NAME
# or
git checkout -b fix/BUG_NAME
```

### 2. Make Changes

```bash
# Write code
vim apps/backend/src/controllers/example.ts

# Format code
npm run format

# Lint
npm run lint

# Run tests
npm run test

# Test coverage
npm run test:coverage
```

### 3. Commit with Conventional Commits

```bash
# Format: <type>(<scope>): <subject>
#
# Types: feat, fix, refactor, perf, test, docs, chore, ci

git commit -m "feat(reservations): add price calculator"
git commit -m "fix(auth): validate password strength"
git commit -m "docs(architecture): update diagrams"
```

### 4. Push & Create Pull Request

```bash
# Push to fork
git push origin feature/FEATURE_NAME

# Create PR on GitHub
# Use PR template
# Link related issues
```

---

## 📊 Code Standards

### Style Guide

**TypeScript**:
```typescript
// ✅ GOOD
interface ReservationRequest {
  hallId: string;
  clientId: string;
  eventTypeId: string;
  date: Date;
  guests: number;
}

// ❌ BAD
interface ReservationRequest {
  h: string;
  c: string;
  e: string;
  d: Date;
  g: number;
}
```

**React Components**:
```typescript
// ✅ GOOD
const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onEdit,
  onDelete
}) => {
  return (
    <div className="reservation-card">
      {/* Component content */}
    </div>
  );
};

// ❌ BAD
const rc = () => {
  // Missing props, types
};
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|----------|
| Variables | camelCase | `reservationId`, `createdAt` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `MAX_GUESTS` |
| Classes | PascalCase | `ReservationService`, `UserController` |
| Functions | camelCase | `calculatePrice()`, `validateEmail()` |
| Files | kebab-case | `reservation.service.ts`, `user.controller.ts` |
| Directories | kebab-case | `reservation-service/`, `email-templates/` |

### Best Practices

**Backend**:
- Separation of concerns (Controllers, Services, Models)
- Input validation on every endpoint
- Error handling with proper HTTP status codes
- Use transactions for multi-step operations
- Write unit tests for business logic
- Document complex functions

**Frontend**:
- Functional components with hooks
- Proper prop types (TypeScript)
- Custom hooks for reusable logic
- Component composition over inheritance
- Loading & error states
- Accessibility considerations

---

## 🧪 Testing Requirements

### Unit Tests

```bash
# Backend
cd apps/backend
npm run test
npm run test:coverage

# Frontend
cd apps/frontend
npm run test
npm run test:coverage
```

**Coverage Targets**:
- Backend: 80% minimum
- Frontend: 75% minimum

### E2E Tests

```bash
cd apps/frontend
npm run test:e2e
```

### Test Example

```typescript
// Backend test
describe('ReservationService', () => {
  describe('calculatePrice', () => {
    it('should calculate base price correctly', () => {
      const price = reservationService.calculatePrice({
        guests: 30,
        pricePerPerson: 250,
        hours: 6
      });
      expect(price.totalPrice).toBe(7500);
    });

    it('should include overtime hours', () => {
      const price = reservationService.calculatePrice({
        guests: 30,
        pricePerPerson: 250,
        hours: 8
      });
      expect(price.overtimeHours).toBe(2);
    });
  });
});
```

---

## 📊 Documentation

### Code Comments

```typescript
// 💫 Good - explains WHY
// We use bcrypt with salt rounds 10 for balance between
// security and performance in production
const hashedPassword = await bcrypt.hash(password, 10);

// 💫 Bad - explains WHAT (obvious)
// Hash the password
const hashedPassword = await bcrypt.hash(password, 10);
```

### Function Documentation

```typescript
/**
 * Calculate total price for reservation including overtime charges.
 *
 * @param params - Reservation pricing parameters
 * @param params.guests - Number of guests
 * @param params.pricePerPerson - Price per person in PLN
 * @param params.hours - Total reservation hours (default 6)
 * @returns Calculated price object with breakdown
 *
 * @example
 * const price = calculatePrice({
 *   guests: 30,
 *   pricePerPerson: 250,
 *   hours: 7
 * });
 * // Returns: { basePrice: 7500, overtimeHours: 1, overtimePrice: 125, totalPrice: 7625 }
 */
function calculatePrice(
  params: PricingParams
): CalculatedPrice { }
```

### Update Documentation

When adding features:
- Update relevant .md files in `/docs`
- Update architecture diagrams if needed
- Add API endpoint to Swagger/OpenAPI
- Update database schema docs if DB changes

---

## 🔠 Pull Request Process

### PR Template

```markdown
## 📊 Description

Brief description of changes.

## 🦨 Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement
- [ ] Refactoring

## 🔗 Related Issues

Fixes #(issue number)

## 🧪 How to Test

Steps to verify the changes.

## 📋 Checklist

- [ ] Tests written/updated
- [ ] Code formatted with prettier
- [ ] Lint passes
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Self-reviewed

## 📷 Screenshots (if applicable)

Before/After screenshots for UI changes.
```

### Review Expectations

**Your PR will be reviewed on**:
- Code quality
- Test coverage
- Performance implications
- Security considerations
- Documentation completeness
- Adherence to code standards

**Feedback types**:
- 🚋 `blocking` - Must fix before merge
- 🙋 `suggestion` - Nice to have improvement
- 📚 `documentation` - Docs update needed

---

## 🔒 Security Guidelines

### Password Security

```typescript
// ✅ GOOD - Strong validation
const isValidPassword = (password: string): boolean => {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&          // Uppercase
    /[a-z]/.test(password) &&          // Lowercase
    /\d/.test(password) &&              // Digit
    /[!@#$%^&*]/.test(password)        // Special char
  );
};

// Hash with bcrypt
const hash = await bcrypt.hash(password, 10);
```

### Input Validation

```typescript
// ✅ GOOD - Always validate
const createReservation = async (req, res) => {
  const { guests, hallId } = req.body;

  // Validate inputs
  if (!guests || guests <= 0) {
    return res.status(400).json({ error: 'Invalid guests' });
  }

  // Check capacity
  const hall = await Hall.findById(hallId);
  if (guests > hall.capacity) {
    return res.status(400).json({ error: 'Exceeds capacity' });
  }

  // Continue...
};
```

### No Sensitive Data in Logs

```typescript
// ✅ GOOD
logger.info(`User ${userId} logged in`, { userId });

// ❌ BAD - Exposes password
logger.info(`Login attempt`, { email, password });

// ❌ BAD - Exposes token
logger.info(`JWT token generated`, { token });
```

---

## 🐟 Git Workflow Tips

### Update Feature Branch

```bash
# Fetch latest
git fetch upstream

# Rebase on main
git rebase upstream/main

# Force push (use cautiously!)
git push origin feature/FEATURE_NAME -f
```

### Squash Commits

```bash
# Squash last 3 commits
git rebase -i HEAD~3
# Change 'pick' to 'squash' for commits to combine
```

### View Changes

```bash
# See your changes
git diff

# See staged changes
git diff --staged

# Compare with main
git diff upstream/main..HEAD
```

---

## 🚰 Common Issues & Solutions

### Docker Issues

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Migration Issues

```bash
# Rollback migration
docker-compose exec backend npm run prisma:migrate:resolve

# Reset database (dev only!)
docker-compose exec backend npm run prisma:migrate:reset
```

### Test Failures

```bash
# Run single test file
npm run test -- reservations.service.spec.ts

# Run with debugging
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

---

## 💁 Code of Conduct

Budzię 👋 do:
- ✅ Respectful communication
- ✅ Constructive feedback
- ✅ Inclusivity
- ✅ Focus on the code, not the person

Ne robę:
- ❌ Discrimination
- ❌ Harassment
- ❌ Disrespectful language

---

## 💁‍⚖️ Code Review Checklist

When reviewing others' code:

- [ ] Code follows project conventions
- [ ] Tests are included and pass
- [ ] No obvious bugs or edge cases
- [ ] Performance acceptable
- [ ] Security not compromised
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] Meaningful commit messages
- [ ] No unnecessary dependencies

---

## 👥 Team

**Lead Developer**: Kamil Gołębiowski
- GitHub: [@kamil-gol](https://github.com/kamil-gol)
- Email: kamilgolebiowski@10g.pl

---

## 📄 Resources

- [Project Documentation](./docs/README.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Sprint Plan](./docs/SPRINTS.md)

---

Dziękujemy za wsparcie! 🉋

**Last Updated**: 06.02.2026