/**
 * 🇵🇱 Centralny słownik tłumaczeń — Go-ciniec_2
 *
 * Wszystkie komunikaty widoczne dla użytkownika powinny być importowane z tego pliku.
 * Dzięki temu:
 * - Jedno miejsce do edycji
 * - Spójny język w całej aplikacji
 * - Łatwe dodanie kolejnego języka w przyszłości
 */

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
export const AUTH = {
  INVALID_CREDENTIALS: 'Nieprawidłowe dane logowania',
  USER_INACTIVE: 'Konto użytkownika jest nieaktywne',
  USER_NOT_FOUND: 'Nie znaleziono użytkownika',
  EMAIL_EXISTS: 'Użytkownik z tym adresem email już istnieje',
  TOKEN_INVALID: 'Nieprawidłowy lub wygasły token',
  NO_TOKEN: 'Brak tokena uwierzytelniającego',
  AUTH_FAILED: 'Uwierzytelnienie nie powiodło się',
  AUTH_REQUIRED: 'Wymagane uwierzytelnienie',
  INSUFFICIENT_PERMISSIONS: 'Niewystarczające uprawnienia',
  SESSION_EXPIRED: 'Sesja wygasła lub użytkownik nie istnieje — wyloguj się i zaloguj ponownie',
} as const;

// ═══════════════════════════════════════
// PASSWORD RESET
// ═══════════════════════════════════════
export const PASSWORD_RESET = {
  EMAIL_SENT: 'Jeśli podany adres email istnieje w systemie, wysłaliśmy link do resetowania hasła',
  TOKEN_INVALID: 'Link do resetowania hasła jest nieprawidłowy lub wygasł',
  TOKEN_USED: 'Ten link do resetowania hasła został już wykorzystany',
  TOKEN_EXPIRED: 'Link do resetowania hasła wygasł. Wygeneruj nowy.',
  PASSWORD_CHANGED: 'Hasło zostało zmienione pomyślnie',
  OLD_PASSWORD_WRONG: 'Aktualne hasło jest nieprawidłowe',
  SAME_PASSWORD: 'Nowe hasło nie może być takie samo jak obecne',
  RESET_SUBJECT: 'Resetowanie hasła — Gościniec',
} as const;

// ═══════════════════════════════════════
// ERRORS (globalny error handler)
// ═══════════════════════════════════════
export const ERRORS = {
  VALIDATION_ERROR: 'Błąd walidacji',
  DUPLICATE_VALUE: (field: string) => `Zduplikowana wartość dla: ${field}`,
  RECORD_NOT_FOUND: 'Nie znaleziono rekordu',
  REFERENCED_NOT_EXIST: 'Powiązany rekord nie istnieje',
  INVALID_DATA: 'Podano nieprawidłowe dane',
  INTERNAL_ERROR: 'Wewnętrzny błąd serwera',
  NOT_FOUND: (resource: string) => `${resource} — nie znaleziono`,
  ACCESS_DENIED: 'Brak dostępu',
} as const;

// ═══════════════════════════════════════
// PASSWORD
// ═══════════════════════════════════════
export const PASSWORD = {
  TOO_SHORT: 'Hasło musi mieć co najmniej 12 znaków',
  NEEDS_UPPERCASE: 'Hasło musi zawierać co najmniej jedną wielką literę',
  NEEDS_LOWERCASE: 'Hasło musi zawierać co najmniej jedną małą literę',
  NEEDS_DIGIT: 'Hasło musi zawierać co najmniej jedną cyfrę',
  NEEDS_SPECIAL: 'Hasło musi zawierać co najmniej jeden znak specjalny (!@#$%^&*)',
  REQUIREMENTS: [
    'Minimum 12 znaków',
    'Co najmniej 1 wielka litera (A-Z)',
    'Co najmniej 1 mała litera (a-z)',
    'Co najmniej 1 cyfra (0-9)',
    'Co najmniej 1 znak specjalny (!@#$%^&*)',
  ],
} as const;

