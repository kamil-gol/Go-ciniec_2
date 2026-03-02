/**
 * One-time migration script: Recalculate totalPrice + extraHoursCost + priceBeforeDiscount
 * for all active reservations.
 *
 * Run after deploying fix/pricing-and-encoding to fix stale pricing data.
 *
 * Usage:
 *   npx tsx apps/backend/src/scripts/recalculate-all-totals.ts
 */

import { prisma } from '../lib/prisma';
import { computeReservationBasePrice, recalculateReservationTotalPrice } from '../utils/recalculate-price';

async function main() {
  console.log('[Migration] Starting recalculation of all active reservations...\n');

  const reservations = await prisma.reservation.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'RESERVED'] },
    },
    select: {
      id: true,
      totalPrice: true,
      extrasTotalPrice: true,
      priceBeforeDiscount: true,
      discountAmount: true,
      startDateTime: true,
      endDateTime: true,
      client: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`[Migration] Found ${reservations.length} active reservations to recalculate.\n`);

  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (const r of reservations) {
    const clientName = r.client
      ? `${r.client.firstName} ${r.client.lastName}`
      : 'N/A';
    const oldTotal = Number(r.totalPrice);

    try {
      const breakdown = await computeReservationBasePrice(r.id);
      const changed = breakdown.totalPrice !== oldTotal;

      if (changed) {
        await recalculateReservationTotalPrice(r.id);
        console.log(
          `  ✓ ${r.id.slice(0, 8)} (${clientName}): ` +
          `${oldTotal} → ${breakdown.totalPrice} ` +
          `(menu=${breakdown.menuPrice} + extras=${breakdown.extrasTotal} + surcharge=${breakdown.surcharge} + hours=${breakdown.extraHoursCost} - discount=${breakdown.discountAmount})`
        );
        updated++;
      } else {
        console.log(`  — ${r.id.slice(0, 8)} (${clientName}): unchanged (${oldTotal})`);
        unchanged++;
      }
    } catch (err: any) {
      console.error(`  ✗ ${r.id.slice(0, 8)} (${clientName}): ${err.message}`);
      errors++;
    }
  }

  console.log('\n[Migration] Complete!');
  console.log(`  Updated:   ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Errors:    ${errors}`);
}

main()
  .catch((e) => {
    console.error('[Migration] Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
