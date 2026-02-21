/**
 * Stats Service
 * Dashboard statistics — real-time queries from database
 * Updated: extras revenue included in KPIs (#4)
 */

import { prisma } from '@/lib/prisma';

export interface DashboardOverview {
  reservationsToday: number;
  reservationsThisWeek: number;
  reservationsThisMonth: number;
  queueCount: number;
  confirmedThisMonth: number;
  revenueThisMonth: number;
  revenuePrevMonth: number;
  revenueChangePercent: number;
  extrasRevenueThisMonth: number;
  totalClients: number;
  newClientsThisMonth: number;
  pendingDepositsCount: number;
  pendingDepositsAmount: number;
  activeHalls: number;
}

class StatsService {
  /**
   * Get dashboard overview statistics
   * Uses Promise.all for parallel queries (performance)
   */
  async getOverview(): Promise<DashboardOverview> {
    const now = new Date();

    // Today string (Reservation.date is VarChar "2026-02-14")
    const todayStr = now.toISOString().split('T')[0];

    // This week (Monday-based)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // This month
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEndStr = nextMonth.toISOString().split('T')[0];

    // Previous month
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStartStr = prevMonthStart.toISOString().split('T')[0];
    const prevMonthEndStr = monthStartStr;

    const [
      reservationsToday,
      reservationsThisWeek,
      reservationsThisMonth,
      queueCount,
      confirmedThisMonth,
      revenueThisMonth,
      revenuePrevMonth,
      totalClients,
      newClientsThisMonth,
      pendingDeposits,
      activeHalls,
    ] = await Promise.all([
      // Rezerwacje dziś (nie-anulowane)
      prisma.reservation.count({
        where: {
          date: todayStr,
          status: { not: 'CANCELLED' },
        },
      }),

      // Rezerwacje ten tydzień
      prisma.reservation.count({
        where: {
          date: { gte: weekStartStr, lte: weekEndStr },
          status: { not: 'CANCELLED' },
        },
      }),

      // Rezerwacje ten miesiąc
      prisma.reservation.count({
        where: {
          date: { gte: monthStartStr, lt: monthEndStr },
          status: { not: 'CANCELLED' },
        },
      }),

      // W kolejce (status RESERVED)
      prisma.reservation.count({
        where: { status: 'RESERVED' },
      }),

      // Potwierdzone ten miesiąc
      prisma.reservation.count({
        where: {
          date: { gte: monthStartStr, lt: monthEndStr },
          status: 'CONFIRMED',
        },
      }),

      // Przychód ten miesiąc (suma totalPrice + extrasTotalPrice, nie-anulowane)
      prisma.reservation.aggregate({
        _sum: { totalPrice: true, extrasTotalPrice: true },
        where: {
          date: { gte: monthStartStr, lt: monthEndStr },
          status: { not: 'CANCELLED' },
        },
      }),

      // Przychód poprzedni miesiąc
      prisma.reservation.aggregate({
        _sum: { totalPrice: true, extrasTotalPrice: true },
        where: {
          date: { gte: prevMonthStartStr, lt: prevMonthEndStr },
          status: { not: 'CANCELLED' },
        },
      }),

      // Łączna liczba klientów
      prisma.client.count(),

      // Nowi klienci ten miesiąc
      prisma.client.count({
        where: {
          createdAt: { gte: new Date(monthStartStr) },
        },
      }),

      // Oczekujące zaliczki (count + suma remainingAmount)
      prisma.deposit.aggregate({
        _count: true,
        _sum: { remainingAmount: true },
        where: {
          status: 'PENDING',
        },
      }),

      // Aktywne sale
      prisma.hall.count({
        where: { isActive: true },
      }),
    ]);

    // Revenue = base price + extras
    const baseRevenueThisMonth = Number(revenueThisMonth._sum.totalPrice || 0);
    const extrasRevenueThisMonthVal = Number(revenueThisMonth._sum.extrasTotalPrice || 0);
    const revenueThisMonthVal = baseRevenueThisMonth + extrasRevenueThisMonthVal;

    const baseRevenuePrevMonth = Number(revenuePrevMonth._sum.totalPrice || 0);
    const extrasRevenuePrevMonth = Number(revenuePrevMonth._sum.extrasTotalPrice || 0);
    const revenuePrevMonthVal = baseRevenuePrevMonth + extrasRevenuePrevMonth;

    const revenueChangePercent =
      revenuePrevMonthVal > 0
        ? Math.round(
            ((revenueThisMonthVal - revenuePrevMonthVal) / revenuePrevMonthVal) * 100
          )
        : 0;

    return {
      reservationsToday,
      reservationsThisWeek,
      reservationsThisMonth,
      queueCount,
      confirmedThisMonth,
      revenueThisMonth: revenueThisMonthVal,
      revenuePrevMonth: revenuePrevMonthVal,
      revenueChangePercent,
      extrasRevenueThisMonth: extrasRevenueThisMonthVal,
      totalClients,
      newClientsThisMonth,
      pendingDepositsCount: pendingDeposits._count || 0,
      pendingDepositsAmount: Number(pendingDeposits._sum.remainingAmount || 0),
      activeHalls,
    };
  }

  /**
   * Get upcoming reservations (from today onwards)
   * Includes relations: Hall, Client, EventType, pending Deposits
   */
  async getUpcoming(limit: number = 10) {
    const todayStr = new Date().toISOString().split('T')[0];

    const reservations = await prisma.reservation.findMany({
      where: {
        date: { gte: todayStr },
        status: { not: 'CANCELLED' },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
      take: limit,
      include: {
        hall: {
          select: { id: true, name: true },
        },
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        eventType: {
          select: { id: true, name: true, color: true },
        },
        deposits: {
          select: { id: true, amount: true, status: true, remainingAmount: true },
          where: { status: 'PENDING' },
        },
      },
    });

    return reservations;
  }
}

export default new StatsService();
