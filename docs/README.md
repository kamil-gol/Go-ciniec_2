# 📚 Dokumentacja Systemu Rezerwacji

## 👋 Witamy w dokumentacji!

Ten folder zawiera pełną dokumentację systemu zarządzania rezerwacjami sal weselnych i okolicznościowych.

---

## 📂 Struktura dokumentacji

```
docs/
├── requirements/          # Wymagania funkcjonalne
│   └── reservations-module-requirements.md
├── testing/              # Plany testów
│   └── e2e-test-plan.md
├── api/                  # Dokumentacja API (TODO)
└── database/             # Schemat bazy danych (TODO)
```

---

## 📖 Wymagania Funkcjonalne

### [Moduł Rezerwacji](requirements/reservations-module-requirements.md)
**Status:** ✅ Aktualny | **Ostatnia aktualizacja:** 07.02.2026

Kompletna specyfikacja wymagani funkcjonalnych dla modułu rezerwacji, zawierająca:

- **Model danych** - wszystkie encje, pola, typy, relacje
- **Funkcjonalności** - szczegółowy opis 60+ wymagań
- **Walidacje** - reguły walidacji dla wszystkich pól
- **Reguły biznesowe** - logika cenowa, statusy, uprawnienia
- **Interfejs użytkownika** - wytyczne UI/UX
- **Historia zmian** - changelog funkcjonalności

**Kluczowe funkcjonalności:**
- ✨ Tworzenie i edycja rezerwacji
- 👥 Podział gości na dorosłych/dzieci
- 💰 Automatyczne kalkulacje cenowe
- ⏰ Obsługa dodatkowych godzin
- 📝 Historia zmian z auditingiem
- 🔒 Blokada zmiany klienta po utworzeniu
- ✅ Email opcjonalny dla klientów

[🔗 Czytaj więcej](requirements/reservations-module-requirements.md)

---

## 🧪 Testy

### [Plan Testów E2E - Moduł Rezerwacje](testing/e2e-test-plan.md)
**Status:** 🚧 Do implementacji | **Ostatnia aktualizacja:** 07.02.2026

Kompletny plan testów end-to-end z wykorzystaniem Playwright:

- **18 scenariuszy testowych** pokrywających wszystkie flows
- **Setup** - konfiguracja Playwright, fixtures, page objects
- **Przykłady kodu** - gotowe snippety testów
- **CI/CD** - integracja z GitHub Actions
- **Harmonogram** - 7-dniowy plan implementacji

**Pokrycie testów:**
- ✅ Tworzenie rezerwacji - 7 testów
- ✅ Edycja rezerwacji - 4 testy
- ✅ Anulowanie - 2 testy
- ✅ Lista i filtrowanie - 3 testy
- ✅ Historia - 1 test
- ✅ Zaliczki - 1 test

[🔗 Czytaj więcej](testing/e2e-test-plan.md)

---

## 🚀 Quick Start

### Dla Developerów
1. Przeczytaj [Wymagania funkcjonalne](requirements/reservations-module-requirements.md)
2. Zapoznaj się z modelem danych i regułami biznesowymi
3. Rozpocznij implementację

### Dla Testerów
1. Przeczytaj [Plan testów E2E](testing/e2e-test-plan.md)
2. Zainstaluj Playwright: `npm install -D @playwright/test`
3. Uruchom testy: `npx playwright test`

### Dla Product Ownerów
1. Zapoznaj się z [Wymaganiami funkcjonalnymi](requirements/reservations-module-requirements.md)
2. Sprawdz sekcję "Funkcjonalności" i "Reguły biznesowe"
3. Weryfikuj implementację według kryteriów akceptacji

---

## 📊 Status implementacji

### Moduł Rezerwacji

| Funkcjonalność | Status | Wersja |
|----------------|--------|--------|
| CRUD rezerwacji | ✅ Gotowe | v1.0.0 |
| Podział gości (dorośli/dzieci) | ✅ Gotowe | v1.2.0 |
| Auto-kalkulacja cen | ✅ Gotowe | v1.2.0 |
| Dodatkowe godziny | ✅ Gotowe | v1.2.0 |
| Historia zmian | ✅ Gotowe | v1.1.0 |
| Cena za dziecko = połowa | ✅ Gotowe | v1.3.0 |
| Blokada klienta w edycji | ✅ Gotowe | v1.3.0 |
| Email opcjonalny | ✅ Gotowe | v1.3.0 |
| Testy E2E | 🚧 Planowane | - |

---

## 🔗 Przydatne linki

### Repozytorium
- [GitHub - kamil-gol/rezerwacje](https://github.com/kamil-gol/rezerwacje)
- [Issues](https://github.com/kamil-gol/rezerwacje/issues)
- [Pull Requests](https://github.com/kamil-gol/rezerwacje/pulls)

### Narzędzia
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 👥 Kontakt

Jeśli masz pytania dotyczące dokumentacji:
- Utwórz issue na GitHubie
- Skontaktuj się z zespołem deweloperskim

---

## 📅 Changelog dokumentacji

### 07.02.2026
- ✨ Utworzono kompletne wymagania funkcjonalne dla modułu rezerwacji
- ✨ Utworzono plan testów E2E z 18 scenariuszami
- ✨ Dodano przykłady kodu testów Playwright
- ✨ Dodano konfigurację CI/CD dla GitHub Actions

---

**Ostatnia aktualizacja:** 07.02.2026  
**Wersja dokumentacji:** 1.0.0
