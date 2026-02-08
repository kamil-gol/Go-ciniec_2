# 🚀 CI/CD Integration Guide - E2E Tests

**Autor:** Kamil Gol  
**Data:** 08.02.2026  
**Framework:** Playwright ^1.41.1  

Guide do integracji E2E testów z CI/CD pipelines.

---

## 📊 Quick Stats

- **Test Duration**: ~92s dla 45 testów
- **Browsers**: Chromium (rekomendowane dla CI)
- **Parallelization**: 4 workers (konfigurowalne)
- **Retry**: 2x dla flaky testów (tylko na CI)
- **Artifacts**: Screenshots, videos, traces dla failed testów

---

## 🤖 GitHub Actions

### Basic Workflow

Utwórz `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch: # Manual trigger

jobs:
  e2e-tests:
    name: E2E Tests (Chromium)
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: apps/frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: apps/frontend
        run: npm ci
      
      - name: Install Playwright browsers
        working-directory: apps/frontend
        run: npx playwright install chromium --with-deps
      
      - name: Start Docker services
        run: |
          docker-compose up -d
          echo "Waiting for services to be ready..."
          sleep 15
          curl --retry 10 --retry-delay 3 --retry-connrefused http://localhost:3000
          curl --retry 10 --retry-delay 3 --retry-connrefused http://localhost:4000/health
      
      - name: Run E2E tests
        working-directory: apps/frontend
        run: npm run test:e2e -- --project=chromium e2e/specs/
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/frontend/playwright-report/
          retention-days: 7
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: apps/frontend/test-results/
          retention-days: 7
      
      - name: Stop Docker services
        if: always()
        run: docker-compose down
```

### Multi-Browser Matrix

Jeśli potrzebujesz testów na wielu przeglądarkach:

```yaml
jobs:
  e2e-tests:
    name: E2E Tests (${{ matrix.browser }})
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      # ... (jak wyżej) ...
      
      - name: Install Playwright browser
        working-directory: apps/frontend
        run: npx playwright install ${{ matrix.browser }} --with-deps
      
      - name: Run E2E tests
        working-directory: apps/frontend
        run: npm run test:e2e -- --project=${{ matrix.browser }} e2e/specs/
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: apps/frontend/playwright-report/
```

### Scheduled Tests

Nightly smoke tests:

```yaml
name: Nightly E2E Tests

on:
  schedule:
    # Codziennie o 2:00 UTC
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  smoke-tests:
    name: Smoke Tests
    runs-on: ubuntu-latest
    
    steps:
      # ... (setup jak wyżej) ...
      
      - name: Run smoke tests only
        working-directory: apps/frontend
        run: |
          npm run test:e2e -- --project=chromium e2e/specs/01-auth.spec.ts
          npm run test:e2e -- --project=chromium e2e/specs/10-bugfix-regression.spec.ts
        env:
          CI: true
```

---

## 🔶 GitLab CI

Utwórz `.gitlab-ci.yml`:

```yaml
stages:
  - test

e2e-tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.41.1-focal
  
  services:
    - docker:dind
  
  variables:
    CI: "true"
    DOCKER_DRIVER: overlay2
  
  before_script:
    - cd apps/frontend
    - npm ci
    - npx playwright install chromium
  
  script:
    - docker-compose up -d
    - sleep 15
    - npm run test:e2e -- --project=chromium e2e/specs/
  
  after_script:
    - docker-compose down
  
  artifacts:
    when: always
    paths:
      - apps/frontend/playwright-report/
      - apps/frontend/test-results/
    expire_in: 1 week
  
  only:
    - main
    - develop
    - merge_requests
```

---

## 🟢 Jenkins

Utwórz `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    environment {
        CI = 'true'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('apps/frontend') {
                    sh 'npm ci'
                    sh 'npx playwright install chromium --with-deps'
                }
            }
        }
        
        stage('Start Services') {
            steps {
                sh 'docker-compose up -d'
                sh 'sleep 15'
                sh 'curl --retry 10 --retry-delay 3 http://localhost:3000'
            }
        }
        
        stage('Run E2E Tests') {
            steps {
                dir('apps/frontend') {
                    sh 'npm run test:e2e -- --project=chromium e2e/specs/'
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker-compose down'
            
            publishHTML([
                reportDir: 'apps/frontend/playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])
            
            archiveArtifacts(
                artifacts: 'apps/frontend/test-results/**/*',
                allowEmptyArchive: true
            )
        }
    }
}
```

---

## 🐳 Docker Compose dla CI

