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
  DISCOUNT_PERCENTAGE_MAX: 'Rabat procentowy nie może przekroczyć 100%',
  DISCOUNT_AMOUNT_EXCEEDS: (discount: number, price: number) =>
    `Rabat kwotowy (${discount} PLN) nie może przekroczyć ceny (${price} PLN)`,
} as const;

// ═══════════════════════════════════════
// MENU (wybór menu w rezerwacji)
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
// MENU CRUD (zarządzanie szablonami/pakietami/opcjami)
// ═══════════════════════════════════════
export const MENU_CRUD = {
  TEMPLATE_NOT_FOUND: 'Nie znaleziono szablonu menu',
  NO_ACTIVE_MENU: (eventTypeId: string) =>
    `Nie znaleziono aktywnego menu dla tego typu wydarzenia (${eventTypeId})`,
  CANNOT_DELETE_TEMPLATE: (count: number) =>
    `Nie można usunąć szablonu menu. Jest używany w ${count} rezerwacji(ach).`,
  PACKAGE_NOT_FOUND: 'Nie znaleziono pakietu menu',
  CANNOT_DELETE_PACKAGE: (count: number) =>
    `Nie można usunąć pakietu. Jest używany w ${count} rezerwacji(ach).`,
  OPTION_NOT_FOUND: 'Nie znaleziono opcji menu',
  CANNOT_DELETE_OPTION: (count: number) =>
    `Nie można usunąć opcji. Jest używana w ${count} rezerwacji(ach).`,
} as const;

// ═══════════════════════════════════════
// MENU SELECTION (walidacja wyboru dań w menu)
// ═══════════════════════════════════════
export const MENU_SELECTION = {
  NOT_SELECTED: 'Menu nie zostało wybrane dla tej rezerwacji',
  CATEGORY_MIN: (name: string, min: number, got: number) =>
    `Kategoria "${name}" wymaga minimum ${min} wyborów (wybrano ${got})`,
  CATEGORY_MAX: (name: string, max: number, got: number) =>
    `Kategoria "${name}" pozwala na maksimum ${max} wyborów (wybrano ${got})`,
  VALIDATION_FAILED: 'Błąd walidacji wyboru menu',
  UNKNOWN_DISH: 'Nieznane danie',
  UNKNOWN_OPTION: 'Nieznana opcja',
} as const;

// ═══════════════════════════════════════
// HALL
// ═══════════════════════════════════════
export const HALL = {
  NOT_FOUND: 'Nie znaleziono sali',
  NOT_ACTIVE: 'Sala jest nieaktywna',
  NAME_REQUIRED: 'Nazwa sali jest wymagana',
  CAPACITY_REQUIRED: 'Pojemność sali jest wymagana',
  CAPACITY_POSITIVE: 'Pojemność sali musi być większa od 0',
  CANNOT_DELETE_WITH_RESERVATIONS: 'Nie można usunąć sali posiadającej rezerwacje',
  DELETED: 'Sala została usunięta',
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
  NAME_REQUIRED: 'Imię i nazwisko klienta są wymagane',
  DELETED: 'Klient został usunięty',
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
  RESERVATION_NOT_FOUND: 'Nie znaleziono rezerwacji powiązanej z zaliczką',
  PAYMENT_METHOD_REQUIRED: 'Metoda płatności jest wymagana',
} as const;

// ═══════════════════════════════════════
// EVENT TYPE
// ═══════════════════════════════════════
export const EVENT_TYPE = {
  NOT_FOUND: 'Nie znaleziono typu wydarzenia',
  NAME_REQUIRED: 'Nazwa typu wydarzenia jest wymagana',
  NAME_EXISTS: 'Typ wydarzenia o tej nazwie już istnieje',
  CANNOT_DELETE_WITH_RESERVATIONS: 'Nie można usunąć typu wydarzenia posiadającego rezerwacje',
  DELETED: 'Typ wydarzenia został usunięty',
} as const;

