# Prompt: Atomowy Audyt UI/UX v6 — Premium Visual Overhaul

> **Model docelowy:** Claude Opus 4.6 (1M context)
> **Narzedzie:** Claude Code w VS Code (analiza kodu + generowanie zmian) + Claude Chrome (wizualna weryfikacja na dev.gosciniec.online)
> **Workflow:** Kazda faza = osobna sesja Claude Code → branch → PR → merge → weryfikacja Chrome

---

## Kontekst systemu

System zarzadzania rezerwacjami i cateringiem "Gosciniec" — Next.js 16 + React 19 + Tailwind CSS 3.4 + Radix UI + Framer Motion.

### Architektura modularow

| Grupa | Kolor | Moduly |
|-------|-------|--------|
| CORE/OPERATIONS | Warm Navy `#1e3a5f` | Dashboard, Widok Dzienny, Rezerwacje, Klienci, Kolejka, Powiadomienia |
| FINANCE | Teal-Emerald `#1a4a4a` | Zaliczki, Raporty |
| CONFIGURATION | Slate-Steel `#374151` | Ustawienia, Sale, Typy Wydarzen, Dziennik Audytu, Archiwum, Szablony Dokumentow |
| CULINARY | Amber-Gold `#7c4a15` | Catering, Menu, Uslugi Dodatkowe |

### Wspoldzielone komponenty (design system)
- `PageHero` — hero section na stronach listowych (uzyty wszedzie, spojny)
- `DetailHero` — hero section na stronach szczegolow (NIE uzyty w: Catering Orders, Event Types)
- `SectionCard` — karta sekcji z ikona i tytulem
- `GradientCard` — karta z gradientowym naglowkiem
- `StatCard` — karta KPI/statystyk
- `EditableCard` — karta z trybem edycji (tylko modul Rezerwacji)
- `FormSection` — grupowanie formularzy
- `StatusBadge`, `EmptyState`, `LoadingState`, `ErrorState`, `Pagination`, `FilterTabs`, `Breadcrumb`

### Znane niespojnosci (stan wyjsciowy)
1. **Detail heroes** — Catering orders i Event Types uzywaja wlasnych implementacji zamiast `DetailHero`
2. **Karty** — SectionCard vs GradientCard vs EditableCard — 3 rozne wzorce na roznych stronach
3. **Formularze** — kazdy modul ma wlasna implementacje (brak wspolnego frameworka)
4. **Podsumowania finansowe** — Rezerwacje vs Catering — kompletnie rozne layouty
5. **Listy/tabele** — kazdy modul implementuje wlasne UI tabel
6. **Strony szczegolow** — drastyczne roznice w ukladzie, spacingu, sekcjach miedzy modulami

---

## Cel audytu

Przeprowadzic **atomowa analize** kazdego elementu UI/UX w kazdym module systemu, a nastepnie:
1. Stworzyc **pelna mape niespojnosci** (co, gdzie, jak wyglada)
2. Porownac wzajemnie moduly (cross-module comparison)
3. Wylaczyc najlepsze wzorce (reference implementations)
4. Przygotowac **plan implementacji premium-grade UI** — spojny, piekny, Silicon Valley quality

---

## Fazy audytu

### FAZA 0: Fundament Design System
**Cel:** Analiza i dokumentacja obecnych design tokens, wspoldzielonych komponentow, wzorcow.

Przeanalizuj:
- [ ] `tailwind.config.ts` — paleta kolorow, cienie, animacje, gradienty
- [ ] `globals.css` — CSS variables, light/dark mode
- [ ] `design-tokens.ts` — ModuleAccent, 4 grupy modulow
- [ ] `status-colors.ts` — mapowanie kolorow statusow
- [ ] Wszystkie komponenty w `components/shared/` — API, wizualy, uzycie
- [ ] Wszystkie komponenty w `components/ui/` — shadcn/radix primitives
- [ ] Typografia — fonty, rozmiary, hierarchia
- [ ] Spacing system — paddingi, marginesy, gapy (czy sa spojne?)
- [ ] Border radius — spojnosc
- [ ] Elevation/shadow system — poziomy cieni
- [ ] Ikony — czy uzycie Lucide jest spojne
- [ ] Animacje — Framer Motion patterns, transitions
- [ ] Responsive breakpoints — mobile/tablet/desktop

**Output:** Raport o stanie design system + lista co jest spojne, a co nie.

---

### FAZA 1: Dashboard + Widok Dzienny
**Sciezki:** `/dashboard`, `/dashboard/daily-view`

