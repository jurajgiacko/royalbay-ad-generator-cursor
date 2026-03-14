/**
 * Photo focal point validator.
 * Ensures the photo subject (face, body) is not cut off or covered by overlay.
 *
 * focalPoint: { x: 0-1, y: 0-1 } where the key subject is in the original photo
 *   x=0 left edge, x=1 right edge, y=0 top edge, y=1 bottom edge
 *
 * subjectBounds: { top: 0-1, bottom: 0-1, left: 0-1, right: 0-1 }
 *   rectangle where the subject occupies in the photo (optional, more precise)
 */

const { parsePx } = require('./layout-validator');

function computeObjectPosition(focalPoint, bannerWidth, bannerHeight, photoWidth, photoHeight) {
  if (!focalPoint) return null;

  const bannerAR = bannerWidth / bannerHeight;
  const photoAR = photoWidth / photoHeight;

  let x = `${Math.round(focalPoint.x * 100)}%`;
  let y = `${Math.round(focalPoint.y * 100)}%`;

  return `${x} ${y}`;
}

function estimateVisibleRegion(bannerWidth, bannerHeight, photoWidth, photoHeight, objectPosition) {
  const bannerAR = bannerWidth / bannerHeight;
  const photoAR = photoWidth / photoHeight;

  let visibleWidth, visibleHeight, offsetX, offsetY;

  if (bannerAR > photoAR) {
    visibleWidth = 1.0;
    visibleHeight = (photoAR / bannerAR);
    offsetX = 0;

    const posY = objectPosition ? parsePositionPercent(objectPosition.split(' ')[1]) : 50;
    const maxOffset = 1.0 - visibleHeight;
    offsetY = maxOffset * (posY / 100);
  } else {
    visibleHeight = 1.0;
    visibleWidth = (bannerAR / photoAR);
    offsetY = 0;

    const posX = objectPosition ? parsePositionPercent(objectPosition.split(' ')[0]) : 50;
    const maxOffset = 1.0 - visibleWidth;
    offsetX = maxOffset * (posX / 100);
  }

  return {
    top: offsetY,
    left: offsetX,
    bottom: offsetY + visibleHeight,
    right: offsetX + visibleWidth,
    width: visibleWidth,
    height: visibleHeight,
  };
}

function parsePositionPercent(val) {
  if (!val) return 50;
  if (val === 'center') return 50;
  if (val === 'top' || val === 'left') return 0;
  if (val === 'bottom' || val === 'right') return 100;
  return parseFloat(val) || 50;
}

function checkOverlayOnSubject(defaults, focalPoint, bannerWidth, bannerHeight) {
  const warnings = [];
  if (!focalPoint) return { warnings };

  const gradient = defaults.overlayGradient || '';

  const isLeftGradient = gradient.includes('90deg');
  const isBottomGradient = gradient.includes('0deg');

  if (isLeftGradient && focalPoint.x < 0.35) {
    warnings.push({
      rule: 'overlay_covers_subject',
      msg: `⚠ Horizontal gradient may heavily cover subject (focal x=${focalPoint.x}) in ${bannerWidth}×${bannerHeight}`,
      suggestion: 'Consider moving subject to right side of photo or reducing gradient opacity',
    });
  }

  if (isBottomGradient && focalPoint.y > 0.65) {
    warnings.push({
      rule: 'overlay_covers_subject',
      msg: `⚠ Bottom gradient may heavily cover subject (focal y=${focalPoint.y}) in ${bannerWidth}×${bannerHeight}`,
      suggestion: 'Consider using a photo where subject is higher',
    });
  }

  return { warnings };
}

function validatePhoto(variant, defaults, bannerWidth, bannerHeight) {
  const warnings = [];
  const errors = [];
  let suggestedPhotoPosition = null;

  const focalPoint = variant.focalPoint;

  if (!focalPoint) {
    return { errors, warnings, suggestedPhotoPosition };
  }

  suggestedPhotoPosition = computeObjectPosition(
    focalPoint,
    bannerWidth,
    bannerHeight,
    variant._photoWidth || 3000,
    variant._photoHeight || 2000
  );

  const overlayCheck = checkOverlayOnSubject(defaults, focalPoint, bannerWidth, bannerHeight);
  warnings.push(...overlayCheck.warnings);

  if (variant.subjectBounds) {
    const sb = variant.subjectBounds;
    const headTop = sb.top || 0;

    if (headTop < 0.1 && bannerWidth / bannerHeight > 2) {
      warnings.push({
        rule: 'head_cutoff_risk',
        msg: `⚠ Subject head near top edge (${Math.round(headTop * 100)}%) may be cut in wide format ${bannerWidth}×${bannerHeight}`,
        suggestion: 'Use a photo with more headroom or set focalPoint.y lower',
      });
    }

    const subjectWidth = (sb.right || 1) - (sb.left || 0);
    if (subjectWidth > 0.7 && bannerWidth / bannerHeight > 2) {
      warnings.push({
        rule: 'subject_too_wide',
        msg: `⚠ Subject spans ${Math.round(subjectWidth * 100)}% of photo width — may be cropped in ${bannerWidth}×${bannerHeight}`,
      });
    }
  }

  return { errors, warnings, suggestedPhotoPosition };
}

module.exports = { validatePhoto, computeObjectPosition };
