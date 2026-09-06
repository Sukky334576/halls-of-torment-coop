const WORKSPACE_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\scratch\\halls-of-torment-coop';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const puppeteer = require(WORKSPACE_DIR + '/node_modules/puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\brain\\5c050d92-b446-46db-92d8-9d3b8e6eec18';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('🛡️ Launching Chrome to test Milestone 3: Gear Vault & Hall of Trials...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('[PAGE LOG]:', msg.text()));
    page.on('pageerror', err => console.error('[PAGE ERROR]:', err));

    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await sleep(1200);

    // 1. Check Lobby top bar buttons
    const gearBtn = await page.$('#btn-open-gear-vault');
    const trialsBtn = await page.$('#btn-open-trials');
    console.log('Gear Vault button exists:', !!gearBtn);
    console.log('Trials button exists:', !!trialsBtn);

    // Take Lobby screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'milestone3_lobby_buttons.png') });
    console.log('Captured milestone3_lobby_buttons.png');

    // 2. Open Gear Vault
    await page.click('#btn-open-gear-vault');
    await sleep(600);

    // Inspect items and equip an item
    const vaultModalVisible = await page.$eval('#gear-vault-modal', el => el.style.display);
    console.log('Gear vault modal display:', vaultModalVisible);

    // Click second item in vault items grid (e.g. boots or ring)
    const itemCards = await page.$$('.vault-item-card');
    console.log('Found vault item cards count:', itemCards.length);
    if (itemCards.length > 1) {
      await itemCards[1].click();
      await sleep(400);
    }

    // Try clicking equip button if available
    const equipBtn = await page.$('#btn-vault-action');
    if (equipBtn) {
      console.log('Clicking equip/unequip action button...');
      await equipBtn.click();
      await sleep(600);
    }

    // Capture Gear Vault screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'milestone3_gear_vault.png') });
    console.log('Captured milestone3_gear_vault.png');

    // Close Gear Vault
    await page.click('#btn-close-vault');
    await sleep(400);

    // 3. Open Hall of Trials
    // Simulate some trial completions to verify progress bars and claimable rewards
    await page.evaluate(() => {
      let data = {};
      try {
        data = JSON.parse(localStorage.getItem('torment_meta_save_v2') || '{}');
      } catch (e) {}
      data.trialStats = {
        totalKills: 1500, // completes trial_slayer_100 (100) and trial_slayer_500 (500)
        maxSurvivalSeconds: 400, // completes trial_survivor_5m (300)
        totalGoldCollected: 1200, // completes trial_greed_500 (500)
        evolutionsCrafted: 2, // completes trial_evolution_master (1)
        elementalReactionsTriggered: 60, // completes trial_resonance_adept (50)
        stagesCleared: [1]
      };
      localStorage.setItem('torment_meta_save_v2', JSON.stringify(data));
    });

    console.log('Reloading page to apply trial progression...');
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(1000);

    // Click Hall of Trials button
    await page.click('#btn-open-trials');
    await sleep(600);

    const trialsModalVisible = await page.$eval('#hall-of-trials-modal', el => el.style.display);
    console.log('Hall of trials modal display:', trialsModalVisible);

    // Look for claim buttons
    const claimBtns = await page.$$('.btn-claim-trial');
    console.log('Found ready claim buttons count:', claimBtns.length);

    // Click first claim button if any
    if (claimBtns.length > 0) {
      console.log('Claiming first trial reward...');
      await claimBtns[0].click();
      await sleep(600);
    }

    // Capture Hall of Trials screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'milestone3_hall_of_trials.png') });
    console.log('Captured milestone3_hall_of_trials.png');

    // Close Hall of Trials
    await page.click('#btn-close-trials');
    await sleep(400);

    // Final screenshot showing lobby badge counter and gold
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'milestone3_lobby_final.png') });
    console.log('Captured milestone3_lobby_final.png');

    console.log('✅ Milestone 3 verification completed successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
