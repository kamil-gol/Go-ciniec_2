'use client';

import { useEffect, useState } from 'react';
import { depositService } from '@/services/depositService';
import type { Deposit, DepositStatus, DepositFilters } from '@/types/deposit';

interface StatusBadgeProps {
  status: DepositStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
  };

  const labels = {
    PENDING: 'Oczekująca',
    PARTIAL: 'Częściowa',
    PAID: 'Opłacona',
    OVERDUE: 'Przeterminowana',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

interface DepositRowProps {
  deposit: Deposit;
  onView: (id: string) => void;
  onPay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function DepositRow({ deposit, onView, onPay, onEdit, onDelete }: DepositRowProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pl-PL');
  };

  const isOverdue = new Date(deposit.dueDate) < new Date() && !deposit.paid;

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {deposit.reservation?.client.firstName} {deposit.reservation?.client.lastName}
        </div>
        <div className="text-xs text-gray-500">
          {deposit.reservation?.eventType.name} • {deposit.reservation?.hall.name}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {formatCurrency(deposit.amount)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {formatCurrency(deposit.paidAmount)}
      </td>
      <td className="px-6 py-4 text-sm">
        <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}>
          {formatDate(deposit.dueDate)}
        </span>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={deposit.status} />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {deposit.receiptNumber || '—'}
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
        <button
          onClick={() => onView(deposit.id)}
          className="text-blue-600 hover:text-blue-900"
        >
          Szczegóły
        </button>
        {!deposit.paid && (
          <button
            onClick={() => onPay(deposit.id)}
            className="text-green-600 hover:text-green-900"
          >
            Wpłata
          </button>
        )}
        <button
          onClick={() => onEdit(deposit.id)}
          className="text-gray-600 hover:text-gray-900"
        >
          Edytuj
        </button>
        <button
          onClick={() => onDelete(deposit.id)}
          className="text-red-600 hover:text-red-900"
        >
          Usuń
        </button>
      </td>
    </tr>
  );
}

interface DepositListProps {
  onDepositClick?: (depositId: string) => void;
  onPayClick?: (depositId: string) => void;
  onEditClick?: (depositId: string) => void;
  onDeleteClick?: (depositId: string) => void;
}

export default function DepositList({
  onDepositClick,
  onPayClick,
  onEditClick,
  onDeleteClick,
}: DepositListProps) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  // Filters
  const [filters, setFilters] = useState<DepositFilters>({
    status: undefined,
    search: '',
    overdue: false,
  });

  useEffect(() => {
    loadDeposits();
  }, [page, filters]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const response = await depositService.getDeposits({
        page,
        perPage,
        filters,
      });
      setDeposits(response.deposits);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      console.error('Error loading deposits:', err);
      setError('Nie udało się załadować zaliczek');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
    setPage(1);
  };

  const handleStatusFilter = (status?: DepositStatus) => {
    setFilters({ ...filters, status });
    setPage(1);
  };

  const handleOverdueToggle = () => {
    setFilters({ ...filters, overdue: !filters.overdue });
    setPage(1);
  };

  if (loading && deposits.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Szukaj po nazwisku klienta..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter(undefined)}
              className={`px-4 py-2 rounded-lg font-medium ${
                !filters.status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => handleStatusFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Oczekujące
            </button>
            <button
              onClick={() => handleStatusFilter('PAID')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'PAID'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Opłacone
            </button>
          </div>

          {/* Overdue Toggle */}
          <button
            onClick={handleOverdueToggle}
            className={`px-4 py-2 rounded-lg font-medium ${
              filters.overdue
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚠️ Przeterminowane
          </button>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Znaleziono {total} {total === 1 ? 'zaliczkę' : 'zaliczek'}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadDeposits}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {deposits.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak zaliczek
          </h3>
          <p className="text-gray-500">
            {filters.search || filters.status || filters.overdue
              ? 'Nie znaleziono zaliczek spełniających kryteria'
              : 'Nie utworzono jeszcze żadnych zaliczek'}
          </p>
        </div>
      )}

      {deposits.length > 0 && (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kwota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wpłacono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Termin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paragon
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deposits.map((deposit) => (
                  <DepositRow
                    key={deposit.id}
                    deposit={deposit}
                    onView={onDepositClick || (() => {})}
                    onPay={onPayClick || (() => {})}
                    onEdit={onEditClick || (() => {})}
                    onDelete={onDeleteClick || (() => {})}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Strona {page} z {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Poprzednia
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Następna
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
