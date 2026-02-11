'use client';

import { useEffect, useState } from 'react';
import { depositService } from '@/services/depositService';
import type { DepositStatistics } from '@/types/deposit';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function DepositStats() {
  const [stats, setStats] = useState<DepositStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await depositService.getStatistics();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError('Nie udało się załadować statystyk');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error || 'Błąd ładowania'}</p>
        <button
          onClick={loadStats}
          className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Wszystkie zaliczki"
        value={stats.totalDeposits}
        subtitle={formatCurrency(stats.totalAmount)}
        icon="💰"
        color="blue"
      />

      <StatCard
        title="Opłacone"
        value={stats.paidCount}
        subtitle={formatCurrency(stats.totalPaid)}
        icon="✅"
        color="green"
      />

      <StatCard
        title="Oczekujące"
        value={stats.pendingCount}
        subtitle={formatCurrency(stats.totalRemaining)}
        icon="⏳"
        color="yellow"
      />

      <StatCard
        title="Przeterminowane"
        value={stats.overdueCount}
        subtitle={
          stats.upcomingDueCount > 0
            ? `${stats.upcomingDueCount} wkrótce`
            : undefined
        }
        icon="⚠️"
        color={stats.overdueCount > 0 ? 'red' : 'gray'}
      />
    </div>
  );
}
