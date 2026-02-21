/**
 * 🇵🇱 Centralne tłumaczenia — język polski
 *
 * Wszystkie komunikaty błędów, walidacji i odpowiedzi API w jednym miejscu.
 * Import: import { pl } from '@/i18n/pl';
 */

export const pl = {
  // ════════════════════════════════════════
  // Uwierzytelnianie (Auth)
  // ════════════════════════════════════════
  auth: {
    invalidCredentials: 'Nieprawidłowy email lub hasło',
    userInactive: 'Konto użytkownika jest nieaktywne',
    userAlreadyExists: 'Użytkownik z tym adresem email już istnieje',
    userNotFound: 'Nie znaleziono użytkownika',
    tokenInvalid: 'Nieprawidłowy lub wygasły token',
    noToken: 'Brak tokena uwierzytelniającego',
    authFailed: 'Uwierzytelnienie nie powiodło się',
    authRequired: 'Wymagane uwierzytelnienie',
    insufficientPermissions: 'Niewystarczające uprawnienia',
    sessionExpired: 'Sesja wygasła lub użytkownik nie istnieje — wyloguj się i zaloguj ponownie',
  },

  // ════════════════════════════════════════
  // Hasła (Password)
  // ════════════════════════════════════════
  password: {
    tooShort: 'Hasło musi mieć co najmniej 12 znaków',
    needsUppercase: 'Hasło musi zawierać co najmniej jedną wielką literę',
    needsLowercase: 'Hasło musi zawierać co najmniej jedną małą literę',
    needsDigit: 'Hasło musi zawierać co najmniej jedną cyfrę',
    needsSpecial: 'Hasło musi zawierać co najmniej jeden znak specjalny (!@#$%^&*)',
    requirements: [
      'Minimum 12 znaków',
      'Co najmniej 1 wielka litera (A-Z)',
      'Co najmniej 1 mała litera (a-z)',
      'Co najmniej 1 cyfra (0-9)',
      'Co najmniej 1 znak specjalny (!@#$%^&*)',
    ],
  },

  // ════════════════════════════════════════
  // Błędy ogólne (Generic errors)
  // ════════════════════════════════════════
  errors: {
    validationError: 'Błąd walidacji',
    duplicateValue: (field: string) => `Zduplikowana wartość dla: ${field}`,
    recordNotFound: 'Nie znaleziono rekordu',
    referencedNotExist: 'Powiązany rekord nie istnieje',
    invalidData: 'Podano nieprawidłowe dane',
    internalError: 'Wewnętrzny błąd serwera',
    accessDenied: 'Brak dostępu',
  },

  // ════════════════════════════════════════
  // Rezerwacje (Reservations)
  // ════════════════════════════════════════
  reservation: {
    hallClientEventRequired: 'Sala, klient i typ wydarzenia są wymagane',
    dateTimeRequired: 'Wymagane jest podanie startDateTime/endDateTime lub date/startTime/endTime',
    hallNotFound: 'Nie znaleziono sali',
    hallNotActive: 'Sala jest nieaktywna',
    clientNotFound: 'Nie znaleziono klienta',
    eventTypeNotFound: 'Nie znaleziono typu wydarzenia',
    atLeastOnePerson: 'Wymagana jest co najmniej jedna osoba (dorośli, dzieci lub małe dzieci)',
    guestsExceedCapacity: (guests: number, capacity: number) =>
      `Liczba gości (${guests}) przekracza pojemność sali (${capacity})`,
    menuPackageNotFound: 'Nie znaleziono wybranego pakietu menu',
    packageMinGuests: (min: number) => `Ten pakiet wymaga minimum ${min} gości`,
    packageMaxGuests: (max: number) => `Ten pakiet dopuszcza maksymalnie ${max} gości`,
    priceRequired: 'Cena za osobę dorosłą i dziecko jest wymagana gdy nie wybrano pakietu menu',
    dateMustBeFuture: 'Data rezerwacji musi być w przyszłości',
    endAfterStart: 'Godzina zakończenia musi być po godzinie rozpoczęcia',
    timeSlotBooked: 'Ten termin jest już zajęty dla wybranej sali. Wybierz inny termin.',
    confirmationDeadline: 'Termin potwierdzenia musi być co najmniej 1 dzień przed wydarzeniem',
    notFound: 'Nie znaleziono rezerwacji',
    cannotUpdateCompleted: 'Nie można edytować zakończonej rezerwacji',
    cannotUpdateCancelled: 'Nie można edytować anulowanej rezerwacji',
    cannotUpdateMenuCompletedCancelled: 'Nie można zmienić menu zakończonej lub anulowanej rezerwacji',
    menuRemovedSuccess: 'Menu usunięte pomyślnie',
    menuUpdatedSuccess: 'Menu zaktualizowane pomyślnie',
    invalidMenuData: 'Nieprawidłowe dane aktualizacji menu',
    optionNotFound: (id: string) => `Nie znaleziono opcji ${id}`,
    optionNotActive: (name: string) => `Opcja ${name} jest nieaktywna`,
    optionMaxQuantity: (max: number, name: string) => `Maksymalna ilość ${name}: ${max}`,
    optionNoMultiple: (name: string) => `Opcja ${name} nie pozwala na wielokrotny wybór`,
    reasonRequired: 'Powód zmian jest wymagany (minimum 10 znaków)',
    cannotChangeStatus: (from: string, to: string) => `Nie można zmienić statusu z ${from} na ${to}`,
    alreadyCancelled: 'Rezerwacja jest już anulowana',
    cannotCancelCompleted: 'Nie można anulować zakończonej rezerwacji',
    alreadyArchived: 'Rezerwacja jest już zarchiwizowana',
    notArchived: 'Rezerwacja nie jest zarchiwizowana',
    cannotCompleteBeforeEvent: 'Nie można zakończyć rezerwacji przed datą wydarzenia',
    // History entries
    history: {
      created: 'Rezerwacja utworzona',
      createdWithMenu: (name: string) => `Rezerwacja utworzona z pakietem menu: ${name}`,
      menuRemoved: 'Menu usunięte z rezerwacji',
      menuUpdated: (name: string) => `Menu zaktualizowane na: ${name}`,
      statusChanged: 'Zmiana statusu',
      cancelled: 'Rezerwacja anulowana',
      archived: 'Rezerwacja zarchiwizowana',
      restored: 'Rezerwacja przywrócona z archiwum',
    },
  },

  // ════════════════════════════════════════
  // Klienci (Clients)
  // ════════════════════════════════════════
  client: {
    notFound: 'Nie znaleziono klienta',
    invalidEmail: 'Nieprawidłowy format adresu email',
    phoneRequired: 'Numer telefonu jest wymagany',
    phoneMinDigits: 'Numer telefonu musi zawierać co najmniej 9 cyfr',
    cannotDeleteWithReservations: 'Nie można usunąć klienta z istniejącymi rezerwacjami',
  },

  // ════════════════════════════════════════
  // Sale (Halls)
  // ════════════════════════════════════════
  hall: {
    notFound: 'Nie znaleziono sali',
    notActive: 'Sala jest nieaktywna',
  },

  // ════════════════════════════════════════
  // Zaliczki (Deposits)
  // ════════════════════════════════════════
  deposit: {
    notFound: 'Nie znaleziono zaliczki',
    reservationNotFound: 'Nie znaleziono rezerwacji',
  },

  // ════════════════════════════════════════
  // Typy wydarzeń (Event Types)
  // ════════════════════════════════════════
  eventType: {
    notFound: 'Nie znaleziono typu wydarzenia',
  },

  // ════════════════════════════════════════
  // Menu
  // ════════════════════════════════════════
  menu: {
    packageNotFound: 'Nie znaleziono pakietu menu',
    templateNotFound: 'Nie znaleziono szablonu menu',
  },

  // ════════════════════════════════════════
  // Zasoby — dla AppError.notFound(resource)
  // ════════════════════════════════════════
  resources: {
    user: 'Użytkownik',
    reservation: 'Rezerwacja',
    deposit: 'Zaliczka',
    hall: 'Sala',
    client: 'Klient',
    eventType: 'Typ wydarzenia',
    role: 'Rola',
    menu: 'Menu',
    menuPackage: 'Pakiet menu',
    menuTemplate: 'Szablon menu',
    option: 'Opcja',
    dish: 'Danie',
    discount: 'Rabat',
    attachment: 'Załącznik',
    permission: 'Uprawnienie',
    default: 'Zasób',
  },
} as const;

export default pl;
