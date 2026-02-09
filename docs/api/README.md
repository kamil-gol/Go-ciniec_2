# 🔌 API Documentation

Dokumentacja REST API dla systemu Gościniec Rodzinny.

## 📋 Zawartość

- `RESERVATIONS_API.md` - Endpointy API modułu Rezerwacje
- `DEPOSITS_API.md` - Endpointy zarządzania zaliczkami
- `QUEUE_API.md` - Endpointy systemu kolejki
- `AUTH_API.md` - Endpointy autoryzacji

## 🌐 Base URL

```
Production: https://twojadomena.pl/api
Development: http://localhost:3001/api
```

## 🔐 Autoryzacja

Wszystkie endpointy wymagają tokenu JWT w nagłówku:

```http
Authorization: Bearer <your_token_here>
```

## 📊 Formaty odpowiedzi

### Sukces
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Błąd
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🚀 Quick Start

Przeczytaj `RESERVATIONS_API.md` aby rozpocząć pracę z API rezerwacji.