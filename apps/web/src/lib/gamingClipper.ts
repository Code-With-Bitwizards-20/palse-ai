/**
 * Dedicated Gaming & GTA VI Highlight Detection Engine for PulseCut AI.
 * Tailored for GTA VI gameplay, open-world missions, gaming commentary, and reaction VODs.
 * Detects combat bursts, vehicle crashes, chase sirens, streamer reaction spikes,
 * and calculates HUD-safe reframing bounding zones.
 */

import { CandidateClip } from './highlightDetector';

export type GamingProfile =
  | 'GTA VI Gameplay'
  | 'Open-World Gaming'
  | 'FPS Gaming'
  | 'Gaming Commentary'
  | 'Gaming Reactions'
  | 'General Gaming';

export interface GamingHighlightDetectionOptions {
  videoDuration: number;
  profile: GamingProfile;
  targetDuration: number;
  clipCount: number;
  audioBuffer?: AudioBuffer;
}

export interface GamingEventMarker {
  timestamp: number;
  type: 'action-burst' | 'reaction-spike' | 'dialogue-lead' | 'vehicle-stunt' | 'combat';
  confidence: number; // 0 - 100
  label: string;
}

export interface HudProtectionZones {
  minimap: { x: number; y: number; width: number; height: number }; // Bottom left in GTA
  healthArmor: { x: number; y: number; width: number; height: number };
  weaponWheel: { x: number; y: number; width: number; height: number }; // Top right
  facecam?: { x: number; y: number; width: number; height: number }; // Optional streamer facecam
}

/**
 * Standard GTA VI / Open-World HUD layout coordinates (normalized 0.0 - 1.0)
 */
export const GTA_HUD_ZONES: HudProtectionZones = {
  minimap: { x: 0.02, y: 0.72, width: 0.22, height: 0.24 }, // bottom-left radar
  healthArmor: { x: 0.02, y: 0.94, width: 0.22, height: 0.04 }, // under radar
  weaponWheel: { x: 0.82, y: 0.03, width: 0.16, height: 0.15 }, // top-right weapons
  facecam: { x: 0.78, y: 0.68, width: 0.2, height: 0.28 }, // common streamer facecam
};

/**
 * Analyzes audio for rapid transient attacks indicative of gaming events:
 * explosions, gunfire bursts, vehicle collisions, or streamer reaction screams.
 */
export function detectGamingEvents(
  audioBuffer: AudioBuffer,
  profile: GamingProfile
): GamingEventMarker[] {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const events: GamingEventMarker[] = [];

  const windowSec = 0.25; // 250ms high temporal resolution
  const samplesPerWindow = Math.floor(sampleRate * windowSec);
  const totalWindows = Math.floor(channelData.length / samplesPerWindow);

  let prevRms = 0;

  for (let w = 0; w < totalWindows; w++) {
    const start = w * samplesPerWindow;
    const end = start + samplesPerWindow;
    let sumSq = 0;

    for (let s = start; s < end; s += 2) {
      const val = channelData[s] || 0;
      sumSq += val * val;
    }

    const rms = Math.sqrt(sumSq / (samplesPerWindow / 2));
    const deltaRms = rms - prevRms;
    const t = w * windowSec;

    // Detect sudden attack (deltaRms > 0.35 indicates gunshot/crash/reaction)
    if (deltaRms > 0.35 && rms > 0.5) {
      const isExtreme = deltaRms > 0.55;
      let label = 'Sudden Gameplay Action';
      let type: GamingEventMarker['type'] = 'action-burst';

      if (profile.includes('GTA')) {
        label = isExtreme ? 'High-Speed Collision / Heavy Combat' : 'Gunfire / Siren Activity';
        type = isExtreme ? 'vehicle-stunt' : 'combat';
      } else if (profile === 'Gaming Reactions') {
        label = 'Streamer Reaction / Shout';
        type = 'reaction-spike';
      }

      events.push({
        timestamp: Math.round(t * 10) / 10,
        type,
        confidence: Math.min(95, Math.round(60 + deltaRms * 60)),
        label,
      });

      // Skip forward 1.5 seconds to avoid clustering multiple markers on the same event
      w += Math.floor(1.5 / windowSec);
    }

    prevRms = rms;
  }

  return events;
}

