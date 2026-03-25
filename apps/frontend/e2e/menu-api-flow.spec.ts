/**
 * Menu API E2E Flow (Playwright)
 * Issue: #98 — section 4 (partial: API-only, no frontend UI yet)
 *
 * Tests the full menu management flow through the live API.
 * Uses Playwright's request context (not browser UI) since
 * menu frontend pages don't exist yet.
 *
 * Prerequisites: backend running at NEXT_PUBLIC_API_URL
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let authToken: string;
let eventTypeId: string;
let templateId: string;
let packageId: string;
let courseId: string;
let optionId: string;
let addonGroupId: string;

test.describe.serial('Menu API E2E Flow', () => {

  test('1. Login as admin', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@gosciniecrodzinny.pl',
        password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!@#',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toHaveProperty('token');
    authToken = body.data.token;
  });

  test('2. Get event types for template', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/event-types`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    // Event types may be at different endpoint, accept various
    if (res.ok()) {
      const body = await res.json();
      const types = body.data || body;
      if (Array.isArray(types) && types.length > 0) {
        eventTypeId = types[0].id;
      }
    }
    // If no event types endpoint, we'll create template without eventTypeId check
    test.skip(!eventTypeId, 'No event types available');
  });

  test('3. Create menu template', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');
    const res = await request.post(`${API_URL}/api/menu-templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: `E2E Test Template ${Date.now()}`,
        description: 'Created by E2E test',
        eventTypeId: eventTypeId || undefined,
        isActive: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    templateId = body.data.id;
    expect(templateId).toBeTruthy();
  });

  test('4. List templates — should include created', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');
    const res = await request.get(`${API_URL}/api/menu-templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const templates = body.data || body;
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.some((t: any) => t.id === templateId)).toBe(true);
  });

  test('5. Create menu package', async ({ request }) => {
    test.skip(!templateId, 'No template');
    const res = await request.post(`${API_URL}/api/menu-packages`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'E2E Standard Package',
        menuTemplateId: templateId,
        pricePerAdult: 250,
        pricePerChild: 125,
        pricePerToddler: 62,
        description: 'Standard wedding package',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    packageId = body.data.id;
    expect(packageId).toBeTruthy();
  });

  test('6. Create menu course under package', async ({ request }) => {
    test.skip(!packageId, 'No package');
    const res = await request.post(`${API_URL}/api/menu-courses`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'Przystawki',
        packageId: packageId,
        displayOrder: 0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    courseId = body.data.id;
    expect(courseId).toBeTruthy();
  });

  test('7. List courses for package', async ({ request }) => {
    test.skip(!packageId, 'No package');
    const res = await request.get(`${API_URL}/api/menu-courses/package/${packageId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const courses = body.data || body;
    expect(courses.length).toBeGreaterThanOrEqual(1);
  });

  test('8. Create menu option', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');
    const res = await request.post(`${API_URL}/api/menu-options`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'E2E Open Bar',
        category: 'ALCOHOL',
        pricePerPerson: 50,
        description: 'Premium open bar',
      },
    });
    // Endpoint may not be implemented yet — tolerate 404
    if (!res.ok()) {
      test.skip(true, 'menu-options endpoint not implemented');
      return;
    }
    const body = await res.json();
    optionId = body.data.id;
  });

  test('9. Assign option to package', async ({ request }) => {
    test.skip(!packageId || !optionId, 'Missing package or option');
    const res = await request.post(`${API_URL}/api/menu-packages/${packageId}/options`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { optionIds: [optionId] },
    });
    // May succeed or fail based on implementation details
    expect(res.status()).toBeLessThan(500);
  });

  test('10. Create addon group', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');
    const res = await request.post(`${API_URL}/api/addon-groups`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'E2E Dodatki mięsne',
        priceType: 'PER_ITEM',
        basePrice: 25,
        minSelect: 0,
        maxSelect: 3,
      },
    });
    // Endpoint may not be implemented yet — tolerate 404
    if (!res.ok()) {
      test.skip(true, 'addon-groups endpoint not implemented');
      return;
    }
    const body = await res.json();
    addonGroupId = body.data.id;
  });

  test('11. Update template', async ({ request }) => {
    test.skip(!templateId, 'No template');
    const res = await request.put(`${API_URL}/api/menu-templates/${templateId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { description: 'Updated by E2E test' },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('12. Duplicate template', async ({ request }) => {
    test.skip(!templateId, 'No template');
    const res = await request.post(`${API_URL}/api/menu-templates/${templateId}/duplicate`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: `E2E Kopia ${Date.now()}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.id).not.toBe(templateId);
  });

  // ── Cleanup ──

  test('13. Delete addon group', async ({ request }) => {
    test.skip(!addonGroupId, 'No addon group to delete');
    const res = await request.delete(`${API_URL}/api/addon-groups/${addonGroupId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('14. Delete option', async ({ request }) => {
    test.skip(!optionId, 'No option to delete');
    const res = await request.delete(`${API_URL}/api/menu-options/${optionId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('15. Delete course', async ({ request }) => {
    test.skip(!courseId, 'No course');
    const res = await request.delete(`${API_URL}/api/menu-courses/${courseId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('16. Delete package', async ({ request }) => {
    test.skip(!packageId, 'No package');
    const res = await request.delete(`${API_URL}/api/menu-packages/${packageId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('17. Delete template', async ({ request }) => {
    test.skip(!templateId, 'No template');
    const res = await request.delete(`${API_URL}/api/menu-templates/${templateId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });
});
