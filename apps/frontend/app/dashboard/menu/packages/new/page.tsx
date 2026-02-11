'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import PackageForm from '@/components/menu/PackageForm';

export default function NewPackagePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('templateId');

  if (!templateId) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Brak szablonu menu
          </h2>
          <p className="text-red-600">
            Aby utworzyć pakiet, musisz podać templateId w URL.
          </p>
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
        <span className="text-gray-900">Nowy pakiet</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nowy pakiet menu</h1>
        <p className="text-gray-600 mt-2">
          Utwórz nowy pakiet z wybranymi kategoriami dań dla gósci
        </p>
      </div>

      {/* Form */}
      <PackageForm
        menuTemplateId={templateId}
        onSuccess={() => {
          router.push(`/dashboard/menu/packages?templateId=${templateId}`);
        }}
      />
    </div>
  );
}
