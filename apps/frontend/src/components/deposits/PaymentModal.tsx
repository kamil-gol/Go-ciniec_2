'use client';

import { useState } from 'react';
import { depositService } from '@/services/depositService';
import type { Deposit, PaymentMethod } from '@/types/deposit';

interface PaymentModalProps {
  deposit: Deposit;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  deposit,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const remainingAmount = parseFloat(deposit.remainingAmount);
  const isFullPayment = parseFloat(amount || '0') >= remainingAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const paymentAmount = parseFloat(amount);

    // Validation
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Kwota musi być większa od 0');
      return;
    }

    if (paymentAmount > remainingAmount) {
      setError(
        `Kwota nie może być większa niż pozostała kwota (${formatCurrency(deposit.remainingAmount)})`
      );
      return;
    }

    try {
      setLoading(true);
      await depositService.addPayment(deposit.id, {
        amount: paymentAmount,
        paymentMethod,
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding payment:', err);
      setError(
        err.response?.data?.error || 'Nie udało się dodać wpłaty'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = remainingAmount * (percentage / 100);
    setAmount(quickAmount.toFixed(2));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Dodaj wpłatę
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {deposit.reservation?.client.firstName}{' '}
            {deposit.reservation?.client.lastName}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Deposit Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Całkowita kwota:</span>
              <span className="font-semibold">
                {formatCurrency(deposit.amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Już wpłacono:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(deposit.paidAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-900 font-medium">Pozostało:</span>
              <span className="font-bold text-lg text-blue-600">
                {formatCurrency(deposit.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kwota wpłaty (PLN) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(50)}
                className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(100)}
                className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Całość
              </button>
              <button
                type="button"
                onClick={() => setAmount('')}
                className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Wyczyść
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metoda płatności *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  paymentMethod === 'CASH'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                💵 Gotówka
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                🏦 Przelew
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                💳 Karta
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notatki (opcjonalnie)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dodatkowe informacje o wpłacie..."
            />
          </div>

          {/* Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-1">
                {isFullPayment ? '✅ Opłacenie pełnej kwoty' : '💵 Wpłata częściowa'}
              </div>
              <div className="text-xs text-blue-700">
                {isFullPayment
                  ? 'Zaliczka zostanie oznaczona jako opłacona i zostanie wygenerowany paragon.'
                  : `Po tej wpłacie pozostało będzie: ${formatCurrency(
                      (remainingAmount - parseFloat(amount)).toFixed(2)
                    )}`}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Przetwarzanie...' : isFullPayment ? 'Oznacz jako opłaconą' : 'Dodaj wpłatę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
