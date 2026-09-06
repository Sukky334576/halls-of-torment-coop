const fs = require('fs');
const path = require('path');
const WORKSPACE_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\scratch\\halls-of-torment-coop';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const puppeteer = require(WORKSPACE_DIR + '/node_modules/puppeteer-core');
const RAW_DIR = path.join(WORKSPACE_DIR, 'public/sprites/raw');

async function checkDimensions() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const page = await browser.newPage();

  const files = [
    'cowboy_walk_spritesheet.png',
    'cowboy_shoot_spritesheet.png',
    'cowboy_lasso_spritesheet.png',
    'cowboy_dodge_spritesheet.png',
    'celestial_mecha_spritesheet.jpg',
    'gambler_spritesheet.jpg'
  ];

  for (const f of files) {
    const filePath = path.join(RAW_DIR, f);
    const b64 = fs.readFileSync(filePath).toString('base64');
    const mime = f.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mime};base64,${b64}`;

    const dims = await page.evaluate(async (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.src = url;
      });
    }, dataUrl);

    console.log(`${f}: ${dims.w} x ${dims.h}`);
  }

  await browser.close();
}

checkDimensions();
