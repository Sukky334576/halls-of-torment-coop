const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:/Users/tong3/.gemini/antigravity/brain/5c050d92-b446-46db-92d8-9d3b8e6eec18/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let idx = 0;
  for await (const line of rl) {
    idx++;
    if (idx >= 4400 && idx <= 4900) {
      try {
        const obj = JSON.parse(line);
        const text = (obj.content || '') + ' ' + (obj.thinking || '');
        if (text.includes('Batch 2') || text.includes('batch 2') || text.includes('ชุดที่ 2') || text.includes('5 ตัว') || text.includes('5ตัว')) {
          console.log(`=== Line ${idx} (${obj.type}) ===`);
          console.log(text.substring(0, 500));
        }
      } catch(e) {}
    }
  }
}

main();
