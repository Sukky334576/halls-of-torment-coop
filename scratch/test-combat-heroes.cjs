const WORKSPACE_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\scratch\\halls-of-torment-coop';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const puppeteer = require(WORKSPACE_DIR + '/node_modules/puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\brain\\5c050d92-b446-46db-92d8-9d3b8e6eec18';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runCombatForHero(heroName, pedestalX, pedestalY, shotFileName) {
  console.log(`⚔️ Testing combat for ${heroName}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  const canvasHandle = await page.$('#lobby-stage-canvas');
  if (canvasHandle) {
    const box = await canvasHandle.boundingBox();
    const scaleX = box.width / 1040;
    const scaleY = box.height / 540;

    // Click hero pedestal
    await page.mouse.click(box.x + pedestalX * scaleX, box.y + (pedestalY - 35) * scaleY);
    await sleep(600);

    // Click Gate
    await page.mouse.click(box.x + 520 * scaleX, box.y + 145 * scaleY);
    await sleep(2200);

    // Click Stage 1 Enter Button
    const stage1Btn = await page.$('.btn-enter-stage[data-stage="1"]');
    if (stage1Btn) {
      await stage1Btn.click();
    }

    // Wait for in-game combat and projectile firing
    await sleep(4000);
    const outPath = path.join(ARTIFACT_DIR, shotFileName);
    await page.screenshot({ path: outPath });
    console.log(`📸 Saved ${heroName} combat screenshot to ${outPath}`);
  }

  await browser.close();
}

(async () => {
  // Cowboy: x = 395, y = 418
  await runCombatForHero('Cowboy', 395, 418, 'batch2_cowboy_combat.png');

  // Celestial Mecha: x = 520, y = 440
  await runCombatForHero('Celestial Mecha', 520, 440, 'batch2_mecha_combat.png');

  console.log('🎉 All hero combat tests completed!');
})();
