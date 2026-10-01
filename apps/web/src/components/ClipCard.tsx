'use client';

import React, { useState } from 'react';
import type { GeneratedClip } from '@shorts/shared';
import { type PlatformId } from '@shorts/platform-presets';
import { SafeZoneOverlay } from './SafeZoneOverlay';
import {
  Play,
  Pause,
  Download,
  Edit3,
  Sparkles,
  Layers,
  ChevronDown,
  FileText,
  Eye,
  Check,
  Share2,
} from 'lucide-react';

interface ClipCardProps {
  clip: GeneratedClip;
  onEdit: (clip: GeneratedClip) => void;
  onViewMetadata: (clip: GeneratedClip) => void;
}

export function ClipCard({ clip, onEdit, onViewMetadata }: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [safeZonePlatform, setSafeZonePlatform] = useState<PlatformId | 'none'>('none');
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const videoSrc = clip.previewVideoUrl || `/api/downloads/${encodeURIComponent(clip.detailedFilename)}`;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-800 bg-surface-100 overflow-hidden shadow-lg hover:border-gray-700/80 transition-all">
      {/* 9:16 Video Player Container */}
      <div className="relative aspect-[9/16] w-full bg-black overflow-hidden group">
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="h-full w-full object-cover cursor-pointer"
          onClick={togglePlay}
        />

        {/* Safe Zone Overlay */}
        {safeZonePlatform !== 'none' && (
          <SafeZoneOverlay platformId={safeZonePlatform} visible={true} />
        )}

        {/* Play/Pause Button Overlay on Hover */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
          className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/90 text-white shadow-xl backdrop-blur-md transform transition-transform group-hover:scale-110">
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </div>
        </button>

        {/* Badges on Top */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="rounded-lg bg-black/70 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-md border border-white/10">
            Short #{clip.clipIndex}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="rounded-lg bg-emerald-500/90 px-1.5 py-0.5 text-[11px] font-bold text-black backdrop-blur-md">
              60 FPS CFR
            </span>
            <span className="rounded-lg bg-brand-500/90 px-1.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-md">
              1080×1920
            </span>
          </div>
        </div>

        {/* Safe Zone Selector Toggle */}
        <div className="absolute bottom-2.5 right-2.5 z-40">
          <select
            value={safeZonePlatform}
            onChange={(e) => setSafeZonePlatform(e.target.value as any)}
            className="rounded-lg border border-white/20 bg-black/75 px-2 py-1 text-[11px] text-gray-200 backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Toggle safe zone preview"
          >
            <option value="none">Safe Zones: Off</option>
            <option value="youtube-shorts">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram-reels">Instagram Reels</option>
            <option value="x">X (Twitter)</option>
          </select>
        </div>
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col p-4 space-y-3.5">
        {/* Topic & Duration */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-white text-sm line-clamp-1">{clip.mainTopic}</h4>
            <span className="text-xs text-gray-400">Duration: {Math.round(clip.duration)}s</span>
          </div>
          {/* Engagement Potential Indicator */}
          <div
            title="AI estimate based on content and editing characteristics. It does not guarantee views or virality."
            className="flex items-center gap-1 rounded-lg bg-purple-500/10 border border-purple-500/30 px-2 py-1 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-bold text-purple-300">
              {clip.engagementPotential}% Engagement
            </span>
          </div>
        </div>

        {/* Hook text */}
        <div className="rounded-xl bg-surface-200/90 border border-gray-800 p-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
            Hook Opening
          </span>
          <p className="text-xs font-medium text-brand-300 italic line-clamp-2">
            &ldquo;{clip.selectedHook?.text || 'Engaging opening statement...'}&rdquo;
          </p>
        </div>

        {/* Filename preview */}
        <div className="text-[11px] text-gray-400 truncate">
          File: <span className="font-mono text-gray-300">{clip.detailedFilename}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
          {/* Edit Button */}
          <button
            onClick={() => onEdit(clip)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-700 bg-surface-50 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-brand-400" />
            <span>Customize</span>
          </button>

          {/* Social Metadata Button */}
          <button
            onClick={() => onViewMetadata(clip)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-700 bg-surface-50 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Share2 className="h-3.5 w-3.5 text-accent-cyan" />
            <span>Social Copy</span>
          </button>
        </div>

        {/* Download Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:from-brand-600 hover:to-brand-700 transition-all"
          >
            <div className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>Download Short</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {downloadMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-gray-800 bg-surface-50 p-1.5 shadow-2xl z-50 space-y-1">
              <a
                href={videoSrc}
                download={clip.detailedFilename}
                onClick={() => setDownloadMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-gray-200 hover:bg-brand-500/20 hover:text-white"
              >
                <span>Download 1080p @ 60 FPS</span>
                <span className="font-mono text-[10px] text-gray-400">1080×1920</span>
              </a>

              <a
                href={`/api/projects/${clip.projectId}/clips/${clip.id}/render?quality=2k`}
                download={clip.detailedFilename.replace('1080p', '2k')}
                onClick={() => setDownloadMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-gray-200 hover:bg-brand-500/20 hover:text-white"
              >
                <span>Download 2K QHD @ 60 FPS</span>
                <span className="font-mono text-[10px] text-gray-400">1440×2560</span>
              </a>

              <a
                href={`/api/projects/${clip.projectId}/clips/${clip.id}/render?quality=4k`}
                download={clip.detailedFilename.replace('1080p', '4k')}
                onClick={() => setDownloadMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-gray-200 hover:bg-brand-500/20 hover:text-white"
              >
                <span>Download 4K UHD @ 60 FPS</span>
                <span className="font-mono text-[10px] text-gray-400">2160×3840</span>
              </a>

              {clip.srtUrl && (
                <a
                  href={clip.srtUrl}
                  download={`short_${clip.clipIndex}_captions.srt`}
                  onClick={() => setDownloadMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-accent-amber" />
                    <span>Download SRT Subtitles</span>
                  </span>
                </a>
              )}

              {clip.vttUrl && (
                <a
                  href={clip.vttUrl}
                  download={`short_${clip.clipIndex}_captions.vtt`}
                  onClick={() => setDownloadMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-emerald-400" />
                    <span>Download VTT Subtitles</span>
                  </span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
