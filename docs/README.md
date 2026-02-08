# 📚 Dokumentacja Systemu Rezerwacji

## 👋 Witamy w dokumentacji!

Ten folder zawiera pełną dokumentację systemu zarządzania rezerwacjami sal weselnych i okolicznościowych.

---

## 📌 **AKTUALNE INFORMACJE**

### 🆕 **Branch:** `feature/reservation-queue`
### ✅ **Ostatnia sesja bugfix:** 07.02.2026, 22:00 CET
### 🔧 **Naprawione:** Pola warunkowe w formularzach rezerwacji

[Zobacz szczegóły ostatniej sesji →](BUGFIX_SESSION_2026-02-07.md)

---

## 📚 Dokumenty Kluczowe

### 🎯 Dla Kontynuacji Pracy
1. **[QUEUE.md](QUEUE.md)** - **START TUTAJ** - Pełna dokumentacja systemu kolejki rezerwacji
2. **[BUGFIX_SESSION_2026-02-07.md](BUGFIX_SESSION_2026-02-07.md)** - Ostatnia sesja naprawcza
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architektura projektu
4. **[DATABASE.md](DATABASE.md)** - Struktura bazy danych

---

## 📋 Szybki Przegląd

### System Kolejki Rezerwacji [🔗 QUEUE.md](QUEUE.md)
**Status:** ✅ Zaimplementowany | **Branch:** `feature/reservation-queue`

**Funkcjonalności:**
- ✅ Status RESERVED (kolejka rezerwowa)
- ✅ Drag & drop zmiany kolejności
- ✅ Awansowanie do pełnej rezerwacji
- ✅ Pola warunkowe (Urodziny, Rocznica, Inne)
- ✅ Podział gości na 3 grupy wiekowe

**Ostatnie poprawki:**
- ✅ Pole "Które urodziny" ładuje i zapisuje wartość
- ✅ Wsparcie dla nazw "Rocznica" i "Rocznica/Jubileusz"

[Czytaj pełną dokumentację →](QUEUE.md)

---

## 📌 Struktura Dokumentacji

```
docs/
├── README.md                           # ← TEN PLIK
├── QUEUE.md                            # System kolejki rezerwacji
├── BUGFIX_SESSION_2026-02-07.md        # Ostatnia sesja naprawcza
├── ARCHITECTURE.md                     # Architektura projektu
├── DATABASE.md                         # Struktura bazy danych
├── DEPLOYMENT.md                       # Instrukcje deploymentu
├── SPRINTS.md                          # Historia sprintów
├── requirements/                       # Wymagania funkcjonalne
│   └── reservations-module-requirements.md
└── testing/                            # Plany testów
    └── e2e-test-plan.md
```

---

## 🚀 Quick Start - Nowy Wątek

### **Prompt do kontynuacji pracy:**

```
Kontynuuję pracę nad projektem Rezerwacje (repo: kamil-gol/rezerwacje, branch: feature/reservation-queue).

Przeczytaj dokumentację:
1. docs/QUEUE.md - system kolejki rezerwacji
2. docs/BUGFIX_SESSION_2026-02-07.md - ostatnia sesja naprawcza
3. docs/ARCHITECTURE.md - architektura projektu

Projekt jest w Dockerze. Ostatnio naprawialiśmy pola warunkowe w formularzach rezerwacji.

Działające funkcjonalności:
- System kolejki rezerwacji (status RESERVED)
- Awansowanie z kolejki do pełnej rezerwacji
- Pola warunkowe dla różnych typów wydarzeń (Urodziny, Rocznica, Inne)
- Podział gości na 3 grupy wiekowe (dorośli, dzieci 4-12, dzieci 0-3)

Co chcesz dalej rozwinąć/naprawić?
```

---

## 📦 Status Implementacji

### Moduł Rezerwacji

| Funkcjonalność | Status | Commit |
|----------------|--------|--------|
| CRUD rezerwacji | ✅ Gotowe | - |
| Kolejka rezerwacji (RESERVED) | ✅ Gotowe | `feature/reservation-queue` |
| Drag & drop kolejności | ✅ Gotowe | `feature/reservation-queue` |
| Awansowanie do rezerwacji | ✅ Gotowe | `feature/reservation-queue` |
| Podział gości (3 grupy wiekowe) | ✅ Gotowe | v1.2.0 |
| Pola warunkowe (Urodziny) | ✅ Naprawione | `6d88132` |
| Pola warunkowe (Rocznica) | ✅ Naprawione | `1547cbf` |
| Auto-kalkulacja cen | ✅ Gotowe | v1.2.0 |
| Dodatkowe godziny | ✅ Gotowe | v1.2.0 |
| Historia zmian | ✅ Gotowe | v1.1.0 |
| Testy E2E | 🚧 Planowane | - |

---

## 📚 Wymagania Funkcjonalne

### [Modul Rezerwacji](requirements/reservations-module-requirements.md)
**Status:** ✅ Aktualny | **Ostatnia aktualizacja:** 07.02.2026

Kompletna specyfikacja wymagania funkcjonalnych dla modułu rezerwacji.

[Czytaj więcej →](requirements/reservations-module-requirements.md)

---

## 🧪 Testy

### [Plan Testów E2E - Moduł Rezerwacje](testing/e2e-test-plan.md)
**Status:** 🚧 Do implementacji | **Ostatnia aktualizacja:** 07.02.2026

Kompletny plan testów end-to-end z wykorzystaniem Playwright.

[Czytaj więcej →](testing/e2e-test-plan.md)

---

## 🔧 Przydatne Komendy Docker

```bash
# Pobranie najnowszych zmian
git pull origin feature/reservation-queue

# Restart kontenerów
docker compose restart frontend

# Pełny rebuild
docker compose down
docker compose up --build

# Logi frontendu
docker compose logs -f frontend
```

---

## 🔗 Przydatne Linki

### Repozytorium
- [GitHub - kamil-gol/rezerwacje](https://github.com/kamil-gol/rezerwacje)
- [Branch: feature/reservation-queue](https://github.com/kamil-gol/rezerwacje/tree/feature/reservation-queue)
- [Issues](https://github.com/kamil-gol/rezerwacje/issues)
- [Pull Requests](https://github.com/kamil-gol/rezerwacje/pulls)

### Narzędzia
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 📅 Changelog Dokumentacji

### 07.02.2026 - 22:00 CET
- ✅ Naprawiono pole "Które urodziny" w edycji rezerwacji
- ✅ Dodano wsparcie dla nazw "Rocznica" i "Rocznica/Jubileusz"
- ✅ Utworzono dokumentację sesji bugfix
- ✅ Zaktualizowano README z odniesieniami do nowej dokumentacji

### 07.02.2026 - wcześniej
- ✨ Utworzono kompletną dokumentację systemu kolejki (QUEUE.md)
- ✨ Utworzono kompletne wymagania funkcjonalne dla modułu rezerwacji
- ✨ Utworzono plan testów E2E z 18 scenariuszami
- ✨ Dodano przykłady kodu testów Playwright
- ✨ Dodano konfigurację CI/CD dla GitHub Actions

---

## 👥 Kontakt

Jeśli masz pytania dotyczące dokumentacji:
- Utwórz issue na GitHubie
- Skontaktuj się z zespołem deweloperskim

---

**Ostatnia aktualizacja:** 07.02.2026, 22:00 CET  
**Branch:** `feature/reservation-queue`  
**Wersja dokumentacji:** 2.0.0  
**Status:** ✅ Gotowe do kontynuacji w nowym wątku
