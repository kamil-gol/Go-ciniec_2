# 📊 Database Documentation

Dokumentacja struktury bazy danych dla systemu Gościniec Rodzinny.

## 📋 Zawartość

- `RESERVATIONS_SCHEMA.md` - Szczegółowy schemat tabel modułu Rezerwacje
- `DEPOSITS_SCHEMA.md` - Schemat zarządzania zaliczkami
- `QUEUE_SCHEMA.md` - Schemat systemu kolejki
- `MIGRATIONS.md` - Historia migracji bazy danych

## 🔍 Przegląd

System wykorzystuje PostgreSQL jako główną bazę danych z Prisma jako ORM.

### Główne tabele:
- **Reservation** - Rezerwacje sal
- **Client** - Dane klientów
- **Hall** - Sale weselne
- **EventType** - Typy wydarzeń
- **Deposit** - Zaliczki
- **QueueEntry** - Kolejka oczekujących
- **ReservationHistory** - Historia zmian rezerwacji

## 📚 Więcej informacji

Zapoznaj się z poszczególnymi plikami w tym katalogu, aby uzyskać szczegółowe informacje o strukturze danych.