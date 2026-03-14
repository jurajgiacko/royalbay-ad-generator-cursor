const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

function loadTemplate(templateId, projectRoot) {
  const basePath = path.join(projectRoot, 'templates', '_base.html');
  const baseHtml = fs.readFileSync(basePath, 'utf-8');
  return baseHtml;
}

function loadTemplateConfig(templateId, projectRoot) {
  const configPath = path.join(projectRoot, 'templates', `${templateId}.json`);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Template config not found: ${configPath}`);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function selectLogo(width, brandConfig, projectRoot) {
  const logic = brandConfig.logo.selectionLogic;
  let variantKey;
  if (width >= 800) {
    variantKey = 'full_ondark';
  } else if (width >= 400) {
    variantKey = 'rb_ondark';
  } else {
    variantKey = 'rb_ondark';
  }
  const logoFile = brandConfig.logo.variants[variantKey].file;
  return path.join(projectRoot, logoFile);
}

function buildBannerBody(variant, logoPath) {
  const logoSrc = `file://${logoPath}`;
  const imageSrc = variant._resolvedImage;

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
    ctaHtml = `<div class="banner__cta">${variant.cta}</div>`;
  }

  return `
<div class="banner">
  <img class="banner__photo" src="${imageSrc}" alt="">
  <div class="banner__overlay"></div>
  <div class="banner__logo"><img src="${logoSrc}" alt="Royal Bay"></div>
  <div class="banner__content">
    ${badgeHtml}
    <div class="banner__claim">${variant.claim || ''}</div>
    ${subheadingHtml}
    ${ctaHtml}
  </div>
</div>`;
}

function merge(brandConfig, templateId, variant, sizeConfig, projectRoot) {
  const templateHtml = loadTemplate(templateId, projectRoot);
  const templateConfig = loadTemplateConfig(templateId, projectRoot);
  const defaults = templateConfig.defaults;

  const logoPath = selectLogo(sizeConfig.width, brandConfig, projectRoot);
  const body = buildBannerBody(variant, logoPath);

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
