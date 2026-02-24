'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Suspense, useState, type ReactNode } from 'react';
import { TooltipProvider } from './ui/tooltip';
import { PostHogProvider } from './providers/posthog-provider';
import { PostHogPageview } from './providers/posthog-pageview';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          <TooltipProvider>{children}</TooltipProvider>
        </PostHogProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