// ═══════════════════════════════════════
// QUEUE (kolejka rezerwacji)
// ═══════════════════════════════════════
export const QUEUE = {
  CLIENT_DATE_GUESTS_REQUIRED: 'Klient, data kolejki i liczba gości są wymagane',
  GUESTS_MIN_ONE: 'Liczba gości musi wynosić co najmniej 1',
  INVALID_DATE_FORMAT: 'Nieprawidłowy format daty',
  DATE_NOT_IN_PAST: 'Data kolejki nie może być w przeszłości',
  NOT_FOUND: 'Nie znaleziono rezerwacji',
  ONLY_RESERVED: 'Można modyfikować tylko rezerwacje ze statusem RESERVED',
  ONLY_RESERVED_SWAP: 'Można zamieniać tylko rezerwacje ze statusem RESERVED',
  ONLY_RESERVED_MOVE: 'Można przenosić tylko rezerwacje ze statusem RESERVED',
  BOTH_IDS_REQUIRED: 'Wymagane są identyfikatory obu rezerwacji',
  CANNOT_SWAP_SELF: 'Nie można zamienić rezerwacji z samą sobą',
  ONE_OR_BOTH_NOT_FOUND: 'Nie znaleziono jednej lub obu rezerwacji',
  SAME_DATE_REQUIRED: 'Można zamieniać tylko rezerwacje z tego samego dnia',
  RESERVATION_ID_REQUIRED: 'Identyfikator rezerwacji jest wymagany',
  POSITION_POSITIVE_INT: 'Pozycja musi być liczbą całkowitą większą lub równą 1',
  NO_QUEUE_DATE: 'Rezerwacja nie ma przypisanej daty kolejki',
  POSITION_INVALID: (pos: number, total: number) =>
    `Pozycja ${pos} jest nieprawidłowa. W kolejce na ten dzień jest ${total} rezerwacji.`,
  POSITION_TAKEN: (pos: number) =>
    `Pozycja ${pos} jest już zajęta. Odśwież stronę i spróbuj ponownie.`,
  AT_LEAST_ONE_UPDATE: 'Wymagana jest co najmniej jedna aktualizacja',
  EACH_NEEDS_ID: 'Każda aktualizacja musi zawierać identyfikator rezerwacji',
  INVALID_POSITION: (pos: number, id: string) =>
    `Nieprawidłowa pozycja ${pos} dla rezerwacji ${id}`,
  SOME_NOT_FOUND: 'Nie znaleziono jednej lub więcej rezerwacji',
  NOT_RESERVED_STATUS: (id: string) => `Rezerwacja ${id} nie ma statusu RESERVED`,
  NO_QUEUE_DATE_FOR: (id: string) => `Rezerwacja ${id} nie ma przypisanej daty kolejki`,
  ALL_SAME_DATE: 'Wszystkie rezerwacje muszą być z tego samego dnia',
  DUPLICATE_POSITIONS: 'Wykryto zduplikowane pozycje w aktualizacji',
  ONLY_RESERVED_PROMOTE: 'Można awansować tylko rezerwacje ze statusem RESERVED',
  HALL_EVENT_DATES_REQUIRED: 'Sala, typ wydarzenia, godzina rozpoczęcia i zakończenia są wymagane',
  INVALID_DATETIME: 'Nieprawidłowy format daty/godziny',
  END_AFTER_START: 'Godzina zakończenia musi być po godzinie rozpoczęcia',
  HALL_ALREADY_BOOKED: 'Sala jest już zarezerwowana w tym terminie',
  CONCURRENT_MODIFICATION: 'Inny użytkownik modyfikuje kolejkę. Odśwież stronę i spróbuj ponownie.',
  POSITION_CONFLICT: 'Wykryto konflikt pozycji. Odśwież stronę i spróbuj ponownie.',
} as const;

