'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getPackages, deletePackage } from '@/lib/api/menu-packages';
import type { MenuPackage } from '@/types/menu';

export default function PackagesListPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, [templateId]);

  async function loadPackages() {
    try {
      setLoading(true);
      const data = await getPackages(templateId || undefined);
      setPackages(data);
    } catch (error) {
      console.error('Failed to load packages:', error);
      alert('Nie udało się załadować pakietów');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Czy na pewno chcesz usunąć pakiet "${name}"?`)) {
      return;
    }

    try {
      await deletePackage(id);
      alert('Pakiet został usunięty');
      loadPackages();
    } catch (error: any) {
      console.error('Failed to delete package:', error);
      alert(`Błąd: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pakiety menu</h1>
          <p className="text-gray-600 mt-1">
            {templateId
              ? 'Pakiety dla wybranego szablonu'
              : 'Wszystkie pakiety menu w systemie'}
          </p>
        </div>
        <Link
          href={`/dashboard/menu/packages/new${templateId ? `?templateId=${templateId}` : ''}`}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Dodaj pakiet
        </Link>
      </div>

      {/* Packages list */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">
            Brak pakietów do wyświetlenia
          </p>
          <Link
            href={`/dashboard/menu/packages/new${templateId ? `?templateId=${templateId}` : ''}`}
            className="text-blue-600 hover:underline"
          >
            Utwórz pierwszy pakiet
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nazwa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ceny
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {pkg.name}
                        </div>
                        {pkg.shortDescription && (
                          <div className="text-sm text-gray-500">
                            {pkg.shortDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Dorośli: {pkg.pricePerAdult} zł
                    </div>
                    <div className="text-sm text-gray-500">
                      Dzieci: {pkg.pricePerChild} zł
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {pkg.categorySettings?.filter((cs) => cs.isEnabled).length || 0}{' '}
                      kategorii
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {pkg.isPopular && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Popularny
                        </span>
                      )}
                      {pkg.isRecommended && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Polecany
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/menu/packages/${pkg.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edytuj
                    </Link>
                    <button
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
