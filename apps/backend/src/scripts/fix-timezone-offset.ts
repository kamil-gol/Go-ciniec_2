/**
 * fix-timezone-offset.ts
 *
 * ONE-TIME migration: shifts startDateTime/endDateTime by the correct Warsaw
 * UTC offset for each record.
 *
 * Background:
 *   Before commit 48cad856 (2026-03-06T20:29:43Z), create-reservation-form
 *   sent ISO strings without a UTC offset, so Node/Postgres stored them
 *   as UTC+0 — ahead of the intended Warsaw local time.
 *
 *   All 19 affected records fall in April–June 2026 (CEST = UTC+2),
 *   so the required correction is -2h (not -1h as originally assumed).
 *
 * Safe cutoff:
 *   Only records with updatedAt < CUTOFF_UTC are migrated.
 *   Records created/edited after the fix already carry the correct offset.
 *
 * Usage:
 *   DRY_RUN=true  npx tsx src/scripts/fix-timezone-offset.ts   # default
 *   DRY_RUN=false npx tsx src/scripts/fix-timezone-offset.ts   # LIVE
 *
 * Via Makefile:
 *   make fix-timezone-dry
 *   make fix-timezone
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Timestamp of first frontend fix commit (create-reservation-form toLocalISO)
const CUTOFF_UTC = new Date('2026-03-06T20:29:43Z')

const DRY_RUN = process.env.DRY_RUN !== 'false'

// DST boundaries for Europe/Warsaw 2026
// CET  = UTC+1: before 2026-03-29T01:00Z
// CEST = UTC+2: from   2026-03-29T01:00Z onwards (until 2026-10-25T01:00Z)
const CEST_START_2026 = new Date('2026-03-29T01:00:00Z')
const CEST_END_2026   = new Date('2026-10-25T01:00:00Z')

function getWarsawOffsetMs(date: Date): number {
  if (date >= CEST_START_2026 && date < CEST_END_2026) {
    return 2 * 60 * 60 * 1000  // CEST = UTC+2
  }
  return 1 * 60 * 60 * 1000    // CET  = UTC+1
}

function toWarsaw(date: Date | null): string {
  if (!date) return 'NULL'
  return date.toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function main() {
  console.log('===================================================')
  console.log('  Timezone offset fix — Reservation.startDateTime')
  console.log('===================================================')
  console.log(`Mode:    ${DRY_RUN ? 'DRY RUN (no changes)' : '*** LIVE MIGRATION ***'}`)
  console.log(`Cutoff:  ${CUTOFF_UTC.toISOString()} (records updated before this)`)
  console.log('')

  const affected = await prisma.reservation.findMany({
    where: {
      updatedAt: { lt: CUTOFF_UTC },
      startDateTime: { not: null },
    },
    select: {
      id: true,
      startDateTime: true,
      endDateTime: true,
      updatedAt: true,
    },
    orderBy: { startDateTime: 'asc' },
  })

  if (affected.length === 0) {
    console.log('No records need migration. All good!')
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${affected.length} record(s) to migrate:\n`)
  console.log(
    'ID'.padEnd(38),
    'offset'.padEnd(8),
    'start (Warsaw BEFORE)'.padEnd(22),
    'start (Warsaw AFTER)'.padEnd(22),
    'end (Warsaw BEFORE)'.padEnd(22),
    'end (Warsaw AFTER)'
  )
  console.log('-'.repeat(145))

  for (const r of affected) {
    const offsetMs = getWarsawOffsetMs(r.startDateTime!)
    const offsetH  = offsetMs / (60 * 60 * 1000)
    const startBefore = r.startDateTime
    const endBefore   = r.endDateTime
    const startAfter  = startBefore ? new Date(startBefore.getTime() - offsetMs) : null
    const endAfter    = endBefore   ? new Date(endBefore.getTime()   - offsetMs) : null

    console.log(
      r.id.padEnd(38),
      (`-${offsetH}h`).padEnd(8),
      toWarsaw(startBefore).padEnd(22),
      toWarsaw(startAfter).padEnd(22),
      toWarsaw(endBefore).padEnd(22),
      toWarsaw(endAfter)
    )
  }

  console.log('')

  if (DRY_RUN) {
    console.log('DRY RUN complete — no changes made.')
    console.log('To apply: DRY_RUN=false npx tsx src/scripts/fix-timezone-offset.ts')
    await prisma.$disconnect()
    return
  }

  console.log('Starting transaction...')

  await prisma.$transaction(async (tx) => {
    let updated = 0

    for (const r of affected) {
      const offsetMs = getWarsawOffsetMs(r.startDateTime!)
      const newStart = r.startDateTime
        ? new Date(r.startDateTime.getTime() - offsetMs)
        : undefined
      const newEnd = r.endDateTime
        ? new Date(r.endDateTime.getTime() - offsetMs)
        : undefined

      await tx.reservation.update({
        where: { id: r.id },
        data: {
          ...(newStart !== undefined && { startDateTime: newStart }),
          ...(newEnd   !== undefined && { endDateTime:   newEnd   }),
        },
      })

      updated++
    }

    console.log(`Updated ${updated} record(s).`)
  })

  console.log('\nVerification (first 5 migrated records):')
  const verified = await prisma.reservation.findMany({
    where: {
      id: { in: affected.slice(0, 5).map((r) => r.id) },
    },
    select: { id: true, startDateTime: true, endDateTime: true },
    orderBy: { startDateTime: 'asc' },
  })

  for (const r of verified) {
    console.log(
      r.id.slice(0, 8) + '...',
      'start:', toWarsaw(r.startDateTime),
      'end:',   toWarsaw(r.endDateTime)
    )
  }

  console.log('\nMigration complete.')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Migration FAILED:', e)
  await prisma.$disconnect()
  process.exit(1)
})
