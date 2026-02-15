# 🧹 Sprint 7 Cleanup — Sesja 16.02.2026

**Data:** 16 lutego 2026, 00:00–00:20 CET  
**Branch:** `fix/sprint7-cleanup`  
**Issue:** [#67](https://github.com/kamil-gol/Go-ciniec_2/issues/67)  
**Wersja:** v1.6.1  

---

## 📋 Zakres sesji

Sesja porządkowa po Sprint 7 — fix globalny UTF-8 w całym frontendzie + refaktor widoku listy rezerwacji.

---

## 🔤 1. Globalny fix Unicode (29 plików, 625 zamian)

### Problem
Wszystkie polskie znaki w plikach `.tsx`/`.ts` były zapisane jako podwójne escape Unicode (`\\u0105` zamiast `ą`). Powodowało to wyświetlanie `\u0105` w UI zamiast poprawnych polskich liter.

### Przyczyna
Serializacja/deserializacja JSON w pipeline CI lub edytorze zamieniła UTF-8 na escape sequences, które następnie zostały ponownie escape'owane.

### Rozwiązanie
Skrypt Python uruchomiony na serwerze w dwóch etapach:

**Etap 1 (v1):** Regex `\\\\u([0-9a-fA-F]{4})` → `chr(codepoint)`
- 25 plików, 448 zamian
- ⚠️ 4 pliki z emoji (surrogate pairs `\uD83C\uDF89`) zostały uszkodzone — `open('w')` wyzerował plik przed crashem zapisu

**Etap 2 (v3):** Poprawiony skrypt z dwuetapowym regex:
1. Surrogate pairs `\uD83C\uDF89` → emoji `🎉` (dekodowanie UTF-16)
2. Regularne `\u0105` → `ą` (pomijanie samotnych surogatów)
- 4 pliki przywrócone z `main` + 177 zamian

### Statystyki

| Etap | Pliki | Zamiany | Uwagi |
|------|-------|---------|-------|
| v1 | 25 | 448 | 4 pliki uszkodzone (surrogates) |
| v3 | 4 | 177 | Przywrócone + naprawione z emoji |
| **Razem** | **29** | **625** | ✅ Wszystkie pliki czyste |

### Top pliki (najwięcej zamian)
- `ReservationFinancialSummary.tsx` — 105 zamian
- `PackageForm.tsx` — 77 zamian
- `categories/page.tsx` — 60 zamian
- `update-deposit-status-modal.tsx` — 35 zamian
- `CategorySettingsSection.tsx` — 33 zamian

---

## 📄 2. Refaktor listy rezerwacji

### Zmiany
- **Usunięcie zduplikowanych stron** `/queue` i `/reservations`
- **Wymuszenie charset=utf-8** w backend response headers
- **Domyślny widok → lista** zamiast kalendarza
- **Toggle Lista|Kalendarz** — przycisk przełączania widoków
- **Usunięcie mini-kalendarza** z widoku listy (zbyt skomplikowany, niespójny z UX)

---

## 🔧 Lekcje wyniesione

1. **Bash heredoc + wielokrotne backslashe = katastrofa** — nawet `<< 'EOF'` nie ratuje 8-krotnych backslashy. Rozwiązanie: push pliku przez GitHub API.
2. **`nonlocal` wymaga enclosing function** — na poziomie modułu używaj `global` lub mutowalnej listy `count = [0]`.
3. **`open('w')` zeruje plik natychmiast** — jeśli `write()` crashnie (np. surrogates w UTF-8), plik jest stracony. Rozwiązanie: zapisuj do temp file → `os.replace()`.
4. **Surrogate pairs to nie Unicode scalars** — `\uD83C` sam w sobie jest nieprawidłowy w UTF-8. Trzeba dekodować pary razem.

---

## 📝 Lista commitów

| SHA | Opis |
|-----|------|
| `fee3225` | fix: usunięcie zduplikowanych stron /queue i /reservations |
| `1927823` | fix: wymuszenie charset=utf-8 w response headers |
| `4a794e9` | fix: domyślny widok rezerwacji to lista |
| `8b5af57` | feat: mini-kalendarz (nadpisany) |
| `bb90626` | fix: toggle Lista\|Kalendarz |
| `17e84a2` | fix: nowa lista — bez mini-kalendarza, UTF-8, toggle |
| `cc32ce6` | fix: globalny fix UTF-8 — 25 plików, 448 zamian |
| `2888d58` | fix: przywrócenie 4 plików z emoji + 177 zamian |

---

**Czas sesji:** ~20 min  
**Risk:** Niski (cleanup, brak zmian logiki biznesowej)  
**Testy wymagane:** Wizualna weryfikacja polskich znaków w UI  
