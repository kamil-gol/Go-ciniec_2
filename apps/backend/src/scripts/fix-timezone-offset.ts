/**
 * fix-timezone-offset.ts
 *
 * ONE-TIME migration: shifts startDateTime/endDateTime by -1h
 * for all Reservation rows created before the frontend timezone fix.
 *
 * Background:
 *   Before commit 48cad856 (2026-03-06T20:29:43Z), create-reservation-form
 *   sent ISO strings without a UTC offset, so Node/Postgres stored them
 *   as UTC+0 — 1 hour ahead of the intended Warsaw (UTC+1) time.
 *   e.g. user entered 14:00 → stored as 14:00 UTC = 15:00 Warsaw.
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

  // Find all affected records
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
    'start (Warsaw BEFORE)'.padEnd(22),
    'start (Warsaw AFTER)'.padEnd(22),
    'end (Warsaw BEFORE)'.padEnd(22),
    'end (Warsaw AFTER)'
  )
  console.log('-'.repeat(130))

  for (const r of affected) {
    const startBefore = r.startDateTime
    const endBefore = r.endDateTime
    const startAfter = startBefore ? new Date(startBefore.getTime() - 60 * 60 * 1000) : null
    const endAfter = endBefore ? new Date(endBefore.getTime() - 60 * 60 * 1000) : null

    console.log(
      r.id.padEnd(38),
      toWarsaw(startBefore).padEnd(22),
      toWarsaw(startAfter).padEnd(22),
      toWarsaw(endBefore).padEnd(22),
      toWarsaw(endAfter)
    )
  }

  console.log('')

  if (DRY_RUN) {
    console.log('DRY RUN complete — no changes made.')
    console.log('To apply: make fix-timezone   (or DRY_RUN=false npx tsx ...)')
    await prisma.$disconnect()
    return
  }

  // LIVE: run in a transaction
  console.log('Starting transaction...')

  await prisma.$transaction(async (tx) => {
    let updated = 0

    for (const r of affected) {
      const newStart = r.startDateTime
        ? new Date(r.startDateTime.getTime() - 60 * 60 * 1000)
        : undefined
      const newEnd = r.endDateTime
        ? new Date(r.endDateTime.getTime() - 60 * 60 * 1000)
        : undefined

      await tx.reservation.update({
        where: { id: r.id },
        data: {
          ...(newStart !== undefined && { startDateTime: newStart }),
          ...(newEnd !== undefined && { endDateTime: newEnd }),
        },
      })

      updated++
    }

    console.log(`Updated ${updated} record(s).`)
  })

  // Verify
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
      'end:', toWarsaw(r.endDateTime)
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
