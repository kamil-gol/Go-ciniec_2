# Prompt: Senior UI/UX Audit — Ujednolicenie wizualne systemu rezerwacji

## Rola
Jesteś Senior UI/UX Architektem i Lead Frontend Developerem. Przeprowadź kompletną unifikację wizualną systemu na podstawie poniższego audytu i planu. Działaj autonomicznie — implementuj zmiany, pushuj, twórz PR, uruchamiaj testy. Nie pytaj o potwierdzenie dla poszczególnych kroków.

## Kontekst projektu
- Next.js 16 + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- Design tokens: `apps/frontend/lib/design-tokens.ts` (moduleAccents)
- Shared components: `components/shared/` (GradientCard, StatCard, PageHero, DetailHero, SectionCard)
- Testy: Vitest (frontend), Jest (backend), Docker (`docker-compose.test.yml`)
- CI: GitHub Actions, `All Tests Required` gate
- VPS path: `/home/kamil/rezerwacje`, deploy przez Docker

## Wzorzec referencyjny (TARGET)

Każda karta informacyjna w systemie powinna wyglądać tak:

```tsx
<Card className="border-0 shadow-xl overflow-hidden">
  <div className="bg-gradient-to-br {headerGradient} p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-gradient-to-br {iconGradient} rounded-lg shadow-lg">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
    {/* Pola danych w stat cards: */}
    <div className="space-y-3">
      <div className="p-3 bg-white dark:bg-black/20 rounded-lg">
        <p className="text-sm text-muted-foreground">Label</p>
        <p className="text-lg font-semibold">Value</p>
      </div>
    </div>
  </div>
</Card>
```

Lub użyj `<GradientCard>` z `components/shared/GradientCard.tsx`.

## Wyniki audytu — co jest OK ✅

| Moduł | Status | Uwagi |
|-------|--------|-------|
| Rezerwacje (lista) | ✅ | ReservationCard z gradient subtle, StatCards, PageHero |
| Rezerwacje (szczegóły) | ✅ | DetailHero, EditableCards z gradientHeader, stat cards (bg-white rounded-lg) |
| Klienci (lista) | ✅ | PageHero, StatCards |
| Klienci (szczegóły) | ✅ | GradientCard dla CompanyInfo/ContactInfo z bg-white stat cards |
| Depozyty | ✅ | PageHero, StatCards, FilterTabs |
| Kolejka | ✅ | PageHero, StatCards, DraggableList |
| Ustawienia | ✅ | PageHero, Tabs |
| Raporty | ✅ | PageHero, dynamic tabs |
| Usługi dodatkowe | ✅ | PageHero, StatCards |
| Powiadomienia | ✅ | PageHero, FilterTabs |
| Archiwum | ✅ | PageHero, StatCards |
| Dziennik audytu | ✅ | PageHero, StatCards |
| Sale (lista) | ✅ | PageHero |
| Typy wydarzeń (lista) | ✅ | PageHero |

## Co wymaga naprawy ⚠️

### 1. Sale — szczegóły (`halls/[id]/page.tsx`)
**Problem**: Karty "Opis" i "Udogodnienia" używają gradient header ale **pola danych nie mają stat cards** (bg-white rounded-lg). Karta kalendarza ma inny wzorzec (pełny gradient z białym tekstem).
**Fix**: Dodać `p-3 bg-white dark:bg-black/20 rounded-lg` do pól danych w kartach Opis i Udogodnienia.

### 2. Typy wydarzeń — szczegóły (`event-types/[id]/page.tsx`)
**Problem**: Karty "Informacje", "Czas & dodatkowe godziny", "Powiązania" mają gradient header ale **wewnętrzne sekcje (divide-y pattern) nie są w stat cards**.
**Fix**: Zamienić `divide-y` na `space-y-3` z `p-3 bg-white dark:bg-black/20 rounded-lg` na każdym polu.

### 3. Menu — szczegóły pakietu (`menu/packages/[id]/page.tsx`)
**Problem**: Brak DetailHero — używa prostego `<h1>`. Jedyna strona szczegółów bez premium hero.
**Fix**: Dodać DetailHero z gradient `from-amber-600 via-orange-600 to-yellow-600` (kulinarny).