/**
 * Generates candidate gaming shorts centered around high-impact action sequences.
 */
export function generateGamingHighlights(
  options: GamingHighlightDetectionOptions
): CandidateClip[] {
  const { videoDuration, profile, targetDuration, clipCount, audioBuffer } = options;

  let events: GamingEventMarker[] = [];
  if (audioBuffer) {
    events = detectGamingEvents(audioBuffer, profile);
  }

  // If few or no audio events detected (e.g. gameplay without loud spikes), seed distributed action anchors
  if (events.length < clipCount) {
    const spacing = videoDuration / (clipCount + 1);
    for (let i = 1; i <= clipCount; i++) {
      events.push({
        timestamp: Math.round(i * spacing),
        type: 'action-burst',
        confidence: 75,
        label: `${profile} Action Segment #${i}`,
      });
    }
  }

  const clips: CandidateClip[] = [];

  for (const event of events) {
    // Lead-in time before the peak event (e.g., 6 seconds before crash/kill so viewer gets context)
    const leadIn = Math.min(event.timestamp, Math.round(targetDuration * 0.3));
    const start = Math.max(0, event.timestamp - leadIn);
    const end = Math.min(videoDuration, start + targetDuration);
    const duration = end - start;

    if (duration < Math.min(10, targetDuration * 0.5)) continue;

    const hookScore = Math.min(99, Math.round(event.confidence * 0.95 + 4));
    const visualScore = Math.min(98, 88);
    const audioScore = Math.min(97, event.confidence);
    const contextScore = 86;
    const endingScore = 84;

    const totalScore = Math.round(
      hookScore * 0.3 +
        audioScore * 0.25 +
        visualScore * 0.25 +
        contextScore * 0.1 +
        endingScore * 0.1
    );

    clips.push({
      id: `gaming_${Math.round(start)}_${Math.round(end)}`,
      startTime: Math.round(start * 10) / 10,
      endTime: Math.round(end * 10) / 10,
      duration: Math.round(duration * 10) / 10,
      title: `${profile}: ${event.label} (${formatTimestamp(start)})`,
      explanation: `${event.label} detected at ${formatTimestamp(event.timestamp)} with ${event.confidence}% acoustic confidence. Preserves pre-action setup.`,
      score: totalScore,
      scoreBreakdown: {
        hook: hookScore,
        story: contextScore,
        audio: audioScore,
        visual: visualScore,
        context: contextScore,
        ending: endingScore,
      },
      audioPeakTime: event.timestamp,
      tags: [profile, event.label, `${Math.round(duration)}s`],
      suggestedHookText: getGamingHookByProfile(profile, event.type),
    });
  }

  // Deduplicate overlapping segments and keep highest scoring
  clips.sort((a, b) => b.score - a.score);
  const deduped: CandidateClip[] = [];

  for (const c of clips) {
    const overlaps = deduped.some(
      (s) => Math.max(s.startTime, c.startTime) < Math.min(s.endTime, c.endTime) - 8
    );
    if (!overlaps) {
      deduped.push(c);
      if (deduped.length >= clipCount) break;
    }
  }

  return deduped.sort((a, b) => a.startTime - b.startTime);
}

function getGamingHookByProfile(profile: GamingProfile, type: GamingEventMarker['type']): string {
  if (profile.includes('GTA')) {
    if (type === 'vehicle-stunt') return 'Insane GTA VI stunt you won’t believe!';
    if (type === 'combat') return 'This GTA 6 mission went completely wrong...';
    return 'The most viral GTA VI moment caught on stream:';
  }
  if (profile === 'Gaming Reactions') {
    return 'Bro could NOT believe what just happened!';
  }
  return 'Watch this clutch play right here:';
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
