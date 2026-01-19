import type { Metadata } from 'next';
import { Sidebar } from '../../components/dashboard/sidebar';
import { Header } from '../../components/dashboard/header';
import { Breadcrumbs } from '../../components/dashboard/breadcrumbs';

export const metadata: Metadata = {
  title: 'Dashboard - Reputation Manager',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex items-center border-b bg-muted/30 px-6 py-3">
          <Breadcrumbs />
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
