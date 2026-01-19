import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación - Reputation Manager',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