Przeanalizuj na kazdej stronie:
- [ ] Hero section — uzycie PageHero, gradienty, spacing
- [ ] Siatka KPI/statystyk — StatCard, layout, responsywnosc
- [ ] Karty/sekcje — typy kart, cienie, border-radius, paddingi
- [ ] Typografia — rozmiary nagfowkow, etykiet, wartosci
- [ ] Kolory — zgodnosc z design tokens grupy CORE/OPERATIONS
- [ ] Interakcje — hover effects, transitions, animacje
- [ ] Empty states — jak wygladaja puste widoki
- [ ] Loading states — skeletony, spinnery
- [ ] Responsywnosc — mobile, tablet, desktop
- [ ] Dark mode — czy wsparcie jest kompletne

---

### FAZA 2: Modul Rezerwacji — Lista + Kalendarz
**Sciezki:** `/dashboard/reservations`, `/dashboard/reservations/list`, `/dashboard/reservations/calendar`

Przeanalizuj:
- [ ] Hub page — layout, nawigacja do list/calendar
- [ ] Lista rezerwacji — tabela/karty, filtry, sortowanie, paginacja
- [ ] Kalendarz — wyglad, interakcje, nawigacja dat
- [ ] FilterTabs — spojnosc z innymi modulami
- [ ] StatCard grid — layout, metryki
- [ ] Karty rezerwacji w liscie — struktura, informacje, akcje
- [ ] Status badges — kolory, ikony, zgodnosc z `status-colors.ts`
- [ ] Pusta lista — EmptyState design
- [ ] Responsywnosc
- [ ] Animacje wejscia/wyjscia

---

### FAZA 3: Modul Rezerwacji — Szczegoly
**Sciezka:** `/dashboard/reservations/[id]`

**TO JEST KLUCZOWA STRONA — porownaj z Catering order details**

Przeanalizuj:
- [ ] Detail hero — uzycie komponentu, gradient, ikona, tytul, badges, akcje
- [ ] Stepper/timeline — jak wyglada postep rezerwacji
- [ ] Zakladki (Szczegoly / Historia) — TabNav design
- [ ] Sekcja Klient — layout, dane, ikony
- [ ] Sekcja Sala — EditableCard, tryb edycji, wizual
- [ ] Sekcja Szczegoly Wydarzenia — EditableCard
- [ ] Sekcja Menu — MenuSummary, wyswietlanie dan, kategorii
- [ ] Sekcja Uslugi Dodatkowe — lista, liczniki, ceny
- [ ] Sekcja Notatki — textarea, inline editing
- [ ] Sekcja Notatka Wewnetrzna — wizualne odroznienie
- [ ] Podsumowanie Finansowe (sidebar) — PriceBreakdown, TotalsSummary, DepositSummary
- [ ] Panel Gosci (sidebar) — formularze liczb
- [ ] Panel Zaliczek (sidebar) — lista, statusy, dodawanie
- [ ] Szybkie Akcje — przyciski, ikony
- [ ] Zalaczniki — panel, upload, preview
- [ ] Ogolny layout — kolumny, spacing, scroll behavior
- [ ] Mobile layout — responsywnosc sidebara

---

### FAZA 4: Modul Rezerwacji — Formularz tworzenia
**Sciezka:** `/dashboard/reservations/new`

Przeanalizuj:
- [ ] Stepper/wizard — kroki, nawigacja, walidacja
- [ ] Kazdy krok formularza osobno:
  - Klient — pola, walidacja, autocomplete
  - Wydarzenie — typ, data, czas
  - Sala — wybor sali, dostepnosc
  - Goscie — liczby, kategorie
  - Menu — MenuSelectionFlow, DishSelector
  - Podsumowanie — przeglad przed zapisem
- [ ] Pola formularzy — inputy, selecty, datepickery, timepickery
- [ ] Walidacja — bledy inline, komunikaty
- [ ] Layout formularza — spacing, grupowanie pol
- [ ] Responsywnosc formularza

---

### FAZA 5: Modul Catering — Lista zamowien
**Sciezka:** `/dashboard/catering/orders`

Przeanalizuj:
- [ ] PageHero — gradienty CULINARY, ikony
- [ ] StatCard grid — metryki cateringowe
- [ ] Tabela zamowien — kolumny, formatowanie, akcje
- [ ] Filtry i sortowanie — spojnosc z Rezerwacjami
- [ ] Status badges — porownaj z Rezerwacjami
- [ ] Paginacja — spojnosc
- [ ] Empty state
- [ ] Responsywnosc

---

### FAZA 6: Modul Catering — Szczegoly zamowienia
**Sciezka:** `/dashboard/catering/orders/[id]`

