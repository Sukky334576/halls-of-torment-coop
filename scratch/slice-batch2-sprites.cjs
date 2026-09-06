const WORKSPACE_DIR = 'C:\\Users\\tong3\\.gemini\\antigravity\\scratch\\halls-of-torment-coop';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const puppeteer = require(WORKSPACE_DIR + '/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');
const RAW_DIR = path.join(WORKSPACE_DIR, 'public/sprites/raw');
const OUT_DIR = path.join(WORKSPACE_DIR, 'public/sprites');

async function run() {
  console.log('🚀 Starting Sprite Slicing & Transparency Pipeline for Batch 2...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const page = await browser.newPage();

  function getDataUrl(filePath, mime) {
    const b64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${b64}`;
  }

  const cowboyWalkUrl = getDataUrl(path.join(RAW_DIR, 'cowboy_walk_spritesheet.png'), 'image/png');
  const cowboyShootUrl = getDataUrl(path.join(RAW_DIR, 'cowboy_shoot_spritesheet.png'), 'image/png');
  const mechaUrl = getDataUrl(path.join(RAW_DIR, 'celestial_mecha_spritesheet.jpg'), 'image/jpeg');
  const gamblerUrl = getDataUrl(path.join(RAW_DIR, 'gambler_spritesheet.jpg'), 'image/jpeg');

  const frames = await page.evaluate(async (cowboyWalkSrc, cowboyShootSrc, mechaSrc, gamblerSrc) => {
    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }

    // Flood-fill transparency from edges (supports white bg or black bg)
    function floodFillTransparency(ctx, width, height, isBlackBg = false, tolerance = 40) {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const visited = new Uint8Array(width * height);
      const queue = [];

      function isBgPixel(idx) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (isBlackBg) {
          return (r <= tolerance && g <= tolerance && b <= tolerance);
        } else {
          return (r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance);
        }
      }

      // Seed all 4 borders
      for (let x = 0; x < width; x++) {
        queue.push([x, 0]);
        queue.push([x, height - 1]);
      }
      for (let y = 0; y < height; y++) {
        queue.push([0, y]);
        queue.push([width - 1, y]);
      }

      while (queue.length > 0) {
        const [x, y] = queue.pop();
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const pIdx = y * width + x;
        if (visited[pIdx]) continue;
        visited[pIdx] = 1;

        const dIdx = pIdx * 4;
        if (data[dIdx + 3] === 0 || isBgPixel(dIdx)) {
          data[dIdx + 3] = 0; // transparent
          queue.push([x + 1, y]);
          queue.push([x - 1, y]);
          queue.push([x, y + 1]);
          queue.push([x, y - 1]);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }

    // Center on 128x128 canvas
    function centerOnCanvas128(srcCanvas) {
      const sWidth = srcCanvas.width;
      const sHeight = srcCanvas.height;
      const sCtx = srcCanvas.getContext('2d');
      const imgData = sCtx.getImageData(0, 0, sWidth, sHeight);
      const data = imgData.data;

      let minX = sWidth, minY = sHeight, maxX = 0, maxY = 0;
      let found = false;

      for (let y = 0; y < sHeight; y++) {
        for (let x = 0; x < sWidth; x++) {
          const idx = (y * sWidth + x) * 4;
          if (data[idx + 3] > 20) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const outCanvas = document.createElement('canvas');
      outCanvas.width = 128;
      outCanvas.height = 128;
      const outCtx = outCanvas.getContext('2d');

      if (!found) return outCanvas.toDataURL('image/png');

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      const scale = Math.min(108 / cropH, 108 / cropW);
      const finalW = Math.round(cropW * scale);
      const finalH = Math.round(cropH * scale);
      const destX = Math.round((128 - finalW) / 2);
      const destY = Math.round(124 - finalH); // anchor to ground

      outCtx.drawImage(
        srcCanvas,
        minX, minY, cropW, cropH,
        destX, destY, finalW, finalH
      );

      return outCanvas.toDataURL('image/png');
    }

    function extractFrame(img, sx, sy, sw, sh, isBlackBg = false, tolerance = 35) {
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      // Clean 3px perimeter border to guarantee zero grid line artifacts
      ctx.clearRect(0, 0, sw, 4);
      ctx.clearRect(0, sh - 4, sw, 4);
      ctx.clearRect(0, 0, 4, sh);
      ctx.clearRect(sw - 4, 0, 4, sh);
      floodFillTransparency(ctx, sw, sh, isBlackBg, tolerance);
      return centerOnCanvas128(c);
    }

    const results = {};

    // 1. Cowboy (1024 x 576, 4 cols x 2 rows, cols ~ 256, rows ~ 288)
    const cowboyWalkImg = await loadImage(cowboyWalkSrc);
    const cowboyShootImg = await loadImage(cowboyShootSrc);

    results['cowboy_frame_0'] = extractFrame(cowboyWalkImg, 35, 20, 185, 250, false, 30); // Idle standing
    results['cowboy_frame_1'] = extractFrame(cowboyWalkImg, 290, 20, 185, 250, false, 30); // Walk 1
    results['cowboy_frame_2'] = extractFrame(cowboyWalkImg, 545, 20, 185, 250, false, 30); // Walk 2
    results['cowboy_frame_3'] = extractFrame(cowboyWalkImg, 800, 20, 185, 250, false, 30); // Walk 3
    results['cowboy_frame_4'] = extractFrame(cowboyShootImg, 530, 20, 210, 250, false, 30); // Shoot Aim
    results['cowboy_frame_5'] = extractFrame(cowboyShootImg, 780, 20, 225, 250, false, 30); // Shoot Flash
    results['cowboy_portrait'] = extractFrame(cowboyWalkImg, 35, 20, 185, 250, false, 30); // Portrait

    // 2. Celestial Mecha (1024 x 1024, 4 cols x 5 rows, colW ~ 256, rowH ~ 204.8)
    const mechaImg = await loadImage(mechaSrc);

    // Use Row 1 & 2 which don't have watermark
    results['celestial_mecha_frame_0'] = extractFrame(mechaImg, 25, 214, 210, 185, true, 35); // Idle hover (clean)
    results['celestial_mecha_frame_1'] = extractFrame(mechaImg, 25, 418, 210, 185, true, 35); // Hover 2
    results['celestial_mecha_frame_2'] = extractFrame(mechaImg, 270, 214, 226, 185, true, 35); // Dash 1
    results['celestial_mecha_frame_3'] = extractFrame(mechaImg, 270, 418, 226, 185, true, 35); // Dash 2
    results['celestial_mecha_frame_4'] = extractFrame(mechaImg, 530, 418, 220, 185, true, 35); // Beam Saber slash
    results['celestial_mecha_frame_5'] = extractFrame(mechaImg, 782, 214, 226, 185, true, 35); // Laser salvo
    results['celestial_mecha_portrait'] = extractFrame(mechaImg, 25, 214, 210, 185, true, 35); // Portrait (clean)

    // 3. The Gambler (1024 x 1024, 8 cols x 5 rows, colW ~ 128, rowH ~ 204.8)
    const gamblerImg = await loadImage(gamblerSrc);

    // Row 1 (y: 215 to 410) - crop well inside the cell borders (x + 38 to avoid left line, y + 232 to avoid top line)
    results['gambler_frame_0'] = extractFrame(gamblerImg, 38, 230, 75, 160, false, 45); // Idle standing
    results['gambler_frame_1'] = extractFrame(gamblerImg, 166, 230, 75, 160, false, 45); // Walk 1
    results['gambler_frame_2'] = extractFrame(gamblerImg, 294, 230, 75, 160, false, 45); // Walk 2
    results['gambler_frame_3'] = extractFrame(gamblerImg, 550, 230, 75, 160, false, 45); // Walk 3
    results['gambler_frame_4'] = extractFrame(gamblerImg, 282, 435, 90, 160, false, 45); // Card throw (clean, inside column)
    results['gambler_frame_5'] = extractFrame(gamblerImg, 282, 640, 90, 160, false, 45); // Dice throw (clean, inside column)
    results['gambler_portrait'] = extractFrame(gamblerImg, 38, 230, 75, 160, false, 45); // Portrait

    return results;
  }, cowboyWalkUrl, cowboyShootUrl, mechaUrl, gamblerUrl);

  await browser.close();

  // Write all frames
  for (const [name, dataUrl] of Object.entries(frames)) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(OUT_DIR, `${name}.png`);
    fs.writeFileSync(outPath, base64Data, 'base64');
    console.log(`✅ Saved: ${name}.png`);
  }

  console.log('🎉 Slicing & Transparency Complete for Batch 2 (Cowboy, Mecha, Gambler)!');
}

run().catch(console.error);
