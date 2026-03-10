import { redirect } from 'next/navigation';

/**
 * /dashboard/catering — redirectuje do /dashboard/catering/templates
 * Sidebar linkuje do tego URL jako root sekcji Catering.
 */
export default function CateringRootPage() {
  redirect('/dashboard/catering/templates');
}
