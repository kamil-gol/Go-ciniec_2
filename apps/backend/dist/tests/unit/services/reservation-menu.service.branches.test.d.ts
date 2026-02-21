/**
 * Reservation Menu Service — Branch coverage tests
 * Covers: selectMenu (new vs update, with/without dishes/options, reservation/package not found),
 * recalculateForGuestChange (null snapshot/menuData, PER_PERSON/FLAT, price unchanged),
 * removeMenu (snapshot exists/null, packageName fallback),
 * validateDishSelections (isRequired min, maxSelect),
 * buildMenuSnapshot (!categorySetting, dish?.name fallback),
 * calculateOptionsPrice (!option, PER_PERSON, FLAT, default),
 * formatMenuResponse (selectedOptions null/present),
 * getReservationMenu (no snapshot)
 */
export {};
//# sourceMappingURL=reservation-menu.service.branches.test.d.ts.map