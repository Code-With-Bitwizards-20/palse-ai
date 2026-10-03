'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scissors,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  Video,
  Type,
  Maximize2,
  Layers,
  Globe,
  Lock,
  Info,
  ChevronRight,
} from 'lucide-react';

const navLinks = [
  { href: '/studio', label: 'Studio', icon: Sparkles },
  { href: '/video-to-shorts', label: 'Video to Shorts', icon: Video },
  { href: '/ai-captions', label: 'AI Captions', icon: Type },
  { href: '/smart-reframe', label: 'Smart Reframe', icon: Maximize2 },
  { href: '/features', label: 'Features', icon: Layers },
  { href: '/platforms', label: 'Platforms', icon: Globe },
  { href: '/privacy', label: 'Privacy', icon: Lock },
  { href: '/about', label: 'About', icon: Info },
];

export function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  // Use position:fixed on body — overflow:hidden breaks touch events
  // on fixed elements in mobile Safari/Chrome
  useEffect(() => {
    if (sidebarOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [sidebarOpen]);

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20">
              <Scissors className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-white sm:text-lg whitespace-nowrap">
              Pulse<span className="text-indigo-400">Cut</span>{' '}
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 align-middle">
                Local AI
              </span>
            </span>
          </Link>

          {/* Center: Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-300">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'text-indigo-300 bg-indigo-500/10 font-bold'
                      : 'hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: CTA + Hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop CTA */}
            <Link
              href="/studio"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-indigo-700 transition-all active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Create Shorts</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>

            {/* Hamburger — visible below lg */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Sidebar Backdrop ── */}
      <div
        className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-full bg-slate-900 flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20">
              <Scissors className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              Pulse<span className="text-indigo-400">Cut</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Privacy chips */}
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-800/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3" />
            100% Local Processing
          </span>
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
            No Account Required
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-all group ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-indigo-500/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </span>
                <ChevronRight className={`h-4 w-4 transition-transform ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300 group-hover:translate-x-0.5'}`} />
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer CTA */}
        <div className="px-5 pb-8 pt-4 border-t border-slate-800 space-y-3">
          <Link
            href="/studio"
            onClick={() => setSidebarOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-indigo-700 transition-all active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Launch Studio — It&apos;s Free</span>
          </Link>
          <p className="text-center text-[11px] text-slate-400">
            No signup · No upload · 100% private
          </p>
        </div>
      </aside>
    </>
  );
}
