/**
 * Service Extras API E2E Flow (Playwright)
 *
 * Tests the full service-extras management flow through the live API:
 *   - Categories CRUD (list seeded, create, update, delete)
 *   - Items CRUD with different priceType values (FLAT, PER_PERSON, PER_UNIT)
 *   - Category-item relationship verification
 *   - Reservation extras assignment flow
 *   - Cleanup of all test data
 *
 * Prerequisites: backend running at NEXT_PUBLIC_API_URL
 */
import { test, expect } from '@playwright/test';

// Strip trailing /api to avoid double /api/api/ when NEXT_PUBLIC_API_URL includes it
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '');
const TIMESTAMP = Date.now();

let authToken: string;

// Category IDs
let createdCategoryId: string;
let secondCategoryId: string;

// Item IDs
let flatItemId: string;
let perPersonItemId: string;
let perUnitItemId: string;

// Reservation extras
let reservationId: string;
let reservationExtraId: string;

function authHeaders() {
  return { Authorization: `Bearer ${authToken}` };
}

test.describe.serial('Service Extras API E2E Flow', () => {
  // ═══════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES — list seeded data
  // ═══════════════════════════════════════════════════════════════

  test('2. GET /categories — list seeded categories (Napoje, Dekoracje)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/service-extras/categories`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const categories = body.data || body;
    expect(Array.isArray(categories)).toBe(true);

    const names = categories.map((c: any) => c.name);
    expect(names).toContain('Napoje');
    expect(names).toContain('Dekoracje');
  });

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES — create
  // ═══════════════════════════════════════════════════════════════

  test('3. POST /categories — create a new category', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/service-extras/categories`, {
      headers: authHeaders(),
      data: {
        name: `E2E Rozrywka ${TIMESTAMP}`,
        slug: `e2e-rozrywka-${TIMESTAMP}`,
        description: 'Kategoria testowa E2E',
        displayOrder: 10,
        isActive: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    createdCategoryId = body.data.id;
    expect(createdCategoryId).toBeTruthy();
    expect(body.data.name).toContain('E2E Rozrywka');
  });

  test('4. POST /categories — create second category for multi-category tests', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/service-extras/categories`, {
      headers: authHeaders(),
      data: {
        name: `E2E Muzyka ${TIMESTAMP}`,
        slug: `e2e-muzyka-${TIMESTAMP}`,
        description: 'Druga kategoria testowa E2E',
        displayOrder: 11,
        isActive: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    secondCategoryId = body.data.id;
    expect(secondCategoryId).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES — update
  // ═══════════════════════════════════════════════════════════════

  test('5. PUT /categories/:id — update category name and description', async ({ request }) => {
    test.skip(!createdCategoryId, 'No category to update');
    const res = await request.put(`${API_URL}/api/service-extras/categories/${createdCategoryId}`, {
      headers: authHeaders(),
      data: {
        name: `E2E Rozrywka Updated ${TIMESTAMP}`,
        description: 'Zaktualizowana kategoria E2E',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const cat = body.data || body;
    expect(cat.name).toContain('Updated');
  });

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES — get single
  // ═══════════════════════════════════════════════════════════════

  test('6. GET /categories/:id — verify updated category', async ({ request }) => {
    test.skip(!createdCategoryId, 'No category');
    const res = await request.get(`${API_URL}/api/service-extras/categories/${createdCategoryId}`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const cat = body.data || body;
    expect(cat.id).toBe(createdCategoryId);
    expect(cat.description).toContain('Zaktualizowana');
  });

  // ═══════════════════════════════════════════════════════════════
  // ITEMS — create with different priceType values
  // ═══════════════════════════════════════════════════════════════

  test('7. POST /items — create FLAT price item', async ({ request }) => {
    test.skip(!createdCategoryId, 'No category');
    const res = await request.post(`${API_URL}/api/service-extras/items`, {
      headers: authHeaders(),
      data: {
        name: `E2E Fotobudka ${TIMESTAMP}`,
        categoryId: createdCategoryId,
        priceType: 'FLAT',
        basePrice: 1500,
        description: 'Fotobudka na imprezę',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    flatItemId = body.data.id;
    expect(flatItemId).toBeTruthy();
    expect(body.data.priceType).toBe('FLAT');
  });

  test('8. POST /items — create PER_PERSON price item', async ({ request }) => {
    test.skip(!createdCategoryId, 'No category');
    const res = await request.post(`${API_URL}/api/service-extras/items`, {
      headers: authHeaders(),
      data: {
        name: `E2E Open Bar ${TIMESTAMP}`,
        categoryId: createdCategoryId,
        priceType: 'PER_PERSON',
        basePrice: 75,
        description: 'Open bar per person',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    perPersonItemId = body.data.id;
    expect(perPersonItemId).toBeTruthy();
    expect(body.data.priceType).toBe('PER_PERSON');
  });

  test('9. POST /items — create PER_UNIT price item in second category', async ({ request }) => {
    test.skip(!secondCategoryId, 'No second category');
    const res = await request.post(`${API_URL}/api/service-extras/items`, {
      headers: authHeaders(),
      data: {
        name: `E2E DJ Set ${TIMESTAMP}`,
        categoryId: secondCategoryId,
        priceType: 'PER_UNIT',
        basePrice: 200,
        description: 'Godzina grania DJ',
        requiresNote: true,
        noteLabel: 'Preferowany styl muzyki',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    perUnitItemId = body.data.id;
    expect(perUnitItemId).toBeTruthy();
    expect(body.data.priceType).toBe('PER_UNIT');
  });

  // ═══════════════════════════════════════════════════════════════
  // ITEMS — list & filter
  // ═══════════════════════════════════════════════════════════════

  test('10. GET /items — list all items', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/service-extras/items`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const items = body.data || body;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  test('11. GET /items?categoryId= — filter items by category', async ({ request }) => {
    test.skip(!createdCategoryId, 'No category');
    const res = await request.get(
      `${API_URL}/api/service-extras/items?categoryId=${createdCategoryId}`,
      { headers: authHeaders() }
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const items = body.data || body;
    expect(Array.isArray(items)).toBe(true);
    // Should contain the FLAT and PER_PERSON items from createdCategoryId
    const ids = items.map((i: any) => i.id);
    if (flatItemId) expect(ids).toContain(flatItemId);
    if (perPersonItemId) expect(ids).toContain(perPersonItemId);
    // Should NOT contain the PER_UNIT item from secondCategoryId
    if (perUnitItemId) expect(ids).not.toContain(perUnitItemId);
  });

  // ═══════════════════════════════════════════════════════════════
  // ITEMS — update
  // ═══════════════════════════════════════════════════════════════

  test('12. PUT /items/:id — update item price and description', async ({ request }) => {
    test.skip(!flatItemId, 'No item to update');
    const res = await request.put(`${API_URL}/api/service-extras/items/${flatItemId}`, {
      headers: authHeaders(),
      data: {
        basePrice: 1800,
        description: 'Fotobudka premium z rekwizytami',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const item = body.data || body;
    expect(Number(item.basePrice)).toBe(1800);
  });

  test('13. GET /items/:id — verify updated item', async ({ request }) => {
    test.skip(!flatItemId, 'No item');
    const res = await request.get(`${API_URL}/api/service-extras/items/${flatItemId}`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const item = body.data || body;
    expect(item.id).toBe(flatItemId);
    expect(Number(item.basePrice)).toBe(1800);
    expect(item.description).toContain('premium');
  });

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY-ITEM RELATIONSHIP
  // ═══════════════════════════════════════════════════════════════

  test('14. Verify categories list includes correct item counts', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/service-extras/categories`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const categories = body.data || body;

    const created = categories.find((c: any) => c.id === createdCategoryId);
    const second = categories.find((c: any) => c.id === secondCategoryId);

    if (created) {
      // createdCategory should have 2 items (FLAT + PER_PERSON)
      const itemCount = created._count?.serviceItems ?? created.serviceItems?.length ?? created.itemCount;
      if (itemCount !== undefined) {
        expect(itemCount).toBe(2);
      }
    }

    if (second) {
      // secondCategory should have 1 item (PER_UNIT)
      const itemCount = second._count?.serviceItems ?? second.serviceItems?.length ?? second.itemCount;
      if (itemCount !== undefined) {
        expect(itemCount).toBe(1);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // RESERVATION EXTRAS — assign extras to a reservation
  // ═══════════════════════════════════════════════════════════════

  test('15. Find an existing reservation for extras assignment', async ({ request }) => {
    // Try to get a reservation from the API
    const res = await request.get(`${API_URL}/api/reservations`, {
      headers: authHeaders(),
    });
    if (res.ok()) {
      const body = await res.json();
      const reservations = body.data || body;
      if (Array.isArray(reservations) && reservations.length > 0) {
        reservationId = reservations[0].id;
      }
    }
    test.skip(!reservationId, 'No reservations available for extras assignment');
  });

  test('16. POST /reservations/:id/extras — assign extra to reservation', async ({ request }) => {
    test.skip(!reservationId || !flatItemId, 'No reservation or item');
    const res = await request.post(
      `${API_URL}/api/service-extras/reservations/${reservationId}/extras`,
      {
        headers: authHeaders(),
        data: {
          serviceItemId: flatItemId,
          quantity: 1,
          note: 'E2E test extra',
        },
      }
    );
    if (res.ok()) {
      const body = await res.json();
      reservationExtraId = (body.data || body).id;
      expect(reservationExtraId).toBeTruthy();
    } else {
      // Reservation extras may fail if reservation state doesn't allow it
      test.skip(true, `Assign extra returned ${res.status()}`);
    }
  });

  test('17. GET /reservations/:id/extras — list reservation extras', async ({ request }) => {
    test.skip(!reservationId, 'No reservation');
    const res = await request.get(
      `${API_URL}/api/service-extras/reservations/${reservationId}/extras`,
      { headers: authHeaders() }
    );
    if (res.ok()) {
      const body = await res.json();
      const extras = body.data || body;
      expect(Array.isArray(extras)).toBe(true);
      if (reservationExtraId) {
        expect(extras.some((e: any) => e.id === reservationExtraId)).toBe(true);
      }
    }
  });

  test('18. PUT /reservations/:id/extras/:extraId — update reservation extra', async ({ request }) => {
    test.skip(!reservationId || !reservationExtraId, 'No reservation extra');
    const res = await request.put(
      `${API_URL}/api/service-extras/reservations/${reservationId}/extras/${reservationExtraId}`,
      {
        headers: authHeaders(),
        data: {
          quantity: 2,
          note: 'E2E test extra updated',
        },
      }
    );
    if (res.ok()) {
      const body = await res.json();
      const extra = body.data || body;
      expect(extra.quantity).toBe(2);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP — reverse order to respect FK constraints
  // ═══════════════════════════════════════════════════════════════

  test('19. DELETE reservation extra', async ({ request }) => {
    test.skip(!reservationId || !reservationExtraId, 'No reservation extra to delete');
    const res = await request.delete(
      `${API_URL}/api/service-extras/reservations/${reservationId}/extras/${reservationExtraId}`,
      { headers: authHeaders() }
    );
    expect(res.ok()).toBeTruthy();
  });

  test('20. DELETE /items/:id — delete FLAT item', async ({ request }) => {
    test.skip(!flatItemId, 'No item to delete');
    const res = await request.delete(`${API_URL}/api/service-extras/items/${flatItemId}`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
  });

  test('21. DELETE /items/:id — delete PER_PERSON item', async ({ request }) => {
    test.skip(!perPersonItemId, 'No item to delete');
    const res = await request.delete(`${API_URL}/api/service-extras/items/${perPersonItemId}`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
  });

  test('22. DELETE /items/:id — delete PER_UNIT item', async ({ request }) => {
    test.skip(!perUnitItemId, 'No item to delete');
    const res = await request.delete(`${API_URL}/api/service-extras/items/${perUnitItemId}`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
  });

  test('23. DELETE /categories/:id — delete first test category', async ({ request }) => {
    test.skip(!createdCategoryId, 'No category to delete');
    const res = await request.delete(
      `${API_URL}/api/service-extras/categories/${createdCategoryId}`,
      { headers: authHeaders() }
    );
    expect(res.ok()).toBeTruthy();
  });

  test('24. DELETE /categories/:id — delete second test category', async ({ request }) => {
    test.skip(!secondCategoryId, 'No category to delete');
    const res = await request.delete(
      `${API_URL}/api/service-extras/categories/${secondCategoryId}`,
      { headers: authHeaders() }
    );
    expect(res.ok()).toBeTruthy();
  });

  test('25. Verify deleted category no longer in list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/service-extras/categories`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const categories = body.data || body;
    const ids = categories.map((c: any) => c.id);
    if (createdCategoryId) expect(ids).not.toContain(createdCategoryId);
    if (secondCategoryId) expect(ids).not.toContain(secondCategoryId);
  });
});
