'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Check, Globe, ExternalLink, Code2 } from 'lucide-react';
import Link from 'next/link';

const PORTFOLIO_URL = 'https://code-with-bitwizards.vercel.app/';
const WHATSAPP_URL = 'https://wa.me/message/CKZZ336X5UN3K1';
const WHATSAPP_DIRECT = 'https://wa.me/923496274499';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
          <Code2 className="h-3.5 w-3.5" />
          PulseCut Engineering &amp; Development
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Get in Touch with the Creator
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Built by <strong className="text-white">Code With Bitwizards</strong>. Reach out for custom video pipelines, client-side WebAssembly tools, or enterprise custom presets.
        </p>
      </div>

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* WhatsApp Card */}
        <a
          href={WHATSAPP_DIRECT}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Direct WhatsApp</h3>
            <p className="text-xs text-gray-400">Fastest response for inquiries &amp; project collabs.</p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
            +92 349 627 4499 ↗
          </span>
        </a>

        {/* Portfolio Card */}
        <a
          href={PORTFOLIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Developer Portfolio</h3>
            <p className="text-xs text-gray-400">Code With Bitwizards projects &amp; case studies.</p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
            View Live Portfolio ↗
          </span>
        </a>

        {/* Email Card */}
        <a
          href="mailto:mediatechgseries@gmail.com"
          className="group rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/10 flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Direct Email</h3>
            <p className="text-xs text-gray-400">mediatechgseries@gmail.com</p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
            Send an Email ↗
          </span>
        </a>
      </div>

      {/* Contact Form */}
      <div className="rounded-2xl border border-gray-800 bg-surface-100 p-6 sm:p-8 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Send a Direct Message</h2>
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Message Dispatched</h3>
            <p className="text-xs text-gray-400">
              Our engineering team responds promptly within 24 hours.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-300 font-medium">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-gray-700 bg-surface-200 px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-300 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  className="w-full rounded-xl border border-gray-700 bg-surface-200 px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 font-medium">Message or Technical Inquiry</label>
              <textarea
                rows={4}
                required
                placeholder="Tell us about your project, custom feature requests, or inquiries..."
                className="w-full rounded-xl border border-gray-700 bg-surface-200 px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
