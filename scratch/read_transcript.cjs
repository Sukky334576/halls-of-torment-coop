const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:/Users/tong3/.gemini/antigravity/brain/5c050d92-b446-46db-92d8-9d3b8e6eec18/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let idx = 0;
  for await (const line of rl) {
    idx++;
    if (line.includes('Batch') || line.includes('batch') || line.includes('ตัวละคร') || line.includes('USER_INPUT')) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'USER_INPUT') {
          console.log(`[USER_INPUT ${idx}]:`, obj.content);
        } else if (obj.content && (obj.content.includes('Batch 2') || obj.content.includes('batch 2') || obj.content.includes('ชุดที่ 2'))) {
          console.log(`[FOUND ${idx}]:`, obj.content.substring(0, 300));
        }
      } catch(e) {}
    }
  }
}

search();