**POROWNAJ Z FAZA 3 (Rezerwacje details) — TO JEST GLOWNA NIESPOJNOSC**

Przeanalizuj:
- [ ] OrderHeader — CUSTOM hero (nie uzywa DetailHero!) — porownaj z ReservationHero
- [ ] Stat pills pod naglowkiem — layout, dane
- [ ] Breadcrumb — spojnosc
- [ ] Sekcja Szczegoly Cateringu — SectionCard, layout
- [ ] Sekcja Dania — tabela, ilosc, ceny, sumy
- [ ] Sekcja Uslugi Dodatkowe — tabela, porownaj z Rezerwacjami
- [ ] Sekcja Logistyka — adres, data, godzina
- [ ] Panel Klient (sidebar) — porownaj z sekcja klienta w Rezerwacjach
- [ ] Panel Rozliczenie (sidebar) — porownaj z FinancialSummary w Rezerwacjach
- [ ] Historia Zmian — porownaj z ReservationHistory
- [ ] Ogolny layout — porownaj uklad kolumn z Rezerwacjami
- [ ] Spacing, paddingi — porownaj dokladnie
- [ ] Cienie, border-radius — porownaj
- [ ] Animacje — czy sa obecne (Framer Motion)?

---

### FAZA 7: Modul Catering — Formularze (tworzenie + edycja)
**Sciezki:** `/dashboard/catering/orders/new`, `/dashboard/catering/orders/[id]/edit`

Przeanalizuj:
- [ ] Formularz tworzenia — kroki, layout, pola
- [ ] Formularz edycji — sekcje (EditContactSection, EditDeliverySection, etc.)
- [ ] Porownaj z formularzem tworzenia rezerwacji — spojnosc wzorcow
- [ ] Pola formularzy — czy uzywaja tych samych komponentow co Rezerwacje
- [ ] Walidacja — spojnosc komunikatow
- [ ] Layout — porownaj spacing, grupowanie

---

### FAZA 8: Modul Menu (4 podstrony)
**Sciezki:** `/dashboard/menu/dishes`, `/menu/categories`, `/menu/courses`, `/menu/packages/*`, `/menu/templates/*`

Przeanalizuj kazda podstrone:
- [ ] PageHero — gradienty CULINARY
- [ ] Listy/gridy elementow — karty, tabele
- [ ] Dialogi tworzenia/edycji — CreateDishDialog, CreatePackageDialog, EditPackageDialog
- [ ] Formularz pakietow — PackageForm, PackageCard
- [ ] MenuCard — design, hover, informacje
- [ ] DishSelector — UI wyboru dan
- [ ] Porownaj wzorce list/kart z innymi modulami
- [ ] Responsywnosc

---

### FAZA 9: Modul Klienci
**Sciezki:** `/dashboard/clients`, `/dashboard/clients/[id]`, `/dashboard/clients/[id]/edit`

Przeanalizuj:
- [ ] Lista klientow — tabela/karty, filtry
- [ ] Karta klienta — client-card.tsx design
- [ ] Strona szczegolow klienta — ClientHeroSection, ClientInfoCards, ClientStats
- [ ] Porownaj detail page z Rezerwacjami i Cateringiem
- [ ] Formularz edycji — porownaj z innymi formularzami
- [ ] Kontakty — contacts-manager UI

---

### FAZA 10: Modul Sale + Typy Wydarzen
**Sciezki:** `/dashboard/halls/*`, `/dashboard/event-types/*`

Przeanalizuj:
- [ ] Hall list — HallCard grid design
- [ ] Hall details — uzycie DetailHero, sekcje, kalendarz rezerwacji
- [ ] Hall form — tworzenie/edycja
- [ ] Event types list — EventTypeCard design
- [ ] Event type details — CUSTOM hero (nie uzywa DetailHero!)
- [ ] Event type form — dialog
- [ ] Porownaj karty z kartami w innych modulach

---

### FAZA 11: Modul Zaliczki + Kolejka
**Sciezki:** `/dashboard/deposits`, `/dashboard/queue`

Przeanalizuj:
- [ ] Deposits list — tabela, statusy, akcje
- [ ] Deposit status badges — porownaj z innymi modulami
- [ ] Deposit forms — create, update status
- [ ] Queue list — drag-and-drop UI
- [ ] Queue cards — QueueItemCard design
- [ ] Queue forms — add, edit, promote
- [ ] Porownaj oba moduly z reszta systemu

---

### FAZA 12: Modul Ustawienia + Dziennik Audytu + Szablony Dokumentow + Archiwum
**Sciezki:** `/dashboard/settings`, `/dashboard/audit-log`, `/dashboard/document-templates`, `/dashboard/archive`

