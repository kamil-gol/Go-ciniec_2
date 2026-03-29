jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    reservationHistory: {
      create: jest.fn(),
    },
  },
}));

import prisma from '../../../lib/prisma';
import { createHistoryEntry } from '../../../services/reservation-history.helper';

const mockCreate = prisma.reservationHistory.create as jest.Mock;

describe('createHistoryEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a history entry with all fields', async () => {
    mockCreate.mockResolvedValue({ id: 'hist-001' });

    await createHistoryEntry(
      'res-001',
      'user-001',
      'UPDATE',
      'adults',
      '50',
      '60',
      'Zmiana liczby gości'
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reservationId: 'res-001',
        userId: 'user-001',
        changeType: 'UPDATE',
        fieldName: 'adults',
        oldValue: '50',
        newValue: '60',
        reason: 'Zmiana liczby gości',
      }),
    });
  });

  it('should handle null fieldName and values', async () => {
    mockCreate.mockResolvedValue({ id: 'hist-002' });

    await createHistoryEntry(
      'res-001',
      'user-001',
      'CREATE',
      null,
      null,
      null,
      'Nowa rezerwacja'
    );

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fieldName: null,
        oldValue: null,
        newValue: null,
      }),
    });
  });

  it('should pass correct reservationId', async () => {
    mockCreate.mockResolvedValue({ id: 'hist-003' });

    await createHistoryEntry('res-xyz', 'user-001', 'DELETE', null, null, null, 'Usunięto');

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reservationId: 'res-xyz',
      }),
    });
  });
});
