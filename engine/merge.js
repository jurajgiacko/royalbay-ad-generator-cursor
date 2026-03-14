const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

function loadTemplate(projectRoot) {
  const basePath = path.join(projectRoot, 'templates', '_base.html');
  return fs.readFileSync(basePath, 'utf-8');
}

function loadTemplateConfig(templateId, projectRoot) {
  const configPath = path.join(projectRoot, 'templates', `${templateId}.json`);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Template config not found: ${configPath}`);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function selectLogo(width, brandConfig, projectRoot) {
  let variantKey = width >= 800 ? 'full_ondark' : 'rb_ondark';
  const logoFile = brandConfig.logo.variants[variantKey].file;
  const fullPath = path.join(projectRoot, logoFile);
  return fullPath;
}

function buildBannerBody(variant, logoPath, defaults, photoPositionOverride) {
  const imageSrc = variant._resolvedImage;
  const logoExists = fs.existsSync(logoPath);
  const logoSrc = `file://${logoPath}`;

  const photoStyle = photoPositionOverride
    ? ` style="object-position: ${photoPositionOverride}"`
    : '';

  const logoHtml = logoExists
    ? `<div class="banner__logo"><img src="${logoSrc}" alt="Royal Bay"></div>`
    : '';

  let discountCircleHtml = '';
  if (variant.discount) {
    discountCircleHtml = `
    <div class="banner__discount-circle">
      <span class="banner__discount-circle-value">${variant.discount} %</span>
      <span class="banner__discount-circle-label">OUTLET</span>
    </div>`;
  }

  let badgeHtml = '';
  if (variant.badge) {
    badgeHtml = `<div class="banner__badge">${variant.badge}</div>`;
  }

  let subheadingHtml = '';
  if (variant.subheading) {
    subheadingHtml = `<div class="banner__subheading">${variant.subheading}</div>`;
  }

  let ctaHtml = '';
  if (variant.cta) {
    ctaHtml = `<div class="banner__cta">${variant.cta} <span class="banner__cta-arrow">→</span></div>`;
  }

  const showFooter = defaults.footerFontSize && defaults.footerFontSize !== '0px';
  const footerHtml = showFooter
    ? `<div class="banner__footer">ROYAL BAY | BETTER &amp; FASTER</div>`
    : '';

  return `
<div class="banner">
  <img class="banner__photo" src="${imageSrc}" alt=""${photoStyle}>
  <div class="banner__overlay"></div>
  ${logoHtml}
  ${discountCircleHtml}
  <div class="banner__content">
    ${badgeHtml}
    <div class="banner__claim">${variant.claim || ''}</div>
    ${subheadingHtml}
    ${ctaHtml}
  </div>
  ${footerHtml}
</div>`;
}

function merge(brandConfig, templateId, variant, sizeConfig, projectRoot, options = {}) {
  const templateHtml = loadTemplate(projectRoot);
  const templateConfig = loadTemplateConfig(templateId, projectRoot);

  const sizeOverrides = (templateConfig.overrides && templateConfig.overrides[sizeConfig.id]) || {};
  const defaults = { ...templateConfig.defaults, ...sizeOverrides };

  const logoPath = selectLogo(sizeConfig.width, brandConfig, projectRoot);
  const body = buildBannerBody(variant, logoPath, defaults, options.photoPositionOverride);

  const vars = {
    width: sizeConfig.width,
    height: sizeConfig.height,
    body,
    ...defaults,
  };

  const compiled = Handlebars.compile(templateHtml);
  return compiled(vars);
}

module.exports = { merge, loadTemplateConfig, selectLogo };