### 4. Catering — szczegóły zamówienia (`catering/orders/[id]/page.tsx`)
**Problem**: Używa custom OrderHeader zamiast DetailHero. Sprawdzić czy OrderFinancials, OrderItems mają spójne karty.
**Fix**: Jeśli OrderHeader jest niespójny z DetailHero — zastąpić. Ujednolicić karty wewnętrzne.

### 5. Klienci — karta Notatki (`clients/[id]/page.tsx`)
**Problem**: GradientCard ale treść notatek nie jest w stat card (bg-white rounded-lg).
**Fix**: Opakować treść notatek w `p-3 bg-white dark:bg-black/20 rounded-lg`.

### 6. Podsumowanie finansowe — zbyt wiele kolorów
**Problem**: Sekcja "Razem do zapłaty" (emerald), "Pozostało do zapłaty" (red), "Stan rozliczeń" (bg-white), progress bar (emerald+amber) — za dużo kontrastujących kolorów w jednym miejscu.
**Fix**: Uprościć paletę — użyć emerald jako accent dla całej sekcji finansowej, red tylko na "Pozostało". Usunąć gradient z "Razem do zapłaty" bar — zamiast tego użyć spójnego stat card pattern.

### 7. EditableCard — wariant non-gradient nadal istnieje
**Problem**: EditableNotesCard i EditableInternalNotesCard mają gradientHeader, ale `EditableCard.tsx` wciąż ma branch bez gradientu (linie 190-231 z CardHeader/border-b).
**Fix**: Zweryfikować czy ten branch jest jeszcze używany. Jeśli nie — usunąć. Jeśli tak — dodać gradientHeader do pozostałych konsumentów.

### 8. Attachment panel — niespójny icon badge
**Problem**: Attachment panel ma gradient icon badge ale title to `h2 text-xl font-bold` bez `text-white` na ikonie (ikona jest wewnątrz gradient pill ale wrapper div nie jest spójny z GradientCard).
**Fix**: Zweryfikować spójność z GradientCard pattern.

## Zasady implementacji

1. **Nie zmieniaj logiki biznesowej** — tylko CSS/klasy/JSX structure
2. **Dark mode**: zawsze `dark:from-X-950/30` dla gradientów
3. **Stat cards**: `p-3 bg-white dark:bg-black/20 rounded-lg` na KAŻDYM polu danych
4. **space-y-3** (nie space-y-4) dla listy stat cards
5. **Gradient header**: `bg-gradient-to-br` (nie `bg-gradient-to-r`) dla kart
6. **Icon badge**: `p-2 bg-gradient-to-br {gradient} rounded-lg shadow-lg`
7. **Title**: `text-xl font-bold`
8. **Card wrapper**: `border-0 shadow-xl overflow-hidden`
9. Preferuj `<GradientCard>` z `components/shared/GradientCard.tsx` gdzie to możliwe
10. **Testuj** — `make test-frontend` po zmianach, napraw broken testy

## Kolejność prac

1. Halls [id] — stat cards w polach danych
2. Event types [id] — stat cards zamiast divide-y
3. Menu packages [id] — DetailHero
4. Clients [id] — stat cards w Notatki
5. Catering orders [id] — audit + fix
6. Podsumowanie finansowe — uproszczenie kolorów
7. Cleanup: EditableCard non-gradient branch, attachment panel
8. Testy + PR

## Pliki do zmiany (szacunkowo)

```
app/dashboard/halls/[id]/page.tsx
app/dashboard/event-types/[id]/page.tsx
app/dashboard/menu/packages/[id]/page.tsx
app/dashboard/clients/[id]/page.tsx
app/dashboard/catering/orders/[id]/page.tsx (+ komponenty)
components/reservations/financial/TotalsSummary.tsx
components/reservations/editable/EditableCard.tsx (cleanup)
components/attachments/attachment-panel.tsx (weryfikacja)
```

## Branch i workflow

```bash
git checkout main && git pull
git checkout -b claude/ui-audit-unification
# ... implementacja ...
git push origin claude/ui-audit-unification
gh pr create --title "fix(ux): pełna unifikacja wizualna — stat cards + spójność kart" --base main
# Czekaj na CI → merge
```
