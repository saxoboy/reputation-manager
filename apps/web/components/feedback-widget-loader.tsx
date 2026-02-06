'use client';

import dynamic from 'next/dynamic';

const FeedbackWidget = dynamic(
  () => import('./feedback-widget').then((mod) => mod.FeedbackWidget),
  { ssr: false },
);

export function FeedbackWidgetLoader() {
  return <FeedbackWidget />;
}
