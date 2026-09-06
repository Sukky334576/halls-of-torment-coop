const fs = require('fs');
const path = require('path');
const WORKSPACE_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\scratch\\halls-of-torment-coop';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const puppeteer = require(WORKSPACE_DIR + '/node_modules/puppeteer-core');
const RAW_DIR = path.join(WORKSPACE_DIR, 'public/sprites/raw');

async function detectBoxes() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const page = await browser.newPage();

  const files = [
    'cowboy_walk_spritesheet.png',
    'cowboy_shoot_spritesheet.png',
    'celestial_mecha_spritesheet.jpg',
    'gambler_spritesheet.jpg'
  ];

  for (const f of files) {
    const filePath = path.join(RAW_DIR, f);
    const b64 = fs.readFileSync(filePath).toString('base64');
    const mime = f.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mime};base64,${b64}`;

    const info = await page.evaluate(async (url, name) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, c.width, c.height).data;

          // Project non-white/black pixels horizontally and vertically to detect columns and rows
          const colCounts = new Int32Array(c.width);
          const rowCounts = new Int32Array(c.height);

          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              const idx = (y * c.width + x) * 4;
              const r = data[idx];
              const g = data[idx+1];
              const b = data[idx+2];
              // Is non-background (assuming background is either whiteish >240 or blackish <20)
              const isWhite = (r > 235 && g > 235 && b > 235);
              const isBlack = (r < 25 && g < 25 && b < 25);
              if (!isWhite && !isBlack) {
                colCounts[x]++;
                rowCounts[y]++;
              }
            }
          }

          resolve({ name, w: c.width, h: c.height });
        };
        img.src = url;
      });
    }, dataUrl, f);

    console.log(info);
  }

  await browser.close();
}

detectBoxes();
