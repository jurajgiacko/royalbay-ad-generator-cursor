/**
 * Layout collision validator.
 * Detects overlap between logo, discount circle, and content text area.
 * Also checks if elements fit within the banner bounds.
 */

function parsePx(val) {
  if (typeof val === 'number') return val;
  if (!val || val === 'auto') return 0;
  return parseFloat(String(val).replace('px', '')) || 0;
}

function parsePadding(paddingStr) {
  const parts = String(paddingStr || '0px')
    .split(/\s+/)
    .map(parsePx);
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
}

function getLogoBox(defaults, bannerWidth) {
  const top = parsePx(defaults.logoTop);
  const left = parsePx(defaults.logoLeft);
  const height = parsePx(defaults.logoHeight);
  const estimatedWidth = height * 4.5;
  return { top, left, width: estimatedWidth, height, label: 'Logo' };
}

function getDiscountBox(defaults, bannerWidth) {
  const top = parsePx(defaults.discountCircleTop);
  const size = parsePx(defaults.discountCircleSize);
  const right = parsePx(defaults.discountCircleRight);
  const left = bannerWidth - right - size;
  return { top, left, width: size, height: size, label: 'Discount circle' };
}

function getContentBox(defaults, bannerWidth, bannerHeight) {
  const pad = parsePadding(defaults.contentPadding);
  const justify = defaults.contentJustify || 'flex-end';

  const contentWidth = bannerWidth - pad.left - pad.right;
  const estimatedTextHeight = parsePx(defaults.claimFontSize) * 2.5
    + parsePx(defaults.badgeFontSize) * 2
    + parsePx(defaults.subheadingFontSize) * 2
    + parsePx(defaults.ctaFontSize) * 2.5
    + parsePx(defaults.badgeMarginBottom)
    + parsePx(defaults.claimMarginBottom)
    + parsePx(defaults.subheadingMarginBottom);

  let top;
  if (justify === 'flex-end') {
    top = bannerHeight - pad.bottom - estimatedTextHeight;
  } else if (justify === 'center') {
    top = (bannerHeight - estimatedTextHeight) / 2;
  } else {
    top = pad.top;
  }

  return {
    top: Math.max(0, top),
    left: pad.left,
    width: contentWidth,
    height: estimatedTextHeight,
    label: 'Content text',
  };
}

function boxesOverlap(a, b) {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  );
}

function overlapArea(a, b) {
  const xOverlap = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left));
  const yOverlap = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
  return xOverlap * yOverlap;
}

function validateLayout(defaults, bannerWidth, bannerHeight, hasDiscount) {
  const warnings = [];
  const errors = [];

  const logo = getLogoBox(defaults, bannerWidth);
  const content = getContentBox(defaults, bannerWidth, bannerHeight);

  if (logo.left + logo.width > bannerWidth || logo.top + logo.height > bannerHeight) {
    errors.push({
      rule: 'logo_out_of_bounds',
      msg: `Logo overflows banner (${bannerWidth}×${bannerHeight})`,
    });
  }

  if (boxesOverlap(logo, content)) {
    const area = overlapArea(logo, content);
    const logoArea = logo.width * logo.height;
    const pct = Math.round((area / logoArea) * 100);
    if (pct > 30) {
      warnings.push({
        rule: 'logo_content_overlap',
        msg: `⚠ Logo overlaps with content text by ~${pct}% in ${bannerWidth}×${bannerHeight}`,
      });
    }
  }

  if (hasDiscount) {
    const disc = getDiscountBox(defaults, bannerWidth);

    if (disc.left < 0) {
      errors.push({
        rule: 'discount_out_of_bounds',
        msg: `Discount circle overflows left edge in ${bannerWidth}×${bannerHeight}`,
      });
    }

    if (boxesOverlap(logo, disc)) {
      const area = overlapArea(logo, disc);
      const smallerArea = Math.min(logo.width * logo.height, disc.width * disc.height);
      const pct = Math.round((area / smallerArea) * 100);
      if (pct > 15) {
        warnings.push({
          rule: 'logo_discount_overlap',
          msg: `⚠ Logo and discount circle overlap by ~${pct}% in ${bannerWidth}×${bannerHeight}`,
        });
      }
    }

    if (boxesOverlap(disc, content)) {
      const area = overlapArea(disc, content);
      const discArea = disc.width * disc.height;
      const pct = Math.round((area / discArea) * 100);
      if (pct > 25) {
        warnings.push({
          rule: 'discount_content_overlap',
          msg: `⚠ Discount circle overlaps with content text by ~${pct}% in ${bannerWidth}×${bannerHeight}`,
        });
      }
    }
  }

  const textCoverage = (content.width * content.height) / (bannerWidth * bannerHeight) * 100;
  if (textCoverage > 40) {
    warnings.push({
      rule: 'text_coverage_high',
      msg: `⚠ Text area covers ~${Math.round(textCoverage)}% of banner (${bannerWidth}×${bannerHeight})`,
    });
  }

  return { errors, warnings, boxes: { logo, content } };
}

module.exports = { validateLayout, parsePx };
