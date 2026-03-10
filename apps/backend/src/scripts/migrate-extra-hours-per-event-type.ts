/**
 * Migration: Extra Hours Per Event Type
 *
 * Recalculates extraHoursCost + totalPrice for active reservations using
 * per-event-type standardHours & extraHourRate (instead of old global 6h / 500 PLN).
 *
 * DRY-RUN by default — pass --apply to persist changes.
 *
 * Usage:
 *   npx tsx apps/backend/src/scripts/migrate-extra-hours-per-event-type.ts          # dry-run
 *   npx tsx apps/backend/src/scripts/migrate-extra-hours-per-event-type.ts --apply  # persist
 */

import { prisma } from '../lib/prisma';
import {
  computeReservationBasePrice,
  recalculateReservationTotalPrice,
  calculateExtraHoursCost,
  STANDARD_HOURS,
  DEFAULT_EXTRA_HOUR_RATE,
} from '../utils/recalculate-price';

const APPLY = process.argv.includes('--apply');

interface MigrationResult {
  reservationId: string;
  clientName: string;
  eventTypeName: string;
  standardHours: number;
  extraHourRate: number;
  durationHours: number;
  oldExtraHoursCost: number;
  newExtraHoursCost: number;
  oldTotalPrice: number;
  newTotalPrice: number;
  delta: number;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Migration: Extra Hours Per Event Type                      ║');
  console.log(`║  Mode: ${APPLY ? '🔴 APPLY (persisting changes)' : '🟡 DRY-RUN (preview only)  '}             ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Load all event types to show their config
  const eventTypes = await prisma.eventType.findMany({
    select: {
      id: true,
      name: true,
      standardHours: true,
      extraHourRate: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log('Event Type Configuration:');
  console.log('─'.repeat(60));
  for (const et of eventTypes) {
    const stdH = et.standardHours ?? STANDARD_HOURS;
    const rate = et.extraHourRate !== null && et.extraHourRate !== undefined
      ? Number(et.extraHourRate)
      : DEFAULT_EXTRA_HOUR_RATE;
    const isDefault = stdH === STANDARD_HOURS && rate === DEFAULT_EXTRA_HOUR_RATE;
    const isExempt = rate === 0;
    const tag = isExempt ? ' 🟢 EXEMPT' : isDefault ? ' (default)' : ' ⚙️  CUSTOM';
    console.log(`  ${et.name.padEnd(25)} ${stdH}h standard, ${rate} zł/extra h${tag}`);
  }
  console.log();

  // 2. Load active reservations with extra hours data
  const reservations = await prisma.reservation.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'RESERVED'] },
    },
    select: {
      id: true,
      totalPrice: true,
      extraHoursCost: true,
      startDateTime: true,
      endDateTime: true,
      client: { select: { firstName: true, lastName: true } },
      eventType: {
        select: { id: true, name: true, standardHours: true, extraHourRate: true },
      },
    },
    orderBy: { startDateTime: 'asc' },
  });

  console.log(`Found ${reservations.length} active reservations to check.\n`);

  const results: MigrationResult[] = [];
  let skipped = 0;
  let errors = 0;

  for (const r of reservations) {
    const clientName = r.client
      ? `${r.client.firstName} ${r.client.lastName}`
      : 'N/A';
    const etName = r.eventType?.name || 'Brak typu';

    try {
      const oldExtraHoursCost = Number(r.extraHoursCost) || 0;
      const oldTotalPrice = Number(r.totalPrice);

      // Compute new breakdown with per-event-type rates
      const breakdown = await computeReservationBasePrice(r.id);
      const newExtraHoursCost = breakdown.extraHoursCost;
      const newTotalPrice = breakdown.totalPrice;
      const delta = newTotalPrice - oldTotalPrice;

      // Calculate duration for display
      let durationHours = 0;
      if (r.startDateTime && r.endDateTime) {
        const ms = r.endDateTime.getTime() - r.startDateTime.getTime();
        durationHours = Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
      }

      const hasChange = oldExtraHoursCost !== newExtraHoursCost || Math.abs(delta) > 0.01;

      if (!hasChange) {
        skipped++;
        continue;
      }

      results.push({
        reservationId: r.id,
        clientName,
        eventTypeName: etName,
        standardHours: r.eventType?.standardHours ?? STANDARD_HOURS,
        extraHourRate: r.eventType?.extraHourRate !== null && r.eventType?.extraHourRate !== undefined
          ? Number(r.eventType.extraHourRate)
          : DEFAULT_EXTRA_HOUR_RATE,
        durationHours,
        oldExtraHoursCost,
        newExtraHoursCost,
        oldTotalPrice,
        newTotalPrice,
        delta,
      });

      // Persist if --apply
      if (APPLY) {
        await recalculateReservationTotalPrice(r.id);
      }
    } catch (err: any) {
      console.error(`  ✗ ${r.id.slice(0, 8)} (${clientName}): ${err.message}`);
      errors++;
    }
  }

  // 3. Print results grouped by event type
  if (results.length > 0) {
    const grouped = new Map<string, MigrationResult[]>();
    for (const r of results) {
      const key = r.eventTypeName;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }

    for (const [etName, items] of grouped) {
      const sampleRate = items[0];
      console.log(`\n┌─ ${etName} (${sampleRate.standardHours}h standard, ${sampleRate.extraHourRate} zł/h) ──`);

      for (const r of items) {
        const sign = r.delta >= 0 ? '+' : '';
        const emoji = APPLY ? '✓' : '~';
        console.log(
          `  ${emoji} ${r.reservationId.slice(0, 8)} ${r.clientName.padEnd(22)} ` +
          `${r.durationHours}h  ` +
          `extraHours: ${r.oldExtraHoursCost} → ${r.newExtraHoursCost}  ` +
          `total: ${r.oldTotalPrice} → ${r.newTotalPrice} (${sign}${r.delta})`
        );
      }

      const groupDelta = items.reduce((sum, r) => sum + r.delta, 0);
      console.log(`  └─ Subtotal delta: ${groupDelta >= 0 ? '+' : ''}${groupDelta} zł (${items.length} reservations)`);
    }
  }

  // 4. Summary
  const totalDelta = results.reduce((sum, r) => sum + r.delta, 0);

  console.log('\n' + '═'.repeat(60));
  console.log(`  ${APPLY ? '✅ APPLIED' : '🔍 DRY-RUN PREVIEW'}`);
  console.log(`  Changed:   ${results.length}`);
  console.log(`  Unchanged: ${skipped}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Net delta: ${totalDelta >= 0 ? '+' : ''}${totalDelta} zł`);
  console.log('═'.repeat(60));

  if (!APPLY && results.length > 0) {
    console.log('\n💡 To apply changes, run with --apply flag:');
    console.log('   npx tsx apps/backend/src/scripts/migrate-extra-hours-per-event-type.ts --apply\n');
  }
}

main()
  .catch((e) => {
    console.error('[Migration] Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
