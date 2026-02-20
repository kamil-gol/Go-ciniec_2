/**
 * Deposit API Integration Tests
 * Tests for /api/deposits and /api/reservations/:reservationId/deposits
 *
 * Issue: #97
 */

import request from 'supertest';
import app from '../../app';
import { prismaTestClient } from '../helpers/prisma-test-client';
import { seedTestData } from '../helpers/db-seed';

const API_DEPOSITS = '/api/deposits';
const API_RESERVATIONS = '/api/reservations';

let authToken: string;
let seedData: Awaited<ReturnType<typeof seedTestData>>;

beforeAll(async () => {
  seedData = await seedTestData();
  authToken = seedData.authToken;
});

afterAll(async () => {
  await prismaTestClient.$disconnect();
});

// ═══════════════════════════════════════════════════════════════
// Helper: create deposit via API
// ═══════════════════════════════════════════════════════════════

async function createDeposit(
  reservationId: string,
  amount: number,
  dueDate: string = '2026-06-01',
  token: string = authToken
) {
  return request(app)
    .post(`${API_RESERVATIONS}/${reservationId}/deposits`)
    .set('Authorization', `Bearer ${token}`)
    .send({ amount, dueDate });
}

async function markPaid(
  depositId: string,
  paymentMethod: string = 'TRANSFER',
  paidAt: string = '2026-02-20',
  token: string = authToken
) {
  return request(app)
    .patch(`${API_DEPOSITS}/${depositId}/mark-paid`)
    .set('Authorization', `Bearer ${token}`)
    .send({ paymentMethod, paidAt });
}

// ═══════════════════════════════════════════════════════════════
// POST /api/reservations/:reservationId/deposits (Create)
// ═══════════════════════════════════════════════════════════════

