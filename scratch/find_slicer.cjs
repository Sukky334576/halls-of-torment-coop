const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:/Users/tong3/.gemini/antigravity/brain/5c050d92-b446-46db-92d8-9d3b8e6eec18/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let idx = 0;
  for await (const line of rl) {
    idx++;
    if (line.includes('commando_frame_0') || line.includes('cat_tank_frame_0')) {
      try {
        const obj = JSON.parse(line);
        console.log(`=== Line ${idx} (${obj.type}) ===`);
        console.log((obj.content || '').substring(0, 500));
      } catch(e) {}
    }
  }
}

main();
