import './global.css';
import type { Metadata } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '../components/providers';
import { Toaster } from '../components/ui/sonner';
import { ApiConnectionStatus } from '../components/api-connection-status';
import { FeedbackWidgetLoader } from '../components/feedback-widget-loader';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
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
    <html
      lang="es"
      className={`${displayFont.variable} ${sansFont.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
          <ApiConnectionStatus />
          <FeedbackWidgetLoader />
        </Providers>
      </body>
    </html>
  );
}
