# 🔄 Workflows & Business Processes

Dokumentacja procesów biznesowych i przepływów pracy.

## 📋 Zawartość

- `RESERVATION_WORKFLOWS.md` - Przepływy procesów rezerwacji
- `QUEUE_WORKFLOWS.md` - Przepływy w systemie kolejki
- `DEPOSIT_WORKFLOWS.md` - Procesy zarządzania zaliczkami
- `STATUS_TRANSITIONS.md` - Dozwolone przejścia statusów

## 🔄 Główne procesy

### 1. Cykl życia rezerwacji
```
RESERVED (Lista rezerwowa)
    ↓
PENDING (Oczekująca)
    ↓
CONFIRMED (Potwierdzona)
    ↓
COMPLETED (Zakończona)
```

### 2. System kolejki
- Automatyczne awansowanie z listy rezerwowej
- Powiadomienia o zwolnieniu terminu
- Priorytetyzacja według daty utworzenia

### 3. Zarządzanie zaliczkami
- Termin płatności
- Status opłacenia
- Metody płatności

## 📊 Diagramy

Każdy plik zawiera szczegółowe diagramy przepływu procesów.