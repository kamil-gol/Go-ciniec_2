'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PackageForm from '@/components/menu/PackageForm';
import { getPackageById, type MenuPackage } from '@/lib/api/menu-packages-api';
import { LoadingState } from '@/components/shared/LoadingState';

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;

  const [pkg, setPkg] = useState<MenuPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPackage = useCallback(async () => {
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
  }, [packageId]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  if (loading) {
    return (
      <div className="p-8">
        <LoadingState variant="skeleton" count={2} />
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
      <nav className="text-sm text-neutral-600 mb-6">
        <Link href="/dashboard" className="hover:text-neutral-900">
          Dashboard
        </Link>
        {' > '}
        <Link href="/dashboard/menu" className="hover:text-neutral-900">
          Menu
        </Link>
        {' > '}
        <Link href="/dashboard/menu/packages" className="hover:text-neutral-900">
          Pakiety
        </Link>
        {' > '}
        <span className="text-neutral-900">{pkg.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Edytuj pakiet</h1>
        <p className="text-neutral-600 mt-2">{pkg.name}</p>
      </div>

      {/* Form */}
      <PackageForm
        menuTemplateId={pkg.menuTemplateId}
        initialData={pkg as any}
        onSuccess={() => {
          router.push('/dashboard/menu/packages');
        }}
      />
    </div>
  );
}
