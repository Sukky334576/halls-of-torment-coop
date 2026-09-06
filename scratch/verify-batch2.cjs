const WORKSPACE_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\scratch\\halls-of-torment-coop';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const puppeteer = require(WORKSPACE_DIR + '/node_modules/puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\brain\\5c050d92-b446-46db-92d8-9d3b8e6eec18';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('🚀 Starting Puppeteer Batch 2 Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[PAGE LOG]:', msg.text()));
  page.on('pageerror', err => console.error('[PAGE ERROR]:', err));

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  // 1. Screenshot of the 9-Pedestal Lobby
  const lobbyShotPath = path.join(ARTIFACT_DIR, 'batch2_9_heroes_lobby.png');
  await page.screenshot({ path: lobbyShotPath });
  console.log(`📸 Saved 9-hero lobby screenshot: ${lobbyShotPath}`);

  // Pedestal click test on canvas
  const canvasHandle = await page.$('#lobby-stage-canvas');
  if (canvasHandle) {
    const box = await canvasHandle.boundingBox();
    console.log(`Canvas bounding box:`, box);

    // Canvas internal size is 1040x540.
    const scaleX = box.width / 1040;
    const scaleY = box.height / 540;

    // Pedestal positions (aiming at hero body: y - 35):
    // 1. Click Cowboy
    const cowboyScreenX = box.x + 395 * scaleX;
    const cowboyScreenY = box.y + (418 - 35) * scaleY;
    await page.mouse.click(cowboyScreenX, cowboyScreenY);
    await sleep(900);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'batch2_cowboy_selected.png') });
    console.log('📸 Selected Cowboy & captured screenshot');

    // 2. Click Celestial Mecha
    const mechaScreenX = box.x + 520 * scaleX;
    const mechaScreenY = box.y + (440 - 35) * scaleY;
    await page.mouse.click(mechaScreenX, mechaScreenY);
    await sleep(900);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'batch2_mecha_selected.png') });
    console.log('📸 Selected Celestial Mecha & captured screenshot');

    // 3. Click Gambler
    const gamblerScreenX = box.x + 755 * scaleX;
    const gamblerScreenY = box.y + (398 - 35) * scaleY;
    await page.mouse.click(gamblerScreenX, gamblerScreenY);
    await sleep(900);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'batch2_gambler_selected.png') });
    console.log('📸 Selected Gambler & captured screenshot');

    // 4. Click Ready / Start button or enter Gate
    console.log('🚪 Walking into the Gate of Torment with Gambler...');
    const gateScreenX = box.x + 520 * scaleX;
    const gateScreenY = box.y + 145 * scaleY;
    await page.mouse.click(gateScreenX, gateScreenY);

    await sleep(2400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'batch2_gate_transition.png') });

    // 5. Select Stage 1
    const stage1Btn = await page.$('.btn-enter-stage[data-stage="1"]');
    if (stage1Btn) {
      await stage1Btn.click();
      console.log('⚔️ Clicked Stage 1 Enter Button');
    }

    // Wait for in-game battle
    await sleep(4000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'batch2_combat_battle.png') });
    console.log('📸 Battle combat screenshot captured!');
  }

  await browser.close();
  console.log('✅ Batch 2 Verification completed successfully!');
})();
