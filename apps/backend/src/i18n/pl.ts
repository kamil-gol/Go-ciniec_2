/**
 * 🇵🇱 Centralny plik tłumaczeń — polski
 *
 * Wszystkie komunikaty błędów, walidacji i UI w jednym miejscu.
 * Import: import pl from '@/i18n/pl';
 */

export const pl = {
  // ——— Autentykacja ———
  auth: {
    invalidCredentials: 'Nieprawidłowe dane logowania',
    userInactive: 'Konto użytkownika jest nieaktywne',
    userNotFound: 'Nie znaleziono użytkownika',
    emailAlreadyExists: 'Użytkownik z tym adresem email już istnieje',
    tokenInvalid: 'Nieprawidłowy lub wygasły token',
    noToken: 'Brak tokena uwierzytelniającego',
    authFailed: 'Uwierzytelnienie nie powiodło się',
    authRequired: 'Wymagane uwierzytelnienie',
    insufficientPermissions: 'Niewystarczające uprawnienia',
    sessionExpired: 'Sesja wygasła lub użytkownik nie istnieje — wyloguj się i zaloguj ponownie',
  },

  // ——— Walidacja hasła ———
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

  // ——— Błędy ogólne / middleware ———
  errors: {
    validationError: 'Błąd walidacji',
    duplicateValue: (field: string) => `Zduplikowana wartość dla: ${field}`,
    recordNotFound: 'Nie znaleziono rekordu',
    referencedNotExist: 'Powiązany rekord nie istnieje',
    invalidData: 'Podano nieprawidłowe dane',
    internalError: 'Wewnętrzny błąd serwera',
    accessDenied: 'Brak dostępu',
    invalidUUID: (param: string) => `Nieprawidłowy format ID: ${param}`,
  },

  // ——— Rezerwacje ———
  reservation: {
    notFound: 'Nie znaleziono rezerwacji',
    hallClientEventRequired: 'Sala, klient i typ wydarzenia są wymagane',
    dateTimeRequired: 'Wymagane: startDateTime/endDateTime lub date/startTime/endTime',
    hallNotFound: 'Nie znaleziono sali',
    hallNotActive: 'Sala jest nieaktywna',
    clientNotFound: 'Nie znaleziono klienta',
    eventTypeNotFound: 'Nie znaleziono typu wydarzenia',
    atLeastOnePerson: 'Wymagana co najmniej jedna osoba (dorośli, dzieci lub maluchy)',
    guestsExceedCapacity: (guests: number, capacity: number) =>
      `Liczba gości (${guests}) przekracza pojemność sali (${capacity})`,
    menuPackageNotFound: 'Nie znaleziono wybranego pakietu menu',
    packageMinGuests: (min: number) => `Ten pakiet wymaga co najmniej ${min} gości`,
    packageMaxGuests: (max: number) => `Ten pakiet dopuszcza maksymalnie ${max} gości`,
    pricesRequired: 'Cena za dorosłego i dziecko jest wymagana gdy nie wybrano pakietu menu',
    dateMustBeFuture: 'Data rezerwacji musi być w przyszłości',
    endAfterStart: 'Godzina zakończenia musi być po godzinie rozpoczęcia',
    timeSlotBooked: 'Ten termin jest już zarezerwowany dla wybranej sali. Wybierz inny termin.',
    timeSlotBookedShort: 'Ten termin jest już zarezerwowany dla wybranej sali',
    confirmationDeadline: 'Termin potwierdzenia musi być co najmniej 1 dzień przed wydarzeniem',
    cannotUpdateCompleted: 'Nie można edytować zakończonej rezerwacji',
    cannotUpdateCancelled: 'Nie można edytować anulowanej rezerwacji',
    cannotUpdateMenu: 'Nie można zmienić menu w zakończonej lub anulowanej rezerwacji',
    reasonRequired: 'Powód zmian jest wymagany (minimum 10 znaków)',
    alreadyCancelled: 'Rezerwacja jest już anulowana',
    cannotCancelCompleted: 'Nie można anulować zakończonej rezerwacji',
    cannotCompleteBeforeEvent: 'Nie można zakończyć rezerwacji przed datą wydarzenia',
    alreadyArchived: 'Rezerwacja jest już zarchiwizowana',
    notArchived: 'Rezerwacja nie jest zarchiwizowana',
    invalidStatusTransition: (from: string, to: string) =>
      `Nie można zmienić statusu z ${from} na ${to}`,
    invalidMenuUpdateData: 'Nieprawidłowe dane aktualizacji menu',
    menuRemovedSuccess: 'Menu zostało usunięte',
    menuUpdatedSuccess: 'Menu zostało zaktualizowane',
    discountPercentageMax: 'Rabat procentowy nie może przekroczyć 100%',
    discountAmountExceedsPrice: (discount: number, price: number) =>
      `Rabat kwotowy (${discount} PLN) nie może przekroczyć ceny (${price} PLN)`,
  },

  // ——— Opcje menu ———
  menuOption: {
    notFound: (id: string) => `Nie znaleziono opcji ${id}`,
    notActive: (name: string) => `Opcja ${name} jest nieaktywna`,
    maxQuantity: (max: number, name: string) => `Maksymalnie ${max} sztuk: ${name}`,
    noMultiple: (name: string) => `Opcja ${name} nie pozwala na wielokrotny wybór`,
  },

  // ——— Depozyty / Zaliczki ———
  deposit: {
    notFound: 'Nie znaleziono zaliczki',
    reservationNotFound: 'Nie znaleziono rezerwacji dla tej zaliczki',
    alreadyPaid: 'Zaliczka jest już opłacona',
    alreadyCancelled: 'Zaliczka jest już anulowana',
    invalidAmount: 'Kwota zaliczki musi być większa od 0',
    exceedsTotalPrice: 'Kwota zaliczki nie może przekroczyć ceny rezerwacji',
  },

  // ——— Klienci ———
  client: {
    notFound: 'Nie znaleziono klienta',
    emailAlreadyExists: 'Klient z tym adresem email już istnieje',
    phoneAlreadyExists: 'Klient z tym numerem telefonu już istnieje',
  },

  // ——— Sale ———
  hall: {
    notFound: 'Nie znaleziono sali',
    nameAlreadyExists: 'Sala o tej nazwie już istnieje',
    cannotDeleteWithReservations: 'Nie można usunąć sali z istniejącymi rezerwacjami',
  },

  // ——— Typy wydarzeń ———
  eventType: {
    notFound: 'Nie znaleziono typu wydarzenia',
    nameAlreadyExists: 'Typ wydarzenia o tej nazwie już istnieje',
  },

  // ——— Użytkownicy ———
  user: {
    notFound: 'Nie znaleziono użytkownika',
    emailAlreadyExists: 'Użytkownik z tym adresem email już istnieje',
    emailTaken: 'Ten adres email jest już zajęty',
    cannotDeactivateSelf: 'Nie możesz dezaktywować własnego konta',
    cannotDeleteSelf: 'Nie możesz usunąć własnego konta',
  },

  // ——— Role ———
  role: {
    notFound: 'Nie znaleziono roli',
    nameAlreadyExists: 'Rola o tej nazwie już istnieje',
    cannotDeleteWithUsers: 'Nie można usunąć roli przypisanej do użytkowników',
    cannotDeleteProtected: 'Nie można usunąć chronionej roli systemowej',
  },

  // ——— Usługi dodatkowe ———
  serviceExtra: {
    notFound: 'Nie znaleziono usługi dodatkowej',
    categoryNotFound: 'Nie znaleziono kategorii usługi',
  },

  // ——— Zniżki ———
  discount: {
    notFound: 'Nie znaleziono zniżki',
    codeAlreadyExists: 'Kod zniżki już istnieje',
  },

  // ——— Menu ———
  menu: {
    templateNotFound: 'Nie znaleziono szablonu menu',
    packageNotFound: 'Nie znaleziono pakietu menu',
    courseNotFound: 'Nie znaleziono dania w menu',
  },

  // ——— Pliki / Załączniki ———
  attachment: {
    notFound: 'Nie znaleziono załącznika',
    fileTooLarge: 'Plik jest za duży',
    invalidFileType: 'Nieprawidłowy typ pliku',
  },

  // ——— Historia rezerwacji (etykiety w history entries) ———
  history: {
    created: 'Rezerwacja utworzona',
    createdWithMenu: (packageName: string) => `Rezerwacja utworzona z pakietem menu: ${packageName}`,
    statusChanged: 'Zmiana statusu',
    menuRemoved: 'Menu usunięte z rezerwacji',
    menuUpdated: (packageName: string) => `Menu zaktualizowane: ${packageName}`,
    archived: 'Rezerwacja zarchiwizowana',
    unarchived: 'Rezerwacja przywrócona z archiwum',
    cancelled: 'Rezerwacja anulowana',
    depositCancelled: (amount: string) =>
      `Zaliczka ${amount} zł auto-anulowana z powodu anulowania rezerwacji`,
  },
} as const;

export default pl;
