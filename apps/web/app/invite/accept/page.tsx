import { Suspense } from 'react';
import { InviteAcceptContent } from './invite-accept-content';

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Cargando...
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
