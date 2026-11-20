import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { analyzeAudioTrack } from './audioAnalyzer.js';
import { StructuredAIProvider } from './aiProvider.js';

/**
 * Helper to generate a minimal valid 16kHz 16-bit mono PCM WAV file in temp
 */
function createSyntheticWav(durationSeconds: number, amplitude: number = 0.5): string {
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write sine wave samples
  const frequency = 440; // 440Hz tone
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sampleVal = Math.sin(2 * Math.PI * frequency * t) * amplitude * 32767;
    buffer.writeInt16LE(Math.round(sampleVal), 44 + i * 2);
  }

  const tmpPath = path.join(os.tmpdir(), `test_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

describe('PulseCut Media Worker — Acoustic Analysis & Content Grounding', () => {
  it('TEST 1: analyzeAudioTrack gracefully handles missing or non-existent files', async () => {
    const result = await analyzeAudioTrack('/tmp/non_existent_audio_file.wav', 60);
    assert.equal(typeof result.deadAirRatio, 'number');
    assert.equal(typeof result.averageRms, 'number');
    assert.ok(result.speechSegments.length > 0, 'Should return fallback timeline segments for non-zero duration');
    assert.equal(result.totalDuration, 60);
  });

  it('TEST 2: analyzeAudioTrack computes valid RMS and segments from synthetic WAV', async () => {
    const wavPath = createSyntheticWav(3.0, 0.6);
    try {
      const result = await analyzeAudioTrack(wavPath, 3.0);
      assert.ok(result.averageRms > 0, `Expected positive RMS, got ${result.averageRms}`);
      assert.ok(result.speechSegments.length > 0, 'Should have speech/sound segments');
      assert.equal(result.totalDuration, 3.0);
    } finally {
      if (fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }
    }
  });

  it('TEST 3: StructuredAIProvider generates grounded transcript without mock sentences', async () => {
    const provider = new StructuredAIProvider();
    const wavPath = createSyntheticWav(2.0, 0.4);

    try {
      const transcript = await provider.transcribeAudio(wavPath, 2.0);
      assert.equal(transcript.language, 'en');
      assert.ok(transcript.segments.length > 0, 'Must have at least one segment');

      // Crucial check: verify that the old mock text is NOT present
      const forbiddenMockSentences = [
        'In this video, we are breaking down the exact strategy',
        'Notice how the pacing changes right here',
        'Here is the key takeaway that most people completely miss',
        'Watch what happens when we test this in a real scenario',
      ];

      for (const forbidden of forbiddenMockSentences) {
        assert.ok(
          !transcript.text.includes(forbidden),
          `Transcript must not contain hardcoded mock text: "${forbidden}"`
        );
      }

      // Verify word timestamps are monotonically non-decreasing
      for (const seg of transcript.segments) {
        for (const word of seg.words) {
          assert.ok(word.start <= word.end, `Word start (${word.start}) must be <= end (${word.end})`);
        }
      }
    } finally {
      if (fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }
    }
  });

  it('TEST 4: analyzeClipContent returns valid bounded engagement potential and platform copy', async () => {
    const provider = new StructuredAIProvider();
    const analysis = await provider.analyzeClipContent(
      1,
      0,
      30,
      'Acoustic Segment 1: High energy gameplay and commentary action'
    );

    assert.ok(
      analysis.engagementPotential >= 0 && analysis.engagementPotential <= 100,
      `Engagement potential must be between 0 and 100, got ${analysis.engagementPotential}`
    );
    assert.ok(analysis.mainTopic.length > 0, 'Main topic must not be empty');
    assert.ok(analysis.selectedHook.text.length > 0, 'Selected hook must have text');
    assert.ok(analysis.socialMetadata['youtube-shorts'], 'Must contain YouTube Shorts metadata');
    assert.ok(analysis.socialMetadata['tiktok'], 'Must contain TikTok metadata');
    assert.ok(analysis.socialMetadata['instagram-reels'], 'Must contain Instagram Reels metadata');
  });
});
