function validateVariant(variant, brandConfig) {
  const errors = [];
  const warnings = [];

  if (!variant.claim) {
    errors.push({ rule: 'claim_present', msg: 'Claim is required', severity: 'block' });
  } else if (variant.claim.length > brandConfig.rules.claimMaxChars) {
    errors.push({
      rule: 'claim_max_length',
      msg: `Claim "${variant.claim}" has ${variant.claim.length} chars (max ${brandConfig.rules.claimMaxChars})`,
      severity: 'block',
    });
  }

  if (variant.subheading && variant.subheading.length > brandConfig.rules.subheadingMaxChars) {
    warnings.push({
      rule: 'subheading_max_length',
      msg: `Subheading "${variant.subheading}" has ${variant.subheading.length} chars (max ${brandConfig.rules.subheadingMaxChars})`,
      severity: 'warn',
    });
  }

  if (!variant.image) {
    errors.push({ rule: 'image_present', msg: 'Image is required', severity: 'block' });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    blocked: errors.some((e) => e.severity === 'block'),
  };
}

function validateCampaign(campaign, brandConfig) {
  const results = {};

  for (const variant of campaign.variants) {
    results[variant.id] = validateVariant(
      { ...campaign.defaults, ...variant },
      brandConfig
    );
  }

  return results;
}

module.exports = { validateVariant, validateCampaign };
