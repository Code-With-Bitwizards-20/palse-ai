'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shorts-editor');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      No account required. Redirecting to Local AI Shorts Studio...
    </div>
  );
}
