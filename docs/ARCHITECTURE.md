# 🏭️ Architektura Systemu - Rezerwacje Sal

## Przegląd Architektury

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (React + TypeScript)              │   │
│  │  - Dashboard                                         │   │
│  │  - Rezerwacje                                        │   │
│  │  - Klienci                                           │   │
│  │  - Admin Panel                                       │   │
│  │  - Analytics                                         │   │
│  │  - Dark Mode Support 🆕                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────┬────────────────────────────────────────────┘
                  │ HTTPS/REST API
                  │
┌─────────────────┴────────────────────────────────────────────┐
│                     API LAYER (Backend)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Express.js + TypeScript                             │   │
│  │  ┌────────────┬──────────────┬───────────────────┐  │   │
│  │  │ Auth       │ Reservations │ Clients           │  │   │
│  │  │ Controllers│ Controllers  │ Controllers       │  │   │
│  │  └────────────┴──────────────┴───────────────────┘  │   │
│  │  ┌────────────┬──────────────┬───────────────────┐  │   │
│  │  │ Auth       │ Reservation  │ Client            │  │   │
│  │  │ Services   │ Services     │ Services          │  │   │
│  │  ├────────────┤              ├───────────────────┤  │   │
│  │  │ Validation │ Price        │ Email             │  │   │
│  │  │ Middleware │ Calculator   │ Service           │  │   │
│  │  │ JWT Auth   │ PDF Generator│ Backup Service    │  │   │
│  │  │            │ Attachments  │ Attachment Srv    │  │   │
│  │  └────────────┴──────────────┴───────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────┬────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │         │         │
        ▼         ▼         ▼
    ┌───────┐ ┌──────┐ ┌───────┐
    │  DB   │ │Redis │ │ Email │
    │  PG   │ │Cache │ │Queue  │
    └───────┘ └──────┘ └───────┘
```

## Dark Mode Architecture 🆕 (Sprint 10B Phase 1)

### Theme Stack
```
┌─────────────────────────────────────┐
│ next-themes ThemeProvider           │
│ - zarządza .dark class na <html>   │
│ - localStorage persistence          │
│ - SSR hydration mismatch guard      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ CSS Variables (globals.css)         │
│ :root { --background, --card, ...}  │
│ .dark { --background, --card, ...}  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Tailwind dark: classes               │
│ bg-white dark:bg-neutral-800        │
│ text-gray-900 dark:text-neutral-100 │
└─────────────────────────────────────┘
```

**CSS Variables (globals.css)**
- Semantic: `--background`, `--foreground`, `--card`, `--primary`, `--border`, `--input`, `--ring`
- Status (🆕): `--success`, `--warning`, `--info`, `--error`
- Sidebar (🆕): `--sidebar-background`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-accent`
- Charts (🆕): `--chart-1` ... `--chart-5`

**Files Changed:**
- `apps/frontend/package.json` — +`next-themes@^0.4.4`
- `apps/frontend/app/providers.tsx` — ThemeProvider wrapper
- `apps/frontend/app/globals.css` — CSS variables + fix dark card (7% lightness)
- `apps/frontend/components/layout/Header.tsx` — `useTheme()` toggle

**Merged**: PR #84, 17.02.2026

---

**Last Updated**: 17.02.2026, 21:00 CET