// ═══════════════════════════════════════
// RESERVATION
// ═══════════════════════════════════════
export const RESERVATION = {
  NOT_FOUND: 'Nie znaleziono rezerwacji',
  HALL_CLIENT_EVENT_REQUIRED: 'Sala, klient i typ wydarzenia są wymagane',
  DATE_FORMAT_REQUIRED: 'Wymagane jest podanie startDateTime/endDateTime lub date/startTime/endTime',
  DATE_IN_FUTURE: 'Data rezerwacji musi być w przyszłości',
  END_AFTER_START: 'Godzina zakończenia musi być po godzinie rozpoczęcia',
  TIME_SLOT_BOOKED: 'Ten termin jest już zajęty dla wybranej sali. Wybierz inny termin.',
  GUESTS_REQUIRED: 'Wymagana jest co najmniej jedna osoba (dorośli, dzieci lub maluchy)',
  GUESTS_EXCEED_CAPACITY: (guests: number, capacity: number) =>
    `Liczba gości (${guests}) przekracza pojemność sali (${capacity})`,
  CANNOT_UPDATE_COMPLETED: 'Nie można edytować zakończonej rezerwacji',
  CANNOT_UPDATE_CANCELLED: 'Nie można edytować anulowanej rezerwacji',
  ALREADY_CANCELLED: 'Rezerwacja jest już anulowana',
  CANNOT_CANCEL_COMPLETED: 'Nie można anulować zakończonej rezerwacji',
  ALREADY_ARCHIVED: 'Rezerwacja jest już zarchiwizowana',
  NOT_ARCHIVED: 'Rezerwacja nie jest zarchiwizowana',
  REASON_REQUIRED: 'Powód zmian jest wymagany (minimum 10 znaków)',
  CONFIRMATION_DEADLINE: 'Termin potwierdzenia musi być co najmniej 1 dzień przed wydarzeniem',
  STATUS_TRANSITION_INVALID: (from: string, to: string) =>
    `Nie można zmienić statusu z ${from} na ${to}`,
  PRICE_REQUIRED: 'Cena za dorosłego i za dziecko jest wymagana gdy nie wybrano pakietu menu',
  CANNOT_COMPLETE_BEFORE_EVENT: 'Nie można zakończyć rezerwacji przed datą wydarzenia',
} as const;

// ═══════════════════════════════════════
// MENU
// ═══════════════════════════════════════
export const MENU = {
  PACKAGE_NOT_FOUND: 'Nie znaleziono wybranego pakietu menu',
  MIN_GUESTS: (min: number) => `Ten pakiet wymaga minimum ${min} gości`,
  MAX_GUESTS: (max: number) => `Ten pakiet pozwala na maksimum ${max} gości`,
  OPTION_NOT_FOUND: (id: string) => `Nie znaleziono opcji ${id}`,
  OPTION_INACTIVE: (name: string) => `Opcja ${name} jest nieaktywna`,
  OPTION_MAX_QTY: (max: number, name: string) => `Maksimum ${max} sztuk opcji ${name}`,
  OPTION_NO_MULTIPLE: (name: string) => `Opcja ${name} nie pozwala na wielokrotny wybór`,
  CANNOT_UPDATE_MENU: 'Nie można zmienić menu dla zakończonej lub anulowanej rezerwacji',
  INVALID_MENU_DATA: 'Nieprawidłowe dane aktualizacji menu',
  MENU_REMOVED: 'Menu zostało usunięte z rezerwacji',
  MENU_UPDATED: 'Menu zostało zaktualizowane',
} as const;

// ═══════════════════════════════════════
// HALL
// ═══════════════════════════════════════
export const HALL = {
  NOT_FOUND: 'Nie znaleziono sali',
  NOT_ACTIVE: 'Sala jest nieaktywna',
} as const;

// ═══════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════
export const CLIENT = {
  NOT_FOUND: 'Nie znaleziono klienta',
  INVALID_EMAIL: 'Nieprawidłowy format adresu email',
  PHONE_REQUIRED: 'Numer telefonu jest wymagany',
  PHONE_MIN_DIGITS: 'Numer telefonu musi zawierać co najmniej 9 cyfr',
  CANNOT_DELETE_WITH_RESERVATIONS: 'Nie można usunąć klienta posiadającego rezerwacje',
} as const;

// ═══════════════════════════════════════
// DEPOSIT
// ═══════════════════════════════════════
export const DEPOSIT = {
  NOT_FOUND: 'Nie znaleziono zaliczki',
  AMOUNT_POSITIVE: 'Kwota zaliczki musi być większa od 0',
  CANNOT_EDIT_PAID: 'Nie można edytować opłaconej zaliczki. Najpierw cofnij oznaczenie płatności.',
  CANNOT_DELETE_PAID: 'Nie można usunąć opłaconej zaliczki. Najpierw cofnij oznaczenie płatności.',
  CANNOT_CANCEL_PAID: 'Nie można anulować opłaconej zaliczki. Najpierw cofnij płatność.',
  ALREADY_PAID: 'Ta zaliczka jest już oznaczona jako opłacona',
  NOT_PAID: 'Ta zaliczka nie jest oznaczona jako opłacona',
  EMAIL_ONLY_PAID: 'Email potwierdzenia można wysłać tylko dla opłaconej zaliczki',
  CLIENT_NO_EMAIL: 'Klient nie ma przypisanego adresu email',
  DELETED: 'Zaliczka została usunięta',
  EXCEEDS_PRICE: (sum: number, price: number, available: number) =>
    `Suma zaliczek (${sum} PLN) przekracza cenę rezerwacji (${price} PLN, w tym usługi dodatkowe). Dostępne do zaliczki: ${available.toFixed(2)} PLN`,
} as const;

// ═══════════════════════════════════════
// EVENT TYPE
// ═══════════════════════════════════════
export const EVENT_TYPE = {
  NOT_FOUND: 'Nie znaleziono typu wydarzenia',
} as const;

// ═══════════════════════════════════════
// UUID VALIDATION
// ═══════════════════════════════════════
export const VALIDATION = {
  INVALID_UUID: (param: string) => `Nieprawidłowy format identyfikatora: ${param}`,
} as const;
