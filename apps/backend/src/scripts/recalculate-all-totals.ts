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
import { recalculateReservationTotal } from '../utils/recalculate-total';

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
      const result = await recalculateReservationTotal(r.id);
      const changed = result.totalPrice !== oldTotal;

      if (changed) {
        console.log(
          `  OK ${r.id.slice(0, 8)} (${clientName}): ` +
          `${oldTotal} -> ${result.totalPrice} ` +
          `(base=${result.basePricing} + extras=${result.extrasTotal} + surcharge=${result.venueSurcharge} + hours=${result.extraHoursCost} - discount=${result.discountAmount})`
        );
        updated++;
      } else {
        console.log(`  -- ${r.id.slice(0, 8)} (${clientName}): unchanged (${oldTotal})`);
        unchanged++;
      }
    } catch (err: any) {
      console.error(`  ERR ${r.id.slice(0, 8)} (${clientName}): ${err.message}`);
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
