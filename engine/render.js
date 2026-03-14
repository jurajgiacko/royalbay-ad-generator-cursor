const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function renderBanner(html, width, height, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempHtmlPath = path.join(dir, '_temp_banner.html');
  fs.writeFileSync(tempHtmlPath, html, 'utf-8');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: outputPath, type: 'png', fullPage: false });
    console.log(`  ✓ Rendered: ${path.basename(outputPath)} (${width}×${height})`);
  } finally {
    await browser.close();
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }

  return outputPath;
}

module.exports = { renderBanner };