// ═══════════════════════════════════════
// SERVICE EXTRA (usługi dodatkowe)
// ═══════════════════════════════════════
export const SERVICE_EXTRA = {
  CATEGORY_NOT_FOUND: 'Nie znaleziono kategorii usług',
  CATEGORY_NAME_REQUIRED: 'Nazwa kategorii jest wymagana',
  CATEGORY_SLUG_REQUIRED: 'Slug kategorii jest wymagany',
  CATEGORY_SLUG_FORMAT: 'Slug może zawierać tylko małe litery, cyfry i myślniki',
  CATEGORY_SLUG_EXISTS: 'Kategoria o tym slugu już istnieje',
  CATEGORY_DELETED: 'Kategoria została usunięta',
  CATEGORY_HAS_ITEMS: 'Nie można usunąć kategorii zawierającej usługi',
  ITEM_NOT_FOUND: 'Nie znaleziono usługi',
  ITEM_NAME_REQUIRED: 'Nazwa usługi jest wymagana',
  ITEM_SLUG_REQUIRED: 'Slug usługi jest wymagany',
  ITEM_SLUG_FORMAT: 'Slug może zawierać tylko małe litery, cyfry i myślniki',
  ITEM_SLUG_EXISTS: 'Usługa o tym slugu już istnieje',
  ITEM_INVALID_PRICE_TYPE: 'Nieprawidłowy typ ceny. Dozwolone: FLAT, PER_PERSON, FREE',
  ITEM_INVALID_STATUS: 'Nieprawidłowy status. Dozwolone: ACTIVE, INACTIVE, SEASONAL',
  ITEM_DELETED: 'Usługa została usunięta',
  EXTRA_NOT_FOUND: 'Nie znaleziono usługi dodatkowej w rezerwacji',
  EXTRA_ALREADY_ADDED: 'Ta usługa jest już dodana do rezerwacji',
  EXTRA_EXCLUSIVE: (name: string) =>
    `Usługa "${name}" jest ekskluzywna i nie może być łączona z innymi usługami w tej kategorii`,
  EXTRA_REQUIRES_NOTE: (name: string) =>
    `Usługa "${name}" wymaga dodania notatki`,
  QUANTITY_MIN_ONE: 'Ilość musi wynosić co najmniej 1',
  RESERVATION_NOT_FOUND: 'Nie znaleziono rezerwacji',
} as const;

// ═══════════════════════════════════════
// USERS (zarządzanie użytkownikami)
// ═══════════════════════════════════════
export const USERS = {
  NOT_FOUND: 'Nie znaleziono użytkownika',
  EMAIL_EXISTS: 'Użytkownik z tym adresem email już istnieje',
  EMAIL_REQUIRED: 'Adres email jest wymagany',
  NAME_REQUIRED: 'Imię i nazwisko są wymagane',
  CANNOT_DELETE_SELF: 'Nie można usunąć własnego konta',
  CANNOT_DEACTIVATE_SELF: 'Nie można dezaktywować własnego konta',
  DELETED: 'Użytkownik został usunięty',
  ACTIVATED: 'Użytkownik został aktywowany',
  DEACTIVATED: 'Użytkownik został dezaktywowany',
  ROLE_UPDATED: 'Rola użytkownika została zaktualizowana',
  PASSWORD_RESET_BY_ADMIN: 'Hasło użytkownika zostało zresetowane przez administratora',
} as const;

// ═══════════════════════════════════════
// ROLES (role i uprawnienia)
// ═══════════════════════════════════════
export const ROLES = {
  NOT_FOUND: 'Nie znaleziono roli',
  NAME_REQUIRED: 'Nazwa roli jest wymagana',
  SLUG_REQUIRED: 'Slug roli jest wymagany',
  SLUG_EXISTS: 'Rola o tym slugu już istnieje',
  CANNOT_DELETE_ASSIGNED: 'Nie można usunąć roli przypisanej do użytkowników',
  CANNOT_DELETE_SYSTEM: 'Nie można usunąć roli systemowej',
  DELETED: 'Rola została usunięta',
  PERMISSION_NOT_FOUND: 'Nie znaleziono uprawnienia',
} as const;

// ═══════════════════════════════════════
// DISCOUNT (rabaty)
// ═══════════════════════════════════════
export const DISCOUNT = {
  NOT_FOUND: 'Nie znaleziono rabatu',
  NAME_REQUIRED: 'Nazwa rabatu jest wymagana',
  VALUE_POSITIVE: 'Wartość rabatu musi być większa od 0',
  PERCENTAGE_MAX: 'Rabat procentowy nie może przekroczyć 100%',
  INVALID_TYPE: 'Nieprawidłowy typ rabatu. Dozwolone: PERCENTAGE, AMOUNT',
  REASON_TOO_SHORT: 'Powód rabatu musi mieć co najmniej 3 znaki',
  DELETED: 'Rabat został usunięty',
} as const;

