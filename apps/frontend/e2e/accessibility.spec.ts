import { test, expect } from './fixtures/auth';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility E2E tests — WCAG 2.0 AA compliance.
 *
 * Uses @axe-core/playwright to scan key dashboard pages for critical and
 * serious accessibility violations. Third-party components (Recharts,
 * react-day-picker, Radix poppers) are excluded because they are outside
 * our control.
 */

const EXCLUDED_SELECTORS =
  '.recharts-wrapper, .rdp, [data-radix-popper-content-wrapper]';

/** Helper: disable CSS animations/transitions so axe doesn't scan mid-animation. */
async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
  // Small wait to let forced-instant animations settle
  await page.waitForTimeout(500);
}

/** Helper: run axe on the current page and return the results. */
async function scanPage(page: import('@playwright/test').Page) {
  await disableAnimations(page);
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .exclude(EXCLUDED_SELECTORS)
    .analyze();
}

/** Helper: log violation details for debugging. */
function logViolations(
  results: Awaited<ReturnType<typeof scanPage>>,
  label: string,
) {
  const { violations } = results;
  const critical = violations.filter((v) => v.impact === 'critical');
  const serious = violations.filter((v) => v.impact === 'serious');

  console.log(
    `[a11y] ${label}: ${violations.length} total violations ` +
      `(${critical.length} critical, ${serious.length} serious)`,
  );

  for (const v of [...critical, ...serious]) {
    console.log(
      `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`,
    );
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`      target: ${node.target.join(' > ')}`);
    }
  }
}

test.describe('Accessibility (WCAG AA)', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // authenticatedPage is already logged in as admin
    // Just make sure we start from a known state
    await authenticatedPage.waitForLoadState('networkidle');
  });

  const pages: Array<{ name: string; path: string }> = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Reservations list', path: '/dashboard/reservations/list' },
    { name: 'Clients', path: '/dashboard/clients' },
    { name: 'Halls', path: '/dashboard/halls' },
    { name: 'Event types', path: '/dashboard/event-types' },
    { name: 'Queue', path: '/dashboard/queue' },
    { name: 'Deposits', path: '/dashboard/deposits' },
    { name: 'Settings', path: '/dashboard/settings' },
  ];

  for (const { name, path } of pages) {
    test(`${name} (${path}) has no critical/serious a11y violations`, async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto(path);
      await authenticatedPage.waitForLoadState('networkidle');

      const results = await scanPage(authenticatedPage);
      logViolations(results, name);

      const critical = results.violations.filter(
        (v) => v.impact === 'critical',
      );
      const serious = results.violations.filter(
        (v) => v.impact === 'serious',
      );

      expect(
        critical,
        `Expected zero critical violations on ${name}, found ${critical.length}: ${critical.map((v) => v.id).join(', ')}`,
      ).toHaveLength(0);

      expect(
        serious,
        `Expected zero serious violations on ${name}, found ${serious.length}: ${serious.map((v) => v.id).join(', ')}`,
      ).toHaveLength(0);
    });
  }

  test('Reservation wizard form has no critical/serious a11y violations', async ({
    authenticatedPage,
  }) => {
    // Navigate to the reservations list
    await authenticatedPage.goto('/dashboard/reservations/list');
    await authenticatedPage.waitForLoadState('networkidle');

    // Open the inline wizard
    const newReservationBtn = authenticatedPage.locator(
      'button:has-text("Nowa Rezerwacja")',
    );
    await expect(newReservationBtn).toBeVisible({ timeout: 10000 });
    await newReservationBtn.click();

    // Wait for wizard first step to render
    await expect(
      authenticatedPage.locator('text=Jaki typ wydarzenia?'),
    ).toBeVisible({ timeout: 5000 });

    // Scan the page with the wizard open
    const results = await scanPage(authenticatedPage);
    logViolations(results, 'Reservation wizard');

    const critical = results.violations.filter(
      (v) => v.impact === 'critical',
    );
    const serious = results.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      critical,
      `Expected zero critical violations in wizard, found ${critical.length}: ${critical.map((v) => v.id).join(', ')}`,
    ).toHaveLength(0);

    expect(
      serious,
      `Expected zero serious violations in wizard, found ${serious.length}: ${serious.map((v) => v.id).join(', ')}`,
    ).toHaveLength(0);
  });
});
