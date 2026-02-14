'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PackageForm from '@/components/menu/PackageForm';
import { getPackageById } from '@/lib/api/menu-packages-api';
import type { MenuPackage } from '@/types/menu';

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;

  const [pkg, setPkg] = useState<MenuPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackage();
  }, [packageId]);

  async function loadPackage() {
    try {
      setLoading(true);
      const data = await getPackageById(packageId);
      setPkg(data);
    } catch (error: any) {
      console.error('Failed to load package:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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

  if (error || !pkg) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Błąd</h2>
          <p className="text-red-600">{error || 'Nie znaleziono pakietu'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Wróć
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-600 mb-6">
        <a href="/dashboard" className="hover:text-gray-900">
          Dashboard
        </a>
        {' > '}
        <a href="/dashboard/menu" className="hover:text-gray-900">
          Menu
        </a>
        {' > '}
        <a href="/dashboard/menu/packages" className="hover:text-gray-900">
          Pakiety
        </a>
        {' > '}
        <span className="text-gray-900">{pkg.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edytuj pakiet</h1>
        <p className="text-gray-600 mt-2">{pkg.name}</p>
      </div>

      {/* Form */}
      <PackageForm
        menuTemplateId={pkg.menuTemplateId}
        initialData={pkg}
        onSuccess={() => {
          router.push(
            `/dashboard/menu/packages?templateId=${pkg.menuTemplateId}`
          );
        }}
      />
    </div>
  );
}
