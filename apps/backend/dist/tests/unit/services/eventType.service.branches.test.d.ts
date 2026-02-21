/**
 * EventTypeService — Branch Coverage
 * createEventType: empty name, invalid color, existing name, description/color/isActive fallbacks
 * updateEventType: empty name, invalid color, color=null (valid), name conflict,
 *   conditional fields, description?.trim() || null, no changes audit skip
 * toggleActive: Aktywowano/Dezaktywowano
 * deleteEventType: has reservations, has templates
 * getEventTypes: activeOnly vs all
 */
export {};
//# sourceMappingURL=eventType.service.branches.test.d.ts.map