// ═══════════════════════════════════════
// ATTACHMENT (załączniki)
// ═══════════════════════════════════════
export const ATTACHMENT = {
  NOT_FOUND: 'Nie znaleziono załącznika',
  UPLOAD_FAILED: 'Nie udało się przesłać pliku',
  FILE_TOO_LARGE: 'Plik jest za duży. Maksymalny rozmiar to 10 MB.',
  INVALID_TYPE: 'Niedozwolony typ pliku',
  DELETED: 'Załącznik został usunięty',
  DOWNLOAD_FAILED: 'Nie udało się pobrać pliku',
  RESERVATION_NOT_FOUND: 'Nie znaleziono rezerwacji powiązanej z załącznikiem',
} as const;

// ═══════════════════════════════════════
// PDF (etykiety w generowanym PDF)
// ═══════════════════════════════════════
export const PDF_LABELS = {
  TITLE: 'Potwierdzenie rezerwacji',
  RESERVATION_NUMBER: 'Numer rezerwacji',
  CREATED_AT: 'Data utworzenia',
  STATUS: 'Status',
  CLIENT_DATA: 'Dane klienta',
  FIRST_NAME: 'Imię',
  LAST_NAME: 'Nazwisko',
  EMAIL: 'Email',
  PHONE: 'Telefon',
  COMPANY: 'Firma',
  NIP: 'NIP',
  RESERVATION_DETAILS: 'Szczegóły rezerwacji',
  HALL: 'Sala',
  EVENT_TYPE: 'Typ wydarzenia',
  DATE: 'Data',
  TIME: 'Godziny',
  ADULTS: 'Dorośli',
  CHILDREN: 'Dzieci',
  TODDLERS: 'Maluchy',
  TOTAL_GUESTS: 'Łącznie gości',
  PRICING: 'Cennik',
  PRICE_PER_ADULT: 'Cena za dorosłego',
  PRICE_PER_CHILD: 'Cena za dziecko',
  PRICE_PER_TODDLER: 'Cena za malucha',
  TOTAL_PRICE: 'Cena łącznie',
  CURRENCY: 'PLN',
  DISCOUNT_SECTION: 'Rabat',
  DISCOUNT_TYPE: 'Typ rabatu',
  DISCOUNT_PERCENTAGE: 'Procentowy',
  DISCOUNT_AMOUNT: 'Kwotowy',
  DISCOUNT_VALUE: 'Wartość rabatu',
  DISCOUNT_REASON: 'Powód rabatu',
  PRICE_BEFORE_DISCOUNT: 'Cena przed rabatem',
  PRICE_AFTER_DISCOUNT: 'Cena po rabacie',
  MENU_SECTION: 'Menu',
  MENU_PACKAGE: 'Pakiet menu',
  MENU_TEMPLATE: 'Szablon menu',
  MENU_OPTIONS: 'Opcje dodatkowe',
  PACKAGE_PRICE: 'Cena pakietu',
  OPTIONS_PRICE: 'Cena opcji',
  TOTAL_MENU_PRICE: 'Łączna cena menu',
  EXTRAS_SECTION: 'Usługi dodatkowe',
  EXTRAS_NAME: 'Usługa',
  EXTRAS_CATEGORY: 'Kategoria',
  EXTRAS_QUANTITY: 'Ilość',
  EXTRAS_UNIT_PRICE: 'Cena jednostkowa',
  EXTRAS_SUBTOTAL: 'Wartość',
  EXTRAS_TOTAL: 'Łącznie usługi dodatkowe',
  DEPOSITS_SECTION: 'Zaliczki',
  DEPOSIT_AMOUNT: 'Kwota zaliczki',
  DEPOSIT_DUE_DATE: 'Termin płatności',
  DEPOSIT_STATUS: 'Status',
  DEPOSIT_PAID: 'Opłacona',
  DEPOSIT_PENDING: 'Oczekująca',
  DEPOSIT_OVERDUE: 'Przeterminowana',
  DEPOSIT_CANCELLED: 'Anulowana',
  DEPOSIT_PAYMENT_METHOD: 'Metoda płatności',
  PAYMENT_CASH: 'Gotówka',
  PAYMENT_TRANSFER: 'Przelew',
  PAYMENT_CARD: 'Karta',
  PAYMENT_BLIK: 'BLIK',
  PAYMENT_OTHER: 'Inna',
  NOTES_SECTION: 'Uwagi',
  CONFIRMATION_DEADLINE: 'Termin potwierdzenia',
  FOOTER_GENERATED: 'Dokument wygenerowany automatycznie',
  FOOTER_PAGE: 'Strona',
  FOOTER_OF: 'z',
} as const;