Przeanalizuj:
- [ ] Settings tabs — CompanyTab, UsersTab, RolesTab, ArchiveTab
- [ ] Settings forms — dialogi, pola, walidacja
- [ ] Audit log — tabela, filtry, szczegoly, timeline
- [ ] Document templates — edytor, historia wersji
- [ ] Archive — lista, przywracanie
- [ ] Porownaj layouty z innymi modulami

---

### FAZA 13: Nawigacja + Layout globalny
**Komponenty:** `Sidebar.tsx`, `Header.tsx`, `DashboardLayout.tsx`

Przeanalizuj:
- [ ] Sidebar — struktura menu, grupy, ikony, aktywne stany, hover, collapse
- [ ] Header — globalne akcje, wyszukiwanie (GlobalSearch), powiadomienia, profil
- [ ] Breadcrumb — spojnosc na wszystkich stronach
- [ ] Layout grid — proporcje sidebar/content, max-width
- [ ] Scroll behavior — sticky elements, overflow
- [ ] Transitions — animacje nawigacji miedzy stronami
- [ ] Mobile navigation — hamburger, drawer
- [ ] Dark mode toggle

---

### FAZA 14: Cross-module comparison + Raport koncowy

Po zakonczeniu faz 0-13, przygotuj:

#### A. Mapa niespojnosci
Tabela: `Element | Modul A (jak wyglada) | Modul B (jak wyglada) | ... | Rekomendacja`

Elementy do porownania:
- Detail page heroes
- Section cards
- Financial summaries
- Forms (create/edit)
- Tables/lists
- Status badges
- Empty states
- Loading states
- Spacing/padding
- Border radius
- Shadows/elevation
- Typography hierarchy
- Color usage
- Animations
- Mobile layouts

#### B. Reference implementations
Wskazanie najlepszych wzorcow (np. "Catering order details jest wzorcem dla wszystkich detail pages")

#### C. Design System Gaps
Co brakuje w design system:
- Brakujace shared components
- Brakujace design tokens
- Brakujace wzorce (patterns)

#### D. Plan implementacji Premium UI
Krok-po-kroku plan ujednolicenia:

1. **Design System Foundation** — rozbudowa tokenow, nowe shared components
2. **Component Unification** — migracja custom implementations na shared components
3. **Layout Standardization** — jednolity grid, spacing, proporcje na wszystkich stronach
4. **Premium Polish** — gradienty, animacje, micro-interactions, glass effects
5. **Responsive Excellence** — mobile-first redesign
6. **Dark Mode Perfection** — pelne wsparcie na kazdej stronie

---

## Instrukcje wykonania

### Narzedzia
- **Claude Code (VS Code)** — analiza kodu, tworzenie zmian, generowanie PR
- **Claude Chrome** — wizualna weryfikacja na `dev.gosciniec.online` (screenshoty, inspekcja)
- **GitHub Issues** — rejestracja zadan z audytu

### Workflow kazdej fazy
1. **Analiza kodu** (Claude Code) — przeczytaj kazdy plik zwiazany z faza
2. **Wizualna weryfikacja** (Claude Chrome) — sprawdz jak wyglada na dev
3. **Dokumentacja** — zapisz findings w issue
4. **Porownanie** — porownaj z innymi modulami (cross-reference)

### Zasady
- **Nie robimy zmian w tej sesji** — tylko analiza i rejestracja zadan
- **Kazda faza = osobna sesja** = osobna galaz = osobny PR
- **Nie budujemy lokalnie** — zmiany weryfikujemy na VPS (dev.gosciniec.online)
- **Screenshoty** — dolaczaj do issues jako dowody niespojnosci
- **Atomowosc** — kazdy finding = osobny punkt w issue

### Format issue w GitHub

```markdown
## [Faza X] Audyt UI/UX — Nazwa modulu

### Cel
Opis co jest analizowane

### Findings

#### 1. [Element] — [Problem]
**Obecny stan:** Opis + screenshot
**Porownanie:** Jak to wyglada w module X vs Y
**Rekomendacja:** Co zrobic

#### 2. ...

### Podsumowanie
- X niespojnosci znalezionych
- Y wymaga zmian
- Z jest juz zgodne z design system

### Tasks (checklist)
- [ ] Task 1
- [ ] Task 2
```

---

## Komendy VPS po zmianach

```bash
# Na serwerze 62.171.189.172
cd /home/kamil/rezerwacje
git pull origin <branch>
make dev-build    # przebuduj dev
make logs         # sprawdz logi
```

### Testowanie
```bash
make test-frontend    # testy komponentow
make test-all         # wszystkie testy
```
