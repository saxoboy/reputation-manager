import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Reputation Manager',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
