import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateClips, formatDuration } from './clipMath.js';

describe('clipMath - Primary Duration & Splitting Calculations', () => {
  it('CRITICAL TEST 1: 300s source with 30s clips produces exactly 10 complete clips', () => {
    const result = calculateClips(300, 30, 'ignore');
    assert.equal(result.fullClipCount, 10);
    assert.equal(result.remainder, 0);
    assert.equal(result.estimatedOutputs, 10);
    assert.equal(result.clips.length, 10);

    // Verify seamless boundaries without drift
    for (let i = 0; i < 10; i++) {
      const clip = result.clips[i];
      assert.equal(clip.index, i + 1);
      assert.equal(clip.startTime, i * 30);
      assert.equal(clip.endTime, (i + 1) * 30);
      assert.equal(clip.duration, 30);
      assert.equal(clip.isRemainder, false);
      assert.equal(clip.isOverlapping, false);
    }
  });

  it('CRITICAL TEST 2: 300s source with 60s clips produces exactly 5 complete clips', () => {
    const result = calculateClips(300, 60, 'ignore');
    assert.equal(result.fullClipCount, 5);
    assert.equal(result.remainder, 0);
    assert.equal(result.estimatedOutputs, 5);
    assert.equal(result.clips.length, 5);

    for (let i = 0; i < 5; i++) {
      const clip = result.clips[i];
      assert.equal(clip.index, i + 1);
      assert.equal(clip.startTime, i * 60);
      assert.equal(clip.endTime, (i + 1) * 60);
      assert.equal(clip.duration, 60);
    }
  });

  it('handles remainder correctly with strategy: "ignore"', () => {
    // 320s source with 60s target -> 5 full clips, 20s remainder
    const result = calculateClips(320, 60, 'ignore');
    assert.equal(result.fullClipCount, 5);
    assert.equal(result.remainder, 20);
    assert.equal(result.estimatedOutputs, 5);
    assert.equal(result.clips.length, 5);
    assert.equal(result.clips[4].endTime, 300);
  });

  it('handles remainder correctly with strategy: "shorter-final"', () => {
    // 320s source with 60s target -> 5 full clips + 1 final clip of 20s
    const result = calculateClips(320, 60, 'shorter-final');
    assert.equal(result.fullClipCount, 5);
    assert.equal(result.remainder, 20);
    assert.equal(result.estimatedOutputs, 6);
    assert.equal(result.clips.length, 6);
    assert.equal(result.clips[5].duration, 20);
    assert.equal(result.clips[5].isRemainder, true);
    assert.equal(result.clips[5].startTime, 300);
    assert.equal(result.clips[5].endTime, 320);
  });

  it('handles remainder correctly with strategy: "redistribute"', () => {
    // 320s source with 60s target redistributed
    const result = calculateClips(320, 60, 'redistribute');
    assert.equal(result.fullClipCount, 5);
    // targetCount = 5 since 20s < 30s (50% of 60s)
    assert.equal(result.estimatedOutputs, 5);
    assert.equal(result.clips.length, 5);
    // 320 / 5 = 64s each
    assert.equal(result.clips[0].duration, 64);
    assert.equal(result.clips[4].endTime, 320);
  });

  it('handles remainder correctly with strategy: "controlled-overlap"', () => {
    // 320s source with 60s target -> 5 full clips + 1 overlapping 60s clip anchored at end (260s to 320s)
    const result = calculateClips(320, 60, 'controlled-overlap');
    assert.equal(result.fullClipCount, 5);
    assert.equal(result.estimatedOutputs, 6);
    assert.equal(result.clips.length, 6);
    const lastClip = result.clips[5];
    assert.equal(lastClip.duration, 60);
    assert.equal(lastClip.startTime, 260);
    assert.equal(lastClip.endTime, 320);
    assert.equal(lastClip.isOverlapping, true);
  });

  it('formats durations correctly for UI', () => {
    assert.equal(formatDuration(30), '00:30');
    assert.equal(formatDuration(300), '05:00');
    assert.equal(formatDuration(3665), '01:01:05');
  });
});
