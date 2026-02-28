/**
 * One-time migration script: Recalculate totalPrice + priceBeforeDiscount
 * for all active reservations.
 *
 * Run after deploying fix/pricing-recalculation to fix stale pricing data.
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
      status: { in: ['PENDING', 'CONFIRMED'] },
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
    const oldExtras = Number(r.extrasTotalPrice) || 0;
    const oldBeforeDiscount = r.priceBeforeDiscount ? Number(r.priceBeforeDiscount) : null;

    try {
      const result = await recalculateReservationTotal(r.id);

      const changed =
        result.totalPrice !== oldTotal ||
        result.extrasTotal !== oldExtras ||
        (result.discountAmount > 0 && result.priceBeforeDiscount !== oldBeforeDiscount);

      if (changed) {
        console.log(
          `  \u2705 ${clientName} (${r.id.slice(0, 8)}...): ` +
          `total ${oldTotal} \u2192 ${result.totalPrice}` +
          (result.extrasTotal !== oldExtras ? ` | extras ${oldExtras} \u2192 ${result.extrasTotal}` : '') +
          (result.discountAmount > 0 ? ` | beforeDiscount ${oldBeforeDiscount} \u2192 ${result.priceBeforeDiscount}` : '')
        );
        updated++;
      } else {
        unchanged++;
      }
    } catch (err: any) {
      console.error(`  \u274c ${clientName} (${r.id.slice(0, 8)}...): ${err.message}`);
      errors++;
    }
  }

  console.log(`\n[Migration] Done!`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Total:     ${reservations.length}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});