Opcjonalnie utwórz `docker-compose.ci.yml` z optimized settings:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: rezerwacje
      POSTGRES_PASSWORD: rezerwacje123
      POSTGRES_DB: rezerwacje_test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rezerwacje"]
      interval: 5s
      timeout: 5s
      retries: 5
  
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://rezerwacje:rezerwacje123@postgres:5432/rezerwacje_test
      NODE_ENV: test
      JWT_SECRET: test-secret-key
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 5s
      timeout: 5s
      retries: 10
  
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://backend:4000
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "3000:3000"
```

Użycie w CI:

```bash
docker-compose -f docker-compose.ci.yml up -d
```

---

## ⚙️ Konfiguracja Playwright dla CI

W `playwright.config.ts`, użyj `process.env.CI`:

```typescript
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e/specs',
  
  // CI optimizations
  fullyParallel: true,
  forbidOnly: isCI,      // Fail jeśli test.only na CI
  retries: isCI ? 2 : 0, // 2 retries na CI, 0 lokalnie
  workers: isCI ? 4 : undefined,
  
  // Reporting
  reporter: isCI 
    ? [['html'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['html'], ['list']],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: isCI ? 'only-on-failure' : 'off',
    video: isCI ? 'retain-on-failure' : 'off',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

## 📊 Monitoring & Alerting

### Slack Notifications (GitHub Actions)

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "E2E Tests Failed ❌",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*E2E Tests Failed* on `${{ github.ref }}`\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Email Notifications (GitLab)

```yaml
e2e-tests:
  # ... (config jak wyżej) ...
  
  after_script:
    - |
      if [ $CI_JOB_STATUS == 'failed' ]; then
        echo "E2E tests failed. Sending email..."
        # Send email via API
      fi
```

---

## 🔍 Test Reports

### JUnit XML (dla Jenkins/GitLab)

Playwright automatycznie generuje `junit.xml` jeśli skonfigurowane:

```typescript
// playwright.config.ts
reporter: [
  ['junit', { outputFile: 'test-results/junit.xml' }]
]
```

### HTML Report Hosting

#### GitHub Pages

```yaml
- name: Deploy report to GitHub Pages
  if: always()
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: apps/frontend/playwright-report
    destination_dir: reports/${{ github.run_number }}
```

#### AWS S3

```yaml
- name: Upload report to S3
  if: always()
  run: |
    aws s3 sync apps/frontend/playwright-report/ \
      s3://my-bucket/e2e-reports/${{ github.run_number }}/ \
      --delete
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: eu-central-1
```

---

## 🚀 Performance Optimization

### 1. Sharding (duże test suites)

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]

steps:
  - name: Run tests (shard ${{ matrix.shard }})
    run: |
      npm run test:e2e -- \
        --project=chromium \
        --shard=${{ matrix.shard }}/4 \
        e2e/specs/
```

### 2. Docker Layer Caching

```yaml
- name: Setup Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

### 3. npm Cache

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
    cache-dependency-path: apps/frontend/package-lock.json
```

---

## ✅ Checklist dla CI/CD

- [ ] Workflow file utworzony (`.github/workflows/e2e-tests.yml`)
- [ ] Playwright config optimized dla CI (`retries: 2`, `workers: 4`)
- [ ] Docker services startują poprawnie
- [ ] Health checks dla backend/frontend
- [ ] Artifacts upload (HTML report, screenshots, videos)
- [ ] Notifications configured (Slack/Email)
- [ ] Secrets configured (jeśli potrzebne)
- [ ] Tests pass lokalnie z `CI=true`
- [ ] Pipeline runs on PR/push to main
- [ ] Failed tests są debuggable (trace.zip, screenshots)

---

## 📝 Environment Variables

**Lokalne:**
```bash
export CI=false
export PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

**CI:**
```bash
export CI=true
export PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

**Secrets (GitHub Actions):**
- `SLACK_WEBHOOK_URL` - dla notyfikacji
- `AWS_ACCESS_KEY_ID` - dla S3 upload
- `AWS_SECRET_ACCESS_KEY` - dla S3 upload

---

## 🐞 Troubleshooting CI

### Problem: Services nie startują

```yaml
# Dodaj logi
- name: Check services
  run: |
    docker-compose logs
    docker ps -a
    curl -v http://localhost:3000
    curl -v http://localhost:4000/health
```

### Problem: Tests timeout

```typescript
// Zwiększ timeout dla CI
export default defineConfig({
  timeout: process.env.CI ? 60000 : 30000,
});
```

### Problem: Flaky tests

```typescript
// Więcej retries dla CI
export default defineConfig({
  retries: process.env.CI ? 3 : 0,
});
```

---

## 📚 Resources

- [Playwright CI Docs](https://playwright.dev/docs/ci)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitLab CI Docs](https://docs.gitlab.com/ee/ci/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

**Autor:** Kamil Gol  
**Email:** kamilgolebiowski@10g.pl  
**Data:** 08.02.2026, 02:50 CET  
