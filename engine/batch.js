const fs = require('fs');
const path = require('path');
const { merge, loadTemplateConfig } = require('./merge');
const { renderBanner } = require('./render');
const { compressBanner } = require('./compress');
const { validateVariant } = require('../validators/brand-validator');
const { validateLayout } = require('../validators/layout-validator');
const { validatePhoto } = require('../validators/photo-validator');

function resolveSizes(preset, brandConfig) {
  const presetConfig = brandConfig.presets[preset];
  if (!presetConfig) {
    throw new Error(`Unknown preset: ${preset}. Available: ${Object.keys(brandConfig.presets).join(', ')}`);
  }

  const allSizes = [...brandConfig.sizes.tier1, ...brandConfig.sizes.tier2];

  if (presetConfig.sizes === 'tier1 + tier2') {
    return allSizes;
  }

  if (typeof presetConfig.sizes === 'string' && presetConfig.sizes.includes('minus')) {
    const excludePattern = presetConfig.sizes.split('minus')[1].trim().replace('*', '');
    return allSizes.filter((s) => !s.id.startsWith(excludePattern));
  }

  if (Array.isArray(presetConfig.sizes)) {
    return allSizes.filter((s) => presetConfig.sizes.includes(s.id));
  }

  return allSizes;
}

function findTemplateForSize(sizeId, brandConfig, projectRoot) {
  const allSizes = [...brandConfig.sizes.tier1, ...brandConfig.sizes.tier2];
  const sizeConfig = allSizes.find((s) => s.id === sizeId);
  if (!sizeConfig) return null;

  const templateId = sizeConfig.template;
  const configPath = path.join(projectRoot, 'templates', `${templateId}.json`);
  if (!fs.existsSync(configPath)) return null;

  return { sizeConfig, templateId };
}

async function generateCampaign(campaignPath, options = {}) {
  const projectRoot = path.resolve(__dirname, '..');
  const brandConfig = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'brand', 'royalbay.json'), 'utf-8')
  );

  const campaign = JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));
  const preset = options.preset || campaign.defaults?.preset || 'minimum_viable';
  const filterVariant = options.variant || null;
  const filterSize = options.size || null;

  let sizes = resolveSizes(preset, brandConfig);

  if (filterSize) {
    const [w, h] = filterSize.split('x').map(Number);
    sizes = sizes.filter((s) => s.width === w && s.height === h);
    if (sizes.length === 0) {
      console.error(`No size matching ${filterSize}`);
      return;
    }
  }

  const campaignName = campaign.campaign.replace(/[^a-zA-Z0-9-_]/g, '_');
  const outputBase = path.join(projectRoot, 'output', campaignName);
  const manifest = { campaign: campaign.campaign, generated: new Date().toISOString(), banners: [] };
  const validationReport = { campaign: campaign.campaign, results: {} };

  let variants = campaign.variants;
  if (filterVariant) {
    variants = variants.filter((v) => v.id === filterVariant);
  }

  console.log(`\n🎨 Royal Bay Ad Generator`);
  console.log(`   Campaign: ${campaign.campaign}`);
  console.log(`   Preset:   ${preset} (${sizes.length} sizes)`);
  console.log(`   Variants: ${variants.length}\n`);

  for (const variant of variants) {
    const merged = { ...campaign.defaults, ...variant };

    const validation = validateVariant(merged, brandConfig);
    validationReport.results[variant.id] = validation;

    if (validation.blocked) {
      console.log(`❌ BLOCKED: ${variant.id}`);
      validation.errors.forEach((e) => console.log(`   ${e.msg}`));
      continue;
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((w) => console.log(`   ⚠ ${w.msg}`));
    }

    const imagePath = path.resolve(projectRoot, merged.image);
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Image not found: ${merged.image}`);
      continue;
    }
    merged._resolvedImage = `file://${imagePath}`;

    console.log(`📦 Variant: ${variant.id}`);

    for (const sizeConfig of sizes) {
      const found = findTemplateForSize(sizeConfig.id, brandConfig, projectRoot);
      if (!found) {
        console.log(`   ⏭ Skipping ${sizeConfig.id} (no template)`);
        continue;
      }

      try {
        const templateConfig = loadTemplateConfig(found.templateId, projectRoot);
        const sizeOverrides = (templateConfig.overrides && templateConfig.overrides[sizeConfig.id]) || {};
        const defaults = { ...templateConfig.defaults, ...sizeOverrides };

        const layoutResult = validateLayout(defaults, sizeConfig.width, sizeConfig.height, !!merged.discount);
        layoutResult.warnings.forEach((w) => console.log(`   ${w.msg}`));
        layoutResult.errors.forEach((e) => console.log(`   ❌ ${e.msg}`));

        const photoResult = validatePhoto(merged, defaults, sizeConfig.width, sizeConfig.height);
        photoResult.warnings.forEach((w) => console.log(`   ${w.msg}`));

        const mergeOptions = {};
        if (photoResult.suggestedPhotoPosition) {
          mergeOptions.photoPositionOverride = photoResult.suggestedPhotoPosition;
        }

        const html = merge(brandConfig, found.templateId, merged, sizeConfig, projectRoot, mergeOptions);
        const pngPath = path.join(outputBase, variant.id, `${sizeConfig.id}.png`);

        await renderBanner(html, sizeConfig.width, sizeConfig.height, pngPath);
        const finalPath = await compressBanner(pngPath, sizeConfig.id);

        manifest.banners.push({
          variant: variant.id,
          size: sizeConfig.id,
          width: sizeConfig.width,
          height: sizeConfig.height,
          file: path.relative(outputBase, finalPath),
          platform: sizeConfig.platform,
          layoutWarnings: layoutResult.warnings.length,
          photoWarnings: photoResult.warnings.length,
        });
      } catch (err) {
        console.log(`   ❌ Error ${sizeConfig.id}: ${err.message}`);
      }
    }
  }

  fs.mkdirSync(outputBase, { recursive: true });
  fs.writeFileSync(
    path.join(outputBase, '_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  fs.writeFileSync(
    path.join(outputBase, '_validation-report.json'),
    JSON.stringify(validationReport, null, 2)
  );

  console.log(`\n✅ Done! ${manifest.banners.length} banners generated.`);
  console.log(`   Output: ${outputBase}\n`);
}

module.exports = { generateCampaign, resolveSizes };
