'use client';

import { useState, useEffect } from 'react';
import DepositStats from '@/components/deposits/DepositStats';
import DepositList from '@/components/deposits/DepositList';
import PaymentModal from '@/components/deposits/PaymentModal';
import { depositService } from '@/services/depositService';
import type { Deposit } from '@/types/deposit';

export default function DepositsPage() {
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePayClick = async (depositId: string) => {
    try {
      const deposit = await depositService.getDeposit(depositId);
      setSelectedDeposit(deposit);
      setIsPaymentModalOpen(true);
    } catch (err) {
      console.error('Error loading deposit:', err);
      alert('Nie udało się załadować zaliczki');
    }
  };

  const handlePaymentSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setIsPaymentModalOpen(false);
    setSelectedDeposit(null);
  };

  const handleDepositClick = (depositId: string) => {
    // TODO: Navigate to deposit details page
    console.log('View deposit:', depositId);
  };

  const handleEditClick = (depositId: string) => {
    // TODO: Open edit modal
    console.log('Edit deposit:', depositId);
  };

  const handleDeleteClick = async (depositId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę zaliczkę?')) {
      return;
    }

    try {
      await depositService.deleteDeposit(depositId);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Error deleting deposit:', err);
      alert('Nie udało się usunąć zaliczki');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💰 Zaliczki
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Zarządzaj zaliczkami i płatnościami
              </p>
            </div>
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
              onClick={() => {
                // TODO: Open create deposit modal
                alert('Formularz tworzenia zaliczki - TODO');
              }}
            >
              + Nowa zaliczka
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8" key={`stats-${refreshKey}`}>
          <DepositStats />
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow" key={`list-${refreshKey}`}>
          <DepositList
            onDepositClick={handleDepositClick}
            onPayClick={handlePayClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />
        </div>
      </div>

      {/* Payment Modal */}
      {selectedDeposit && (
        <PaymentModal
          deposit={selectedDeposit}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedDeposit(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
