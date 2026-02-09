
## [09.02.2026] - System 3-poziomowy cennik sal

### Added
- 🆕 Pole `pricePerToddler` w modelu Hall (0-3 lat)
- 🆕 Automatyczne wyliczanie cen: dzieci 50%, maluchy 25%
- 🆕 Toggle auto-wyliczania w formularzach tworzenia/edycji
- 🆕 Wizualizacja 3 poziomów cenowych w kartach sal
- 🆕 Dokumentacja modułu: docs/HALLS_MODULE.md

### Changed
- ✏️ Rozszerzono interfejsy Hall, CreateHallInput, UpdateHallInput
- ✏️ Przeprojektowano HallCard z eleganckim boxem cenowym
- ✏️ Zaktualizowano formularze new/edit z auto-calc

### Technical
- React useEffect dla auto-wyliczania
- Zaokrąglanie do 2 miejsc po przecinku
- Disabled state przy auto-calc
- Komunikaty potwierdzenia w kolorze zielonym

**Commity:**
- feat: add pricePerToddler to Hall interfaces
- feat: update hall-card to display 3 price tiers  
- feat: add pricePerToddler field to new hall form
- feat: add auto-calc prices to hall edit form
- docs: create HALLS_MODULE documentation

**Branch:** feature/halls-module  
**Status:** ✅ Gotowy do merge
