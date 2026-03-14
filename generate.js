#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const { generateCampaign } = require('./engine/batch');

program
  .name('royalbay-generate')
  .description('Royal Bay Ad Creative Generator')
  .requiredOption('-c, --campaign <path>', 'Path to campaign JSON file')
  .option('-p, --preset <name>', 'Size preset (overrides campaign default)')
  .option('-v, --variant <id>', 'Generate only this variant')
  .option('-s, --size <WxH>', 'Generate only this size (e.g. 1200x628)')
  .parse(process.argv);

const opts = program.opts();
const campaignPath = path.resolve(opts.campaign);

generateCampaign(campaignPath, {
  preset: opts.preset,
  variant: opts.variant,
  size: opts.size,
}).catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