// ═══════════════════════════════════════
// REPORTS (raporty i statystyki)
// ═══════════════════════════════════════
export const REPORTS = {
  DATE_RANGE_REQUIRED: 'Zakres dat jest wymagany',
  INVALID_DATE_FORMAT: 'Nieprawidłowy format daty',
  START_BEFORE_END: 'Data początkowa musi być przed datą końcową',
  NO_DATA: 'Brak danych do wygenerowania raportu',
  EXPORT_FAILED: 'Nie udało się wyeksportować raportu',
  GENERATED: 'Raport został wygenerowany',
  COL_RESERVATION_ID: 'ID rezerwacji',
  COL_CLIENT_NAME: 'Klient',
  COL_HALL: 'Sala',
  COL_EVENT_TYPE: 'Typ wydarzenia',
  COL_DATE: 'Data',
  COL_TIME: 'Godziny',
  COL_GUESTS: 'Gości',
  COL_ADULTS: 'Dorośli',
  COL_CHILDREN: 'Dzieci',
  COL_TODDLERS: 'Maluchy',
  COL_TOTAL_PRICE: 'Cena łącznie',
  COL_EXTRAS_PRICE: 'Usługi dodatkowe',
  COL_DEPOSIT_SUM: 'Suma zaliczek',
  COL_STATUS: 'Status',
  COL_CREATED_AT: 'Utworzono',
  COL_NOTES: 'Uwagi',
  COL_DISCOUNT: 'Rabat',
  SHEET_RESERVATIONS: 'Rezerwacje',
  SHEET_SUMMARY: 'Podsumowanie',
} as const;

// ═══════════════════════════════════════
// MENU COURSE (kursy/dania w menu)
// ═══════════════════════════════════════
export const MENU_COURSE = {
  NOT_FOUND: 'Nie znaleziono kursu menu',
  NAME_REQUIRED: 'Nazwa kursu jest wymagana',
  DELETED: 'Kurs menu został usunięty',
} as const;

// ═══════════════════════════════════════
// DISH (dania)
// ═══════════════════════════════════════
export const DISH = {
  NOT_FOUND: 'Nie znaleziono dania',
  NAME_REQUIRED: 'Nazwa dania jest wymagana',
  PRICE_POSITIVE: 'Cena dania musi być większa lub równa 0',
  DELETED: 'Danie zostało usunięte',
  CANNOT_DELETE_IN_USE: 'Nie można usunąć dania używanego w pakietach menu',
} as const;

// ═══════════════════════════════════════
// MIDDLEWARE (komunikaty middleware)
// ═══════════════════════════════════════
export const MIDDLEWARE = {
  RATE_LIMIT_EXCEEDED: 'Zbyt wiele żądań. Spróbuj ponownie za kilka minut.',
  INVALID_JSON: 'Nieprawidłowy format JSON w treści żądania',
  FILE_UPLOAD_ERROR: 'Błąd podczas przesyłania pliku',
} as const;

// ═══════════════════════════════════════
// UUID VALIDATION
// ═══════════════════════════════════════
export const VALIDATION = {
  INVALID_UUID: (param: string) => `Nieprawidłowy format identyfikatora: ${param}`,
} as const;

// ═══════════════════════════════════════
// STATUS LABELS (do wyświetlania w UI/PDF)
// ═══════════════════════════════════════
export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Oczekująca',
  CONFIRMED: 'Potwierdzona',
  COMPLETED: 'Zakończona',
  CANCELLED: 'Anulowana',
  RESERVED: 'W kolejce',
  PAID: 'Opłacona',
  OVERDUE: 'Przeterminowana',
  ACTIVE: 'Aktywna',
  INACTIVE: 'Nieaktywna',
  SEASONAL: 'Sezonowa',
} as const;
