import SessionTimeoutModal from './components/SessionTimeoutModal';

/**
 * 🏠 Dashboard Layout (#145)
 *
 * Wrapper dla wszystkich stron w /dashboard/*.
 * Renderuje SessionTimeoutModal globalnie — idle detection
 * działa na każdej podstronie po zalogowaniu.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SessionTimeoutModal />
    </>
  );
}
