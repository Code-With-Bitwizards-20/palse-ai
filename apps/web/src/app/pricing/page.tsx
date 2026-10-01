'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shorts-editor');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      100% Free & Open Local Tool. Redirecting to Studio...
    </div>
  );
}