describe('POST /api/reservations/:reservationId/deposits', () => {
  it('should create a deposit for a reservation', async () => {
    const res = await createDeposit(seedData.reservationId, 500);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(Number(res.body.data.amount)).toBe(500);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.paid).toBe(false);
  });

  it('should reject deposit with amount <= 0', async () => {
    const res = await createDeposit(seedData.reservationId, 0);
    expect(res.status).toBe(400);
  });

  it('should reject deposit with negative amount', async () => {
    const res = await createDeposit(seedData.reservationId, -100);
    expect(res.status).toBe(400);
  });

  it('should reject deposit exceeding reservation total price', async () => {
    // totalPrice for seed reservation is set in db-seed
    const res = await createDeposit(seedData.reservationId, 9999999);
    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error || '').toMatch(/przekracza|cen/);
  });

  it('should reject deposit for non-existent reservation', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await createDeposit(fakeId, 100);
    expect(res.status).toBe(404);
  });

  it('should reject deposit with invalid reservationId (not UUID)', async () => {
    const res = await request(app)
      .post(`${API_RESERVATIONS}/not-a-uuid/deposits`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 100, dueDate: '2026-06-01' });
    expect(res.status).toBe(400);
  });

  it('should reject deposit without dueDate', async () => {
    const res = await request(app)
      .post(`${API_RESERVATIONS}/${seedData.reservationId}/deposits`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 100 });
    expect(res.status).toBe(400);
  });

  it('should reject deposit with invalid dueDate format', async () => {
    const res = await createDeposit(seedData.reservationId, 100, 'not-a-date');
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/reservations/:reservationId/deposits
// ═══════════════════════════════════════════════════════════════

describe('GET /api/reservations/:reservationId/deposits', () => {
  it('should return deposits for a reservation with summary', async () => {
    const res = await request(app)
      .get(`${API_RESERVATIONS}/${seedData.reservationId}/deposits`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary).toHaveProperty('totalAmount');
    expect(res.body.summary).toHaveProperty('paidAmount');
    expect(res.body.summary).toHaveProperty('pendingAmount');
    expect(res.body.summary).toHaveProperty('percentPaid');
  });

  it('should return 404 for non-existent reservation', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${API_RESERVATIONS}/${fakeId}/deposits`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/deposits (List with filters)
// ═══════════════════════════════════════════════════════════════

describe('GET /api/deposits', () => {
  it('should return paginated deposits', async () => {
    const res = await request(app)
      .get(API_DEPOSITS)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('totalCount');
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get(`${API_DEPOSITS}?status=PENDING`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    for (const dep of res.body.data) {
      expect(dep.status).toBe('PENDING');
    }
  });

  it('should filter by reservationId', async () => {
    const res = await request(app)
      .get(`${API_DEPOSITS}?reservationId=${seedData.reservationId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    for (const dep of res.body.data) {
      expect(dep.reservationId).toBe(seedData.reservationId);
    }
  });

  it('should support pagination params', async () => {
    const res = await request(app)
      .get(`${API_DEPOSITS}?page=1&limit=2`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
  });

  it('should support sorting', async () => {
    const res = await request(app)
      .get(`${API_DEPOSITS}?sortBy=amount&sortOrder=desc`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    const amounts = res.body.data.map((d: any) => Number(d.amount));
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeLessThanOrEqual(amounts[i - 1]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/deposits/stats
// ═══════════════════════════════════════════════════════════════

describe('GET /api/deposits/stats', () => {
  it('should return deposit statistics', async () => {
    const res = await request(app)
      .get(`${API_DEPOSITS}/stats`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counts).toBeDefined();
    expect(res.body.data.amounts).toBeDefined();
    expect(typeof res.body.data.counts.total).toBe('number');
    expect(typeof res.body.data.counts.pending).toBe('number');
    expect(typeof res.body.data.counts.paid).toBe('number');
    expect(typeof res.body.data.amounts.total).toBe('number');
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/deposits/overdue
// ═══════════════════════════════════════════════════════════════

describe('GET /api/deposits/overdue', () => {
  it('should return overdue deposits', async () => {
    const res = await request(app)
      .get(`${API_DEPOSITS}/overdue`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/deposits/:id
// ═══════════════════════════════════════════════════════════════

describe('GET /api/deposits/:id', () => {
  let depositId: string;

  beforeAll(async () => {
    const res = await createDeposit(seedData.reservationId, 200, '2026-07-01');
    depositId = res.body.data.id;
  });

  it('should return deposit details with reservation', async () => {
    const res = await request(app)
      .get(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(depositId);
    expect(res.body.data.reservation).toBeDefined();
    expect(res.body.data.reservation.client).toBeDefined();
  });

  it('should return 404 for non-existent deposit', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${API_DEPOSITS}/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid UUID', async () => {
    const res = await request(app)
      .get(`${API_DEPOSITS}/not-a-uuid`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/deposits/:id (Update)
// ═══════════════════════════════════════════════════════════════

describe('PUT /api/deposits/:id', () => {
  let depositId: string;

  beforeAll(async () => {
    const res = await createDeposit(seedData.reservationId, 300, '2026-08-01');
    depositId = res.body.data.id;
  });

  it('should update deposit amount', async () => {
    const res = await request(app)
      .put(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 350 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.amount)).toBe(350);
  });

  it('should update deposit dueDate', async () => {
    const res = await request(app)
      .put(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ dueDate: '2026-09-15' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should update amount and dueDate together', async () => {
    const res = await request(app)
      .put(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 400, dueDate: '2026-10-01' });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.amount)).toBe(400);
  });

  it('should reject update with no fields', async () => {
    const res = await request(app)
      .put(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('should reject update with amount <= 0', async () => {
    const res = await request(app)
      .put(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: -50 });
    expect(res.status).toBe(400);
  });

  it('should reject update of paid deposit', async () => {
    // Create and pay a deposit
    const createRes = await createDeposit(seedData.reservationId, 100, '2026-11-01');
    const paidDepositId = createRes.body.data.id;
    await markPaid(paidDepositId);

    const res = await request(app)
      .put(`${API_DEPOSITS}/${paidDepositId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 200 });
    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error || '').toMatch(/opłacon|paid/);
  });
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/deposits/:id
// ═══════════════════════════════════════════════════════════════

describe('DELETE /api/deposits/:id', () => {
  it('should delete a pending deposit', async () => {
    const createRes = await createDeposit(seedData.reservationId, 50, '2026-12-01');
    const depositId = createRes.body.data.id;

    const res = await request(app)
      .delete(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's gone
    const getRes = await request(app)
      .get(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(getRes.status).toBe(404);
  });

  it('should reject deleting a paid deposit', async () => {
    const createRes = await createDeposit(seedData.reservationId, 75, '2026-12-15');
    const depositId = createRes.body.data.id;
    await markPaid(depositId);

    const res = await request(app)
      .delete(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent deposit', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .delete(`${API_DEPOSITS}/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/deposits/:id/mark-paid
// ═══════════════════════════════════════════════════════════════

describe('PATCH /api/deposits/:id/mark-paid', () => {
  it('should mark deposit as paid (full payment)', async () => {
    const createRes = await createDeposit(seedData.reservationId, 150, '2026-06-15');
    const depositId = createRes.body.data.id;

    const res = await markPaid(depositId, 'BLIK', '2026-02-20');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paid).toBe(true);
    expect(res.body.data.status).toBe('PAID');
    expect(res.body.data.paymentMethod).toBe('BLIK');
  });

  it('should support partial payment', async () => {
    const createRes = await createDeposit(seedData.reservationId, 200, '2026-06-20');
    const depositId = createRes.body.data.id;

    const res = await request(app)
      .patch(`${API_DEPOSITS}/${depositId}/mark-paid`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ paymentMethod: 'CASH', paidAt: '2026-02-20', amountPaid: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PARTIALLY_PAID');
    expect(res.body.data.paid).toBe(false);
  });

  it('should reject marking already paid deposit', async () => {
    const createRes = await createDeposit(seedData.reservationId, 80, '2026-07-01');
    const depositId = createRes.body.data.id;
    await markPaid(depositId);

    const res = await markPaid(depositId);
    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error || '').toMatch(/juz|already/);
  });

  it('should reject without paymentMethod', async () => {
    const createRes = await createDeposit(seedData.reservationId, 60, '2026-07-05');
    const depositId = createRes.body.data.id;

    const res = await request(app)
      .patch(`${API_DEPOSITS}/${depositId}/mark-paid`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ paidAt: '2026-02-20' });
    expect(res.status).toBe(400);
  });

  it('should reject without paidAt', async () => {
    const createRes = await createDeposit(seedData.reservationId, 60, '2026-07-10');
    const depositId = createRes.body.data.id;

    const res = await request(app)
      .patch(`${API_DEPOSITS}/${depositId}/mark-paid`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ paymentMethod: 'TRANSFER' });
    expect(res.status).toBe(400);
  });

  it('should accept all payment methods', async () => {
    const methods = ['CASH', 'TRANSFER', 'BLIK', 'CARD'];
    for (const method of methods) {
      const createRes = await createDeposit(seedData.reservationId, 30, '2026-08-01');
      const depositId = createRes.body.data.id;
      const res = await markPaid(depositId, method);
      expect(res.status).toBe(200);
      expect(res.body.data.paymentMethod).toBe(method);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/deposits/:id/mark-unpaid
// ═══════════════════════════════════════════════════════════════

describe('PATCH /api/deposits/:id/mark-unpaid', () => {
  it('should revert paid deposit back to pending', async () => {
    const createRes = await createDeposit(seedData.reservationId, 120, '2026-09-01');
    const depositId = createRes.body.data.id;
    await markPaid(depositId);

    const res = await request(app)
      .patch(`${API_DEPOSITS}/${depositId}/mark-unpaid`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.paid).toBe(false);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.paymentMethod).toBeNull();
    expect(res.body.data.paidAt).toBeNull();
  });

  it('should reject unpaid on already pending deposit', async () => {
    const createRes = await createDeposit(seedData.reservationId, 90, '2026-09-05');
    const depositId = createRes.body.data.id;

    const res = await request(app)
      .patch(`${API_DEPOSITS}/${depositId}/mark-unpaid`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/deposits/:id/cancel
// ═══════════════════════════════════════════════════════════════

describe('PATCH /api/deposits/:id/cancel', () => {
  it('should cancel a pending deposit', async () => {
    const createRes = await createDeposit(seedData.reservationId, 110, '2026-10-01');
    const depositId = createRes.body.data.id;

    const res = await request(app)
      .patch(`${API_DEPOSITS}/${depositId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('should reject cancelling a paid deposit', async () => {
    const createRes = await createDeposit(seedData.reservationId, 100, '2026-10-05');
    const depositId = createRes.body.data.id;
    await markPaid(depositId);

    const res = await request(app)
      .patch(`${API_DEPOSITS}/${depositId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent deposit', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(`${API_DEPOSITS}/${fakeId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════
// Business Logic: Deposit lifecycle
// ═══════════════════════════════════════════════════════════════

describe('Deposit lifecycle (business logic)', () => {
  it('should track summary correctly after create + pay + cancel', async () => {
    // Create 2 deposits
    const dep1 = await createDeposit(seedData.reservationId2, 500, '2026-06-01');
    const dep2 = await createDeposit(seedData.reservationId2, 300, '2026-07-01');
    expect(dep1.status).toBe(201);
    expect(dep2.status).toBe(201);

    // Pay first one
    await markPaid(dep1.body.data.id);

    // Cancel second one
    await request(app)
      .patch(`${API_DEPOSITS}/${dep2.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${authToken}`);

    // Check summary
    const summaryRes = await request(app)
      .get(`${API_RESERVATIONS}/${seedData.reservationId2}/deposits`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.summary.paidAmount).toBe(500);
    // Cancelled deposits excluded from totals
    expect(summaryRes.body.summary.totalAmount).toBe(500);
  });

  it('full cycle: create → pay → unpay → update → pay again', async () => {
    const createRes = await createDeposit(seedData.reservationId2, 250, '2026-06-15');
    const depositId = createRes.body.data.id;

    // Pay
    let res = await markPaid(depositId, 'CARD');
    expect(res.body.data.status).toBe('PAID');

    // Unpay
    res = await request(app)
      .patch(`${API_DEPOSITS}/${depositId}/mark-unpaid`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.body.data.status).toBe('PENDING');

    // Update amount
    res = await request(app)
      .put(`${API_DEPOSITS}/${depositId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 300 });
    expect(Number(res.body.data.amount)).toBe(300);

    // Pay again with different method
    res = await markPaid(depositId, 'BLIK');
    expect(res.body.data.status).toBe('PAID');
    expect(res.body.data.paymentMethod).toBe('BLIK');
  });
});

// ═══════════════════════════════════════════════════════════════
// UUID validation
// ═══════════════════════════════════════════════════════════════

describe('UUID validation', () => {
  const invalidUUIDs = ['abc', '123', 'not-uuid', '12345678-1234-1234-1234'];

  for (const badId of invalidUUIDs) {
    it(`should reject invalid UUID: ${badId}`, async () => {
      const res = await request(app)
        .get(`${API_DEPOSITS}/${badId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// Authorization
// ═══════════════════════════════════════════════════════════════

describe('Authorization — all mutating endpoints require auth', () => {
  it('should return 401 for all endpoints without token', async () => {
    const depositId = '00000000-0000-0000-0000-000000000001';
    const reservationId = seedData.reservationId;

    const endpoints = [
      { method: 'get', url: API_DEPOSITS },
      { method: 'get', url: `${API_DEPOSITS}/stats` },
      { method: 'get', url: `${API_DEPOSITS}/overdue` },
      { method: 'get', url: `${API_DEPOSITS}/${depositId}` },
      { method: 'put', url: `${API_DEPOSITS}/${depositId}` },
      { method: 'delete', url: `${API_DEPOSITS}/${depositId}` },
      { method: 'patch', url: `${API_DEPOSITS}/${depositId}/mark-paid` },
      { method: 'patch', url: `${API_DEPOSITS}/${depositId}/mark-unpaid` },
      { method: 'patch', url: `${API_DEPOSITS}/${depositId}/cancel` },
      { method: 'get', url: `${API_RESERVATIONS}/${reservationId}/deposits` },
      { method: 'post', url: `${API_RESERVATIONS}/${reservationId}/deposits` },
    ];

    for (const ep of endpoints) {
      const res = await (request(app) as any)[ep.method](ep.url);
      expect(res.status).toBe(401);
    }
  });
});
