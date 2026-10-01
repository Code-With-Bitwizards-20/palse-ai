/**
 * Device Capability Detector for Local AI Shorts Studio.
 * Evaluates browser capabilities, WebCodecs hardware profiles, WebGPU,
 * memory, canvas limits, and tests VideoEncoder.isConfigSupported()
 * for 1080p, 2K, and 4K at 60 FPS.
 */

export type DevicePerformanceLevel = 'Excellent' | 'Good' | 'Limited' | 'Compatibility Mode';

export interface EncodeConfigTestResult {
  supported: boolean;
  codec: string;
  width: number;
  height: number;
  framerate: number;
  bitrate: number;
  error?: string;
}

export interface DeviceCapabilities {
  webGPU: boolean;
  webCodecs: boolean;
  videoEncoder: boolean;
  videoDecoder: boolean;
  offscreenCanvas: boolean;
  sharedArrayBuffer: boolean;
  fileSystemAccess: boolean;
  opfsSupported: boolean;
  hardwareConcurrency: number;
  deviceMemoryGb: number | null;
  storageEstimateMb: number | null;
  maxCanvasDimension: number;
  encode1080p60: EncodeConfigTestResult;
  encode2k60: EncodeConfigTestResult;
  encode4k60: EncodeConfigTestResult;
  performanceLevel: DevicePerformanceLevel;
  recommendations: string[];
  warnings: string[];
}

const H264_CODECS = [
  'avc1.640033', // High Profile Level 5.1 (standard for 1080p60 & 4K)
  'avc1.4d4028', // Main Profile Level 4.0
  'avc1.42e01e', // Baseline Profile Level 3.0
];

/**
 * Test whether a given video encoding configuration is supported by the browser hardware/software.
 */
export async function testEncodeConfig(
  width: number,
  height: number,
  framerate: number = 60,
  bitrate: number = 10_000_000
): Promise<EncodeConfigTestResult> {
  if (typeof window === 'undefined' || typeof VideoEncoder === 'undefined') {
    return {
      supported: false,
      codec: 'none',
      width,
      height,
      framerate,
      bitrate,
      error: 'WebCodecs VideoEncoder not available in this environment.',
    };
  }

  for (const codec of H264_CODECS) {
    try {
      const config: VideoEncoderConfig = {
        codec,
        width,
        height,
        bitrate,
        framerate,
        hardwareAcceleration: 'prefer-hardware',
      };

      const support = await VideoEncoder.isConfigSupported(config);
      if (support.supported) {
        return {
          supported: true,
          codec,
          width,
          height,
          framerate,
          bitrate,
        };
      }
    } catch {
      // Continue to next profile candidate
    }
  }

  // Also test without hardware acceleration requirement as fallback
  try {
    const config: VideoEncoderConfig = {
      codec: 'avc1.42e01e',
      width,
      height,
      bitrate,
      framerate,
      hardwareAcceleration: 'no-preference',
    };
    const support = await VideoEncoder.isConfigSupported(config);
    if (support.supported) {
      return {
        supported: true,
        codec: 'avc1.42e01e',
        width,
        height,
        framerate,
        bitrate,
      };
    }
  } catch (err) {
    return {
      supported: false,
      codec: 'none',
      width,
      height,
      framerate,
      bitrate,
      error: err instanceof Error ? err.message : 'Encode config test failed',
    };
  }

  return {
    supported: false,
    codec: 'none',
    width,
    height,
    framerate,
    bitrate,
    error: 'No compatible H.264 profile found for this resolution/framerate.',
  };
}

/**
 * Determine the maximum practical 2D canvas dimension without throwing memory errors.
 */
function getMaxCanvasDimension(): number {
  if (typeof window === 'undefined') return 4096;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl && typeof gl.getParameter === 'function') {
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      return maxTextureSize || 4096;
    }
  } catch {
    // fallback
  }
  return 4096;
}

/**
 * Comprehensive device capability detection.
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const isClient = typeof window !== 'undefined';
  const nav = isClient ? window.navigator : ({} as Navigator);

  const webGPU = isClient && 'gpu' in nav && typeof (nav as any).gpu?.requestAdapter === 'function';
  const videoEncoder = isClient && typeof VideoEncoder !== 'undefined';
  const videoDecoder = isClient && typeof VideoDecoder !== 'undefined';
  const webCodecs = videoEncoder && videoDecoder;
  const offscreenCanvas = isClient && typeof OffscreenCanvas !== 'undefined';
  const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const fileSystemAccess = isClient && typeof (window as any).showSaveFilePicker === 'function';
  const opfsSupported = isClient && typeof nav.storage?.getDirectory === 'function';
  const hardwareConcurrency = (nav.hardwareConcurrency as number) || 4;
  const deviceMemoryGb = ((nav as any).deviceMemory as number) || null;

  let storageEstimateMb: number | null = null;
  if (isClient && nav.storage?.estimate) {
    try {
      const estimate = await nav.storage.estimate();
      if (estimate.quota) {
        storageEstimateMb = Math.round(estimate.quota / (1024 * 1024));
      }
    } catch {
      // Storage estimate not available
    }
  }

  const maxCanvasDimension = getMaxCanvasDimension();

  // Test encoding support for 1080p (1080x1920), 2K (1440x2560), and 4K (2160x3840) at 60 FPS
  const [encode1080p60, encode2k60, encode4k60] = await Promise.all([
    testEncodeConfig(1080, 1920, 60, 10_000_000),
    testEncodeConfig(1440, 2560, 60, 18_000_000),
    testEncodeConfig(2160, 3840, 60, 35_000_000),
  ]);

  const recommendations: string[] = [];
  const warnings: string[] = [];
  let performanceLevel: DevicePerformanceLevel = 'Compatibility Mode';

  if (webCodecs && encode1080p60.supported) {
    if (webGPU && encode4k60.supported && hardwareConcurrency >= 8 && (deviceMemoryGb === null || deviceMemoryGb >= 8)) {
      performanceLevel = 'Excellent';
      recommendations.push('Full WebGPU acceleration & 4K 60 FPS hardware encoding supported.');
    } else if (encode2k60.supported && hardwareConcurrency >= 4) {
      performanceLevel = 'Good';
      recommendations.push('Hardware WebCodecs 1080p/2K 60 FPS ready. Light/Balanced AI recommended.');
    } else {
      performanceLevel = 'Limited';
      recommendations.push('1080p 60 FPS is recommended for smooth playback and stable memory.');
    }
  } else {
    performanceLevel = 'Compatibility Mode';
    warnings.push('Hardware WebCodecs not fully supported; canvas and media fallback pipeline will be used.');
  }

  if (!encode4k60.supported) {
    warnings.push('4K rendering may exceed this device\'s browser/GPU capability. 1080p is recommended.');
  }

  if (!webGPU) {
    recommendations.push('WebGPU is not active in this browser; high-speed local AI fallback will run via CPU/WASM heuristics.');
  }

  if (deviceMemoryGb !== null && deviceMemoryGb < 4) {
    warnings.push('Low device memory detected (<4GB). Rendering will run sequentially to protect browser stability.');
  }

  return {
    webGPU,
    webCodecs,
    videoEncoder,
    videoDecoder,
    offscreenCanvas,
    sharedArrayBuffer,
    fileSystemAccess,
    opfsSupported,
    hardwareConcurrency,
    deviceMemoryGb,
    storageEstimateMb,
    maxCanvasDimension,
    encode1080p60,
    encode2k60,
    encode4k60,
    performanceLevel,
    recommendations,
    warnings,
  };
}
