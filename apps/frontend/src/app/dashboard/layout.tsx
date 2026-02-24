import SessionTimeoutModal from './components/SessionTimeoutModal';
import DashboardNav from './components/DashboardNav';

/**
 * 🏠 Dashboard Layout (#145 + #144)
 *
 * Wrapper dla wszystkich stron w /dashboard/*.
 * - DashboardNav: sidebar navigation z linkami do sekcji
 * - SessionTimeoutModal: idle detection po zalogowaniu
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <SessionTimeoutModal />
    </div>
  );
}
