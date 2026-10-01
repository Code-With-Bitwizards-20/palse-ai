'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShortsEditorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/studio');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      Opening PulseCut Local AI Studio...
    </div>
  );
}
