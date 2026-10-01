import React from 'react';

export const metadata = {
  title: 'Terms of Service | PulseCut Local AI',
  description: 'Terms and content rights agreement for using the PulseCut Local AI platform.',
};

export default function TermsPage() {
  const year = new Date().getFullYear();
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-8 text-xs text-gray-300 leading-relaxed">
      <h1 className="text-3xl font-extrabold text-white tracking-tight">Terms of Service</h1>
      <p className="text-gray-400">Last updated: {year}</p>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-white">1. Content Rights & Permissions</h2>
        <p>
          By uploading any video to ShortsEngine, you warrant that you either own the copyright to
          the media or have obtained express authorization to edit, reformat, and process it. You
          agree not to upload infringing, unlawful, or copyrighted commercial audio without proper
          licensing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-white">2. No Guaranteed Virality</h2>
        <p>
          ShortsEngine provides tools for optimization, framing, and captioning. We explicitly do
          not guarantee video views, impressions, follower growth, or viral ranking on any
          third-party social media platform.
        </p>
      </section>
    </div>
  );
}
