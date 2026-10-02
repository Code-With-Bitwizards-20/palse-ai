import React from 'react';
import Link from 'next/link';
import {
  Scissors,
  ShieldCheck,
  MessageCircle,
  Code2,
  Heart,
  Globe,
  Mail,
  ExternalLink,
} from 'lucide-react';

const PORTFOLIO_URL = 'https://code-with-bitwizards.vercel.app/';
const WHATSAPP_URL = 'https://wa.me/message/CKZZ336X5UN3K1';
const WHATSAPP_DIRECT = 'https://wa.me/923496274499';
const WHATSAPP_DISPLAY = '+92 349 627 4499';

// Complete social and freelance links scraped directly from developer portfolio
export const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    url: 'https://github.com/Code-With-Bitwizards-20',
    category: 'code',
    color: 'hover:text-white hover:border-slate-500 hover:bg-slate-800',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/codewithbitwizards1000',
    category: 'professional',
    color: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/codewithbitwizards?igsh=MWR1OGk0dGZyM2VtbQ==',
    category: 'social',
    color: 'hover:text-[#E4405F] hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/@codewithbitwizards?si=9ZcSsUuvV8Z5-592',
    category: 'video',
    color: 'hover:text-[#FF0000] hover:border-[#FF0000]/40 hover:bg-[#FF0000]/10',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'X (Twitter)',
    url: 'https://x.com/With_Biwizards?t=0_duY1hlkauoAJ8_M6swUQ&s=09',
    category: 'social',
    color: 'hover:text-slate-100 hover:border-slate-400 hover:bg-slate-800',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@codewithbitwizards',
    category: 'video',
    color: 'hover:text-[#25F4EE] hover:border-[#25F4EE]/40 hover:bg-[#25F4EE]/10',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.73 1.34-.07 2.54-.92 2.97-2.19.22-.56.28-1.17.28-1.78.02-4.98-.01-9.96.01-14.94z" />
      </svg>
    ),
  },
  {
    name: 'Threads',
    url: 'https://www.threads.net/@codewithbitwizards',
    category: 'social',
    color: 'hover:text-slate-200 hover:border-slate-500 hover:bg-slate-800',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.186 24C5.462 24 0 18.538 0 11.814 0 5.09 5.462 0 12.186 0c6.643 0 11.99 5.253 12.01 11.87-.01 3.504-1.385 6.84-3.87 9.387-2.502 2.56-5.877 3.943-9.5 3.943h-.64zm.024-21.78c-5.405 0-9.8 4.395-9.8 9.8 0 5.406 4.395 9.8 9.8 9.8 3.123 0 6.033-1.187 8.196-3.344 2.126-2.118 3.3-4.922 3.308-7.898-.017-5.468-4.47-9.858-9.804-9.858zm4.498 12.434c-.167.97-.61 1.764-1.317 2.36-.71.595-1.61.9-2.678.905-1.157 0-2.128-.352-2.884-1.047-.757-.695-1.173-1.677-1.236-2.92.063-1.258.485-2.247 1.254-2.94.77-.693 1.755-1.045 2.93-1.045 1.158 0 2.096.335 2.787.994.493.47.838 1.08 1.025 1.815l-1.956.452c-.104-.424-.298-.767-.58-1.03-.357-.333-.804-.502-1.332-.502-.638 0-1.158.204-1.547.607-.388.404-.585.986-.585 1.732 0 .746.194 1.32.576 1.706.383.385.894.58 1.52.58.558 0 1.02-.158 1.374-.472.353-.314.568-.747.64-1.285l1.447.147z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/share/1BkgnvmquR/',
    category: 'social',
    color: 'hover:text-[#1877F2] hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    url: WHATSAPP_URL,
    category: 'chat',
    color: 'hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>
    ),
  },
  {
    name: 'Upwork',
    url: 'https://www.upwork.com/freelancers/~01b261308dace9725e?mp_source=share',
    category: 'freelance',
    color: 'hover:text-[#14A800] hover:border-[#14A800]/40 hover:bg-[#14A800]/10',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-4.407 0-6.19 3.491-6.666 5.86-1.096-1.666-1.849-3.793-2.22-5.718H6.557v7.625c0 2.479-2.012 4.491-4.491 4.491v2.981c4.12 0 7.472-3.353 7.472-7.472V7.954c.414 1.705 1.227 3.738 2.378 5.485l-2.018 9.58h3.082l1.45-6.883c1.238.835 2.684 1.385 4.131 1.385 3.136 0 5.684-2.548 5.684-5.684 0-3.137-2.548-5.819-5.684-5.819z" />
      </svg>
    ),
  },
  {
    name: 'Fiverr',
    url: 'https://www.fiverr.com/s/BRjgpyb',
    category: 'freelance',
    color: 'hover:text-[#1DBF73] hover:border-[#1DBF73]/40 hover:bg-[#1DBF73]/10',
    icon: (
      <span className="text-[11px] font-black tracking-tighter text-emerald-400 group-hover:text-emerald-300">
        fi.
      </span>
    ),
  },
  {
    name: 'Contra',
    url: 'https://contra.com/codewithbitwizards',
    category: 'freelance',
    color: 'hover:text-amber-400 hover:border-amber-400/40 hover:bg-amber-400/10',
    icon: (
      <span className="text-[12px] font-black tracking-tight text-amber-400 group-hover:text-amber-300">
        C
      </span>
    ),
  },
  {
    name: 'Email Support',
    url: 'mailto:mediatechgseries@gmail.com',
    category: 'email',
    color: 'hover:text-cyan-400 hover:border-cyan-400/40 hover:bg-cyan-400/10',
    icon: <Mail className="h-4 w-4" />,
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-900/60 py-14 text-sm text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:gap-12">
          {/* Brand Info & Core Mission */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                Pulse<span className="text-indigo-400">Cut</span>{' '}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 align-middle">
                  Local AI
                </span>
              </span>
            </Link>
            <p className="text-xs text-slate-300 leading-relaxed">
              Turn one long video into viral, scroll-stopping Shorts in seconds. 100%
              in-browser AI processing — zero cloud uploads, zero subscriptions, complete
              data privacy.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Private by design — 100% on-device AI</span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all group"
              >
                <MessageCircle className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                <span>WhatsApp</span>
              </a>

              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all group"
              >
                <Globe className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                <span>Portfolio ↗</span>
              </a>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Product &amp; Features
            </h3>
            <ul className="space-y-2 text-xs">
              {[
                { href: '/studio', label: 'Studio Editor' },
                { href: '/features', label: 'AI Smart Reframing' },
                { href: '/ai-captions', label: 'Karaoke Subtitle Engine' },
                { href: '/video-to-shorts', label: 'Video to Shorts' },
                { href: '/smart-reframe', label: 'Smart Reframe' },
                { href: '/about', label: 'Architecture & Engine' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Supported Platforms */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Supported Platforms
            </h3>
            <ul className="space-y-2 text-xs">
              {[
                { href: '/platforms/youtube-shorts', label: 'YouTube Shorts (9:16)' },
                { href: '/platforms/tiktok', label: 'TikTok Feed (9:16)' },
                { href: '/platforms/instagram-reels', label: 'Instagram Reels (9:16)' },
                { href: '/platforms/x', label: 'X (Twitter) Clips (1:1 / 4:5)' },
                { href: '/platforms/threads', label: 'Threads Video' },
                { href: '/platforms', label: 'All Platform Formats →' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer & Hire Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Developer &amp; Hire
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <Globe className="h-3.5 w-3.5 text-indigo-400" />
                  Code With Bitwizards Portfolio
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.upwork.com/freelancers/~01b261308dace9725e?mp_source=share"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Hire on Upwork
                </a>
              </li>
              <li>
                <a
                  href="https://www.fiverr.com/s/BRjgpyb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Hire on Fiverr
                </a>
              </li>
              <li>
                <a
                  href="https://contra.com/codewithbitwizards"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  Hire on Contra
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_DIRECT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                  {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href="mailto:mediatechgseries@gmail.com"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-cyan-400" />
                  mediatechgseries@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Developer Portfolio Social Hub Banner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Code2 className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  Connect With Code With Bitwizards
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Available for Hire
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore the developer portfolio, open-source repositories, and social channels.
              </p>
            </div>

            {/* Social Icons Grid */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  title={`${item.name} — Code With Bitwizards`}
                  className={`group flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${item.color}`}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-[11px] text-slate-400">
            © {currentYear} PulseCut Local AI. All rights reserved. 100% Private, Client-Side Studio.
          </p>

          {/* Designed & Developed attribution with clickable portfolio link */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Code2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>Designed &amp; Developed by</span>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors inline-flex items-center gap-1 group"
            >
              <span>Code With Bitwizards</span>
              <Heart className="h-3 w-3 text-pink-500 fill-pink-500 group-hover:scale-125 transition-transform" />
            </a>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <Link href="/privacy" className="hover:text-slate-200 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-200 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-slate-200 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
