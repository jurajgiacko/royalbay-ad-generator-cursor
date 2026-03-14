const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PLATFORM_LIMITS = {
  google:  150 * 1024,
  sklik:   150 * 1024,
  meta:    30 * 1024 * 1024,
  web:     300 * 1024,
  email:   200 * 1024,
};

function detectPlatform(sizeId) {
  if (sizeId.startsWith('gdn-')) return 'google';
  if (sizeId.startsWith('sklik-')) return 'sklik';
  if (sizeId.startsWith('meta-')) return 'meta';
  if (sizeId.startsWith('web-')) return 'web';
  if (sizeId.startsWith('email-')) return 'email';
  if (sizeId.startsWith('landscape-') || sizeId.startsWith('square-')) return 'meta';
  return 'web';
}

async function compressBanner(pngPath, sizeId) {
  const platform = detectPlatform(sizeId);
  const maxBytes = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.web;
  const pngSize = fs.statSync(pngPath).size;

  if (pngSize <= maxBytes) {
    console.log(`  ✓ PNG OK: ${(pngSize / 1024).toFixed(0)} KB (limit ${(maxBytes / 1024).toFixed(0)} KB)`);
    return pngPath;
  }

  const jpgPath = pngPath.replace(/\.png$/, '.jpg');
  let quality = 90;

  while (quality >= 40) {
    await sharp(pngPath)
      .jpeg({ quality, mozjpeg: true })
      .toFile(jpgPath);

    const jpgSize = fs.statSync(jpgPath).size;

    if (jpgSize <= maxBytes) {
      fs.unlinkSync(pngPath);
      console.log(`  ✓ Compressed: PNG → JPG q${quality} (${(jpgSize / 1024).toFixed(0)} KB)`);
      return jpgPath;
    }

    quality -= 5;
  }

  console.log(`  ⚠ Could not compress under ${(maxBytes / 1024).toFixed(0)} KB, keeping best JPG`);
  fs.unlinkSync(pngPath);
  return jpgPath;
}

module.exports = { compressBanner, detectPlatform };
