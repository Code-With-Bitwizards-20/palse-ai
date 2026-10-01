const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Premium PulseCut SVG Icon
// Motif: A high-contrast, luminous geometric glyph combining:
// 1. Sleek rounded squircle container in deep cosmic obsidian
// 2. A stylized, dynamic neon "P" forming a precision scissor blade
// 3. An energetic electric heartbeat/audio pulse waveform cutting through the center
// 4. A luminous forward-pointing play wedge
// 5. Spark of AI diamond star
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1E1B4B" />
      <stop offset="55%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>

    <!-- Border Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="30%" stop-color="#818CF8" />
      <stop offset="70%" stop-color="#C084FC" />
      <stop offset="100%" stop-color="#F43F5E" />
    </linearGradient>

    <!-- Main Blade Gradient (Cyan to Indigo to Magenta) -->
    <linearGradient id="bladeGrad" x1="10%" y1="10%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="30%" stop-color="#38BDF8" />
      <stop offset="65%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#F43F5E" />
    </linearGradient>

    <!-- Pulse Wave Gradient -->
    <linearGradient id="pulseGrad" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F43F5E" />
    </linearGradient>

    <!-- Inner Core Cut Accent -->
    <linearGradient id="coreCut" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#818CF8" stop-opacity="0.3" />
    </linearGradient>

    <!-- Neon Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="deepGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="24" result="blur2" />
      <feComposite in="SourceGraphic" in2="blur2" operator="over" />
    </filter>
  </defs>

  <!-- Base Squircle -->
  <rect x="20" y="20" width="472" height="472" rx="124" fill="url(#bgGlow)" />
  <rect x="20" y="20" width="472" height="472" rx="124" stroke="url(#borderGrad)" stroke-width="12" stroke-opacity="0.75" />

  <!-- Ambient Internal Glow Circles -->
  <circle cx="210" cy="210" r="110" fill="#38BDF8" opacity="0.14" filter="url(#deepGlow)" />
  <circle cx="310" cy="290" r="100" fill="#EC4899" opacity="0.14" filter="url(#deepGlow)" />

  <!-- Center Icon: The PulseCut Emblem -->
  <!-- Dynamic P-Blade Silhouette with forward Play momentum -->
  <g filter="url(#glow)">
    <!-- Primary P-Stem (Left vertical cutter blade) -->
    <path
      d="M136 124 C136 112.954 144.954 104 156 104 L204 104 C215.046 104 224 112.954 224 124 L224 388 C224 399.046 215.046 408 204 408 L156 408 C144.954 408 136 399.046 136 388 Z"
      fill="url(#bladeGrad)"
    />

    <!-- Upper Loop of the "P" merging into a forward Play Wedge / Scissor Angle -->
    <path
      d="M224 104 L310 104 C365.228 104 410 148.772 410 204 C410 259.228 365.228 304 310 304 L224 304 Z"
      fill="url(#bladeGrad)"
    />

    <!-- Inner Negative Space Cutout of the "P" - Styled as a sharp video frame cutout -->
    <path
      d="M224 172 L298 172 C315.673 172 330 186.327 330 204 C330 221.673 315.673 236 298 236 L224 236 Z"
      fill="#090D1A"
    />

    <!-- Diagonal Laser Cut / Scissors Slash running across the P-loop -->
    <polygon
      points="106,280 436,136 446,156 116,300"
      fill="#020617"
      opacity="0.95"
    />

    <!-- Glowing Electric Pulse Waveform cutting through the center slit -->
    <path
      d="M100 290 L200 248 L236 160 L274 328 L312 216 L348 244 L440 204"
      stroke="url(#pulseGrad)"
      stroke-width="12"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- White-hot core highlight on the pulse peak -->
    <circle cx="236" cy="160" r="7" fill="#FFFFFF" />
    <circle cx="274" cy="328" r="7" fill="#FFFFFF" />

    <!-- AI Sparkle Diamond Star at top right corner -->
    <path
      d="M400 68 Q400 96 428 96 Q400 96 400 124 Q400 96 372 96 Q400 96 400 68 Z"
      fill="#38BDF8"
    />
    <circle cx="400" cy="96" r="3.5" fill="#FFFFFF" />
  </g>
</svg>
`;

async function generateFavicons() {
  const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');
  const appDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'app');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write public/favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  console.log('Created public/favicon.svg');

  // Also write to src/app/icon.svg for Next.js App Router native icon detection
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent, 'utf-8');
  console.log('Created src/app/icon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Generate PNGs of various sizes for all devices
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  for (const { name, size } of sizes) {
    const dest = path.join(publicDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(dest);
    console.log(`Generated ${name} (${size}x${size})`);
  }

  // Also generate apple-icon.png in src/app for Next.js 15 metadata
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('Generated src/app/apple-icon.png');

  // 3. Generate a genuine multi-resolution or 32x32 Windows favicon.ico
  // A standard .ico header + PNG payload (modern Vista/Win7+ ICO format supported everywhere)
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();

  // ICO header: 6 bytes (Reserved 2B, Type 2B (1=ICO), Count 2B (2 images))
  // Directory entries: 16 bytes each
  // Image 1: 32x32
  // Image 2: 16x16
  const numImages = 2;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(numImages, 4); // count

  const dirOffset = 6;
  const dirSize = 16 * numImages;
  const image1Offset = dirOffset + dirSize;
  const image2Offset = image1Offset + png32.length;

  const entry1 = Buffer.alloc(16);
  entry1.writeUInt8(32, 0); // width (32)
  entry1.writeUInt8(32, 1); // height (32)
  entry1.writeUInt8(0, 2);  // color palette (0)
  entry1.writeUInt8(0, 3);  // reserved
  entry1.writeUInt16LE(1, 4); // color planes
  entry1.writeUInt16LE(32, 6); // bits per pixel
  entry1.writeUInt32LE(png32.length, 8); // size of image data
  entry1.writeUInt32LE(image1Offset, 12); // offset

  const entry2 = Buffer.alloc(16);
  entry2.writeUInt8(16, 0); // width (16)
  entry2.writeUInt8(16, 1); // height (16)
  entry2.writeUInt8(0, 2);  // color palette (0)
  entry2.writeUInt8(0, 3);  // reserved
  entry2.writeUInt16LE(1, 4); // color planes
  entry2.writeUInt16LE(32, 6); // bits per pixel
  entry2.writeUInt32LE(png16.length, 8); // size of image data
  entry2.writeUInt32LE(image2Offset, 12); // offset

  const icoBuffer = Buffer.concat([header, entry1, entry2, png32, png16]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('Created valid multi-resolution favicon.ico in public/ and src/app/');
}

generateFavicons()
  .then(() => console.log('All favicons successfully generated!'))
  .catch(err => {
    console.error('Error generating favicons:', err);
    process.exit(1);
  });
