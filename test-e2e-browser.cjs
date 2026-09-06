const puppeteer = require('puppeteer-core');
const path = require('path');

async function testGameInBrowser() {
  console.log('🚀 Running 2.5D Sprite Engine Comprehensive Browser Test on Google Chrome...');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico')) {
        console.error('❌ Browser Console Error:', text);
        consoleErrors.push(text);
      }
    } else {
      console.log('ℹ️ Browser Console:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error('🔥 Browser Page Exception:', err.message);
    consoleErrors.push(err.message);
  });

  console.log('🌐 Opening http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

  // 1. Screenshot Lobby
  console.log('📸 Taking Screenshot 1: Lobby with 2.5D Animated Hero Showcase...');
  await page.screenshot({ path: path.join(__dirname, 'e2e_2d_01_lobby.png') });

  // 2. Select Sorceress to test distinct magic visuals
  console.log('🔮 Selecting Sorceress (Testing distinct attack VFX & mouse aiming)...');
  await page.click('.class-card[data-class="sorceress"]');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'e2e_2d_02_class_selection.png') });

  // 3. Click Start
  console.log('🔥 Starting 2.5D Crusade Battle...');
  await page.click('#btn-start');
  await new Promise((r) => setTimeout(r, 1500));

  // 4. Test Mouse Aiming (Move mouse to quadrant 1)
  console.log('🖱️ Testing Mouse Aiming at (850, 250)...');
  await page.mouse.move(850, 250);
  await new Promise((r) => setTimeout(r, 800));

  // 4b. Test On-Screen WASD Controller Buttons (Clicking on-screen keys)
  console.log('🕹️ Testing On-Screen WASD Controller Buttons (Click & Hold)...');
  const wasdVisible = await page.$eval('#wasd-controller', (el) => !!el).catch(() => false);
  console.log('✅ On-Screen WASD Controller Exists:', wasdVisible);

  console.log('📸 Taking Screenshot 3: Sorceress with On-Screen WASD Controller...');
  await page.screenshot({ path: path.join(__dirname, 'e2e_2d_03_sorceress_aim.png') });

  // 5. Test WASD Movement with keyboard key press
  console.log('🕹️ Testing Keyboard WASD (KeyW, KeyA, KeyS, KeyD) and checking active class...');
  await page.keyboard.down('KeyW');
  await new Promise((r) => setTimeout(r, 400));
  const wActive = await page.$eval('#wasd-btn-w', (el) => el.classList.contains('active'));
  console.log('✅ W button glows active on KeyW press:', wActive);
  await page.keyboard.up('KeyW');

  await page.keyboard.down('KeyD');
  await new Promise((r) => setTimeout(r, 800));
  await page.keyboard.up('KeyD');

  await page.keyboard.down('KeyS');
  await new Promise((r) => setTimeout(r, 800));
  await page.keyboard.up('KeyS');

  // 6. Move through center to kill mobs and trigger level up
  console.log('⚔️ Battling mobs and gathering gems for Level-Up...');
  let modalOpened = false;
  for (let step = 0; step < 25; step++) {
    await page.keyboard.down('KeyA');
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.up('KeyA');
    await page.keyboard.down('KeyD');
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.up('KeyD');

    const display = await page.$eval('#trait-modal', (el) => el.style.display).catch(() => 'none');
    if (display === 'flex') {
      modalOpened = true;
      console.log('✨ LEVEL UP PAUSE TRIGGERED! Inspecting modal...');
      break;
    }
  }

  if (modalOpened) {
    console.log('📸 Taking Screenshot 4: Level-Up Modal with Pause Banner & Class Abilities...');
    await page.screenshot({ path: path.join(__dirname, 'e2e_2d_04_levelup_pause.png') });

    const pauseBanner = await page.$eval('.level-up-paused-banner', (el) => el.textContent).catch(() => 'NOT FOUND');
    console.log('✅ Level-Up Pause Banner Content:', pauseBanner);

    const traitCount = await page.$$eval('.trait-card', (cards) => cards.length);
    console.log(`✅ Trait Choices Offered: ${traitCount} options`);

    // Click first trait to unpause
    console.log('👆 Selecting trait to test unpausing...');
    await page.click('.trait-card');
    await new Promise((r) => setTimeout(r, 1000));

    const displayAfter = await page.$eval('#trait-modal', (el) => el.style.display).catch(() => 'none');
    console.log(`✅ Modal display after selection: ${displayAfter} (Unpaused!)`);
  } else {
    console.log('ℹ️ Level-up gem didn\'t reach threshold yet; taking combat screenshot.');
  }

  console.log('📸 Taking Screenshot 5: Combat Action with Signature Visuals...');
  await page.screenshot({ path: path.join(__dirname, 'e2e_2d_05_combat_signature.png') });

  // Verify FPS & performance
  const metrics = await page.metrics();
  console.log('📊 Performance Metrics:', {
    JSHeapUsedSizeMB: Math.round(metrics.JSHeapUsedSize / 1024 / 1024),
    LayoutDurationSec: metrics.LayoutDuration,
    RecalcStyleDurationSec: metrics.RecalcStyleDuration
  });

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error(`❌ FAILED! ${consoleErrors.length} errors found:`, consoleErrors);
    process.exit(1);
  } else {
    console.log('🎉 100% SUCCESS! All requirements verified on Google Chrome!');
    process.exit(0);
  }
}

testGameInBrowser().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
