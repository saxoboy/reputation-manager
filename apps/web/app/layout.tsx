import './global.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '../components/providers';
import { Toaster } from '../components/ui/sonner';
import { ApiConnectionStatus } from '../components/api-connection-status';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title:
    'Reputation Manager - Gestión de Feedback para Profesionales de la Salud',
  description:
    'Sistema automatizado de gestión de reseñas y feedback para médicos y odontólogos en Ecuador',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
          <ApiConnectionStatus />
        </Providers>
      </body>
    </html>
  );
}
