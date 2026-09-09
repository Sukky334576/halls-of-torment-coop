/**
 * Skill tree connectivity validator — re-run this any time skillTreeData.ts changes.
 *
 * Checks (per class, plus the universal tree):
 *   1. Bidirectional integrity — every A→B connection must have a matching B→A.
 *   2. Dangling references — every id in connections[] must resolve to a real node.
 *   3. Reachability from root — BFS from every type:'root' node; anything unreached
 *      can never be allocated no matter how many points the player has.
 *   4. Duplicates/overlaps — same id declared twice in one class (silently overwritten
 *      by the JS object literal, so we scan raw source text, not the runtime object),
 *      and node coordinates sitting within OVERLAP_THRESHOLD units of each other.
 *   5. Isolated clusters (report-only) — connected sub-graphs of 2+ nodes with no path
 *      to root at all, as distinct from single orphaned nodes already caught by #3.
 *   6. Type/tier consistency (report-only) — root/keystone shape sanity checks.
 *   7. Graph stats per class (report-only) — node/edge counts, type breakdown, depth.
 *
 * Exit code: non-zero if any BLOCKING issue is found in sections 1-4.
 * Sections 5-7 are informational only and never affect the exit code.
 *
 * Usage: npx tsx scripts/validateSkillTree.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CLASS_SKILL_TREES } from '../src/shared/skillTreeData.ts';
import type { SkillTreeNode } from '../src/shared/skillTreeData.ts';
import { PlayerClass } from '../src/shared/types.ts';

// CLASS_SKILL_TREES is keyed by the enum's runtime VALUE (e.g. "swordsman"), but the
// source text spells the computed key with the enum's MEMBER name (`[PlayerClass.SWORDSMAN]`)
// — build the value->member-name reverse map once so raw-source lookups can find it.
const enumMemberNameByValue = new Map<string, string>(
  Object.entries(PlayerClass).map(([memberName, value]) => [value, memberName])
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE_ABS = path.resolve(__dirname, '../src/shared/skillTreeData.ts');
const DATA_FILE_REL = 'src/shared/skillTreeData.ts';
const OVERLAP_THRESHOLD = 10; // units; below this, two nodes are close enough to mis-click

// ---------------------------------------------------------------------------
// Raw-source line lookup, since the parsed runtime object carries no line info,
// and a truly duplicated object key would already be silently deduped by the
// time we can see it at runtime — we need the raw text for that specific check.
// ---------------------------------------------------------------------------
const rawLines = fs.readFileSync(DATA_FILE_ABS, 'utf-8').split('\n');
const idLineOccurrences = new Map<string, number[]>();
const idFieldRe = /\bid:\s*['"]([^'"]+)['"]/;
rawLines.forEach((line, idx) => {
  const m = line.match(idFieldRe);
  if (m) {
    const arr = idLineOccurrences.get(m[1]) ?? [];
    arr.push(idx + 1); // 1-based line numbers
    idLineOccurrences.set(m[1], arr);
  }
});

// Class block boundaries, so duplicate-id detection stays scoped per class
// (repeating an id across two DIFFERENT classes' own node maps doesn't cause
// the same-object silent-overwrite bug — it's reported separately, as info).
const classBlockRe = /^\s*(\[PlayerClass\.\w+\]|\['universal'\]):\s*\{/;
const classBlockStarts: { line: number }[] = [];
rawLines.forEach((line, idx) => {
  if (classBlockRe.test(line)) classBlockStarts.push({ line: idx + 1 });
});

function lineRef(id: string): string {
  const lines = idLineOccurrences.get(id);
  if (!lines || lines.length === 0) return `${DATA_FILE_REL} (line not found)`;
  return `${DATA_FILE_REL}:${lines.join(',')}`;
}

// ---------------------------------------------------------------------------
// Per-class checks
// ---------------------------------------------------------------------------
interface ClassResult {
  className: string;
  pass: Record<'bidirectional' | 'dangling' | 'reachability' | 'duplicates', boolean>;
  oneWayLinks: Array<{ a: string; b: string }>;
  dangling: Array<{ from: string; to: string }>;
  unreachable: string[];
  rootIds: string[];
  duplicateIdsInClass: string[];
  overlaps: Array<{ a: string; b: string; dist: number }>;
  isolatedClusters: string[][];
  rootWithBadType: string[];
  keystoneWithOutgoing: Array<{ id: string; to: string[] }>;
  stats: {
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
    typeCounts: Record<string, number>;
  };
}

const results: ClassResult[] = [];
let anyCrossClassDuplicateIds: string[] = [];

// Track which class each id belongs to, to report cross-class id reuse (info-only).
const idToClasses = new Map<string, string[]>();

for (const [className, tree] of Object.entries(CLASS_SKILL_TREES)) {
  const nodes = tree.nodes as Record<string, SkillTreeNode>;
  const allIds = Object.keys(nodes);

  for (const id of allIds) {
    const arr = idToClasses.get(id) ?? [];
    arr.push(className);
    idToClasses.set(id, arr);
  }

  // --- Section 1 & 2: bidirectional integrity + dangling references ---
  const oneWayLinks: Array<{ a: string; b: string }> = [];
  const dangling: Array<{ from: string; to: string }> = [];
  const seenPairs = new Set<string>();

  for (const node of Object.values(nodes)) {
    for (const neighborId of node.connections) {
      const neighbor = nodes[neighborId];
      if (!neighbor) {
        dangling.push({ from: node.id, to: neighborId });
        continue;
      }
      const pairKey = [node.id, neighborId].sort().join('--');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const forward = node.connections.includes(neighborId);
      const backward = neighbor.connections.includes(node.id);
      if (forward && !backward) oneWayLinks.push({ a: node.id, b: neighborId });
      else if (!forward && backward) oneWayLinks.push({ a: neighborId, b: node.id });
    }
  }

  // --- Section 3: reachability from root (BFS from every type:'root' node) ---
  const rootIds = allIds.filter((id) => nodes[id].type === 'root');
  const reachable = new Set<string>(rootIds);
  const queue: string[] = [...rootIds];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = nodes[current];
    if (!node) continue;
    for (const neighborId of node.connections) {
      if (nodes[neighborId] && !reachable.has(neighborId)) {
        reachable.add(neighborId);
        queue.push(neighborId);
      }
    }
  }
  const unreachable = allIds.filter((id) => !reachable.has(id));

  // --- Section 4: duplicate ids (scoped to this class's raw source block) + overlaps ---
  const classKeyNeedle =
    className === 'universal' ? `['universal']:` : `[PlayerClass.${enumMemberNameByValue.get(className)}]:`;
  const classStartLine = rawLines.findIndex((l) => l.includes(classKeyNeedle)) + 1;
  const nextBlock = classBlockStarts.find((b) => b.line > classStartLine);
  const classEndLine = nextBlock ? nextBlock.line - 1 : rawLines.length;

  const duplicateIdsInClass: string[] = [];
  for (const id of allIds) {
    const occurrencesInBlock = (idLineOccurrences.get(id) ?? []).filter(
      (ln) => ln >= classStartLine && ln <= classEndLine
    );
    if (occurrencesInBlock.length > 1) duplicateIdsInClass.push(id);
  }

  const overlaps: Array<{ a: string; b: string; dist: number }> = [];
  for (let i = 0; i < allIds.length; i++) {
    for (let j = i + 1; j < allIds.length; j++) {
      const n1 = nodes[allIds[i]];
      const n2 = nodes[allIds[j]];
      const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
      if (dist < OVERLAP_THRESHOLD) overlaps.push({ a: n1.id, b: n2.id, dist: Math.round(dist * 100) / 100 });
    }
  }

  // --- Section 5: isolated clusters (connected components of size >= 2 that never
  // reach root — a single unreached node is already reported in section 3) ---
  const visited = new Set<string>();
  const isolatedClusters: string[][] = [];
  for (const id of allIds) {
    if (visited.has(id)) continue;
    const component: string[] = [];
    const cq = [id];
    visited.add(id);
    while (cq.length > 0) {
      const cur = cq.shift()!;
      component.push(cur);
      const node = nodes[cur];
      if (!node) continue;
      for (const nb of node.connections) {
        if (nodes[nb] && !visited.has(nb)) {
          visited.add(nb);
          cq.push(nb);
        }
      }
    }
    const touchesRoot = component.some((cid) => rootIds.includes(cid));
    if (!touchesRoot && component.length >= 2) isolatedClusters.push(component);
  }

  // --- Section 6: type/tier consistency (report-only) ---
  const rootWithBadType = rootIds.filter((id) => nodes[id].type !== 'root');
  const keystoneWithOutgoing: Array<{ id: string; to: string[] }> = [];
  for (const id of allIds) {
    const node = nodes[id];
    if (node.type === 'keystone' && node.connections.length > 1) {
      keystoneWithOutgoing.push({ id, to: node.connections });
    }
  }

  // --- Section 7: graph stats ---
  const typeCounts: Record<string, number> = {};
  for (const id of allIds) {
    const t = nodes[id].type;
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  }
  const edgeSet = new Set<string>();
  for (const node of Object.values(nodes)) {
    for (const nb of node.connections) {
      if (nodes[nb]) edgeSet.add([node.id, nb].sort().join('--'));
    }
  }
  // Max depth: longest shortest-path from any root, BFS distances over reachable nodes.
  const dist = new Map<string, number>();
  const dq: string[] = [];
  for (const r of rootIds) {
    dist.set(r, 0);
    dq.push(r);
  }
  while (dq.length > 0) {
    const cur = dq.shift()!;
    const d = dist.get(cur)!;
    const node = nodes[cur];
    if (!node) continue;
    for (const nb of node.connections) {
      if (nodes[nb] && !dist.has(nb)) {
        dist.set(nb, d + 1);
        dq.push(nb);
      }
    }
  }
  const maxDepth = dist.size > 0 ? Math.max(...dist.values()) : 0;

  results.push({
    className,
    pass: {
      bidirectional: oneWayLinks.length === 0,
      dangling: dangling.length === 0,
      reachability: unreachable.length === 0,
      duplicates: duplicateIdsInClass.length === 0 && overlaps.length === 0,
    },
    oneWayLinks,
    dangling,
    unreachable,
    rootIds,
    duplicateIdsInClass,
    overlaps,
    isolatedClusters,
    rootWithBadType,
    keystoneWithOutgoing,
    stats: { nodeCount: allIds.length, edgeCount: edgeSet.size, maxDepth, typeCounts },
  });
}

anyCrossClassDuplicateIds = [...idToClasses.entries()]
  .filter(([, classes]) => classes.length > 1)
  .map(([id, classes]) => `${id} (${classes.join(', ')})`);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
let hasBlockingError = false;

console.log('='.repeat(100));
console.log('SKILL TREE CONNECTIVITY VALIDATION');
console.log('='.repeat(100));
console.log();
console.log(
  'ตารางสรุปผลต่อคลาส (1=Bidirectional, 2=Dangling refs, 3=Reachability, 4=Duplicates/Overlap):'
);
console.log();
const header = ['Class', '1', '2', '3', '4'].map((h) => h.padEnd(16)).join('');
console.log(header);
console.log('-'.repeat(100));
for (const r of results) {
  const cell = (ok: boolean) => (ok ? 'PASS'.padEnd(16) : 'FAIL'.padEnd(16));
  console.log(
    r.className.padEnd(16) +
      cell(r.pass.bidirectional) +
      cell(r.pass.dangling) +
      cell(r.pass.reachability) +
      cell(r.pass.duplicates)
  );
  if (!r.pass.bidirectional || !r.pass.dangling || !r.pass.reachability || !r.pass.duplicates) {
    hasBlockingError = true;
  }
}
console.log();

if (!hasBlockingError && anyCrossClassDuplicateIds.length === 0) {
  console.log('0 error ทุกหัวข้อ (sections 1-4, ทุกคลาส)');
} else {
  console.log('พบปัญหา — รายละเอียดตามคลาสด้านล่าง:');
}
console.log();

for (const r of results) {
  const issues =
    r.oneWayLinks.length +
    r.dangling.length +
    r.unreachable.length +
    r.duplicateIdsInClass.length +
    r.overlaps.length;
  if (issues === 0) continue;

  console.log('-'.repeat(100));
  console.log(`CLASS: ${r.className}`);
  console.log('-'.repeat(100));

  if (r.oneWayLinks.length > 0) {
    console.log(`\n[1. BIDIRECTIONAL INTEGRITY] ${r.oneWayLinks.length} one-way link(s):`);
    for (const l of r.oneWayLinks) {
      console.log(
        `  - ${l.a} -> ${l.b} exists but ${l.b} -> ${l.a} is missing  (${lineRef(l.a)} / ${lineRef(l.b)})`
      );
    }
  }

  if (r.dangling.length > 0) {
    console.log(`\n[2. DANGLING REFERENCES] ${r.dangling.length} broken reference(s):`);
    for (const d of r.dangling) {
      console.log(`  - ${d.from} -> '${d.to}' (no such node exists)  (${lineRef(d.from)})`);
    }
  }

  if (r.unreachable.length > 0) {
    console.log(
      `\n[3. REACHABILITY FROM ROOT] ${r.unreachable.length} node(s) unreachable from root(s) [${r.rootIds.join(', ')}]:`
    );
    for (const id of r.unreachable) {
      console.log(`  - ${id}  (${lineRef(id)})`);
    }
  }

  if (r.duplicateIdsInClass.length > 0) {
    console.log(
      `\n[4a. DUPLICATE IDS] ${r.duplicateIdsInClass.length} id(s) declared more than once in this class's source block:`
    );
    for (const id of r.duplicateIdsInClass) {
      console.log(`  - '${id}' declared at lines: ${(idLineOccurrences.get(id) ?? []).join(', ')}`);
    }
  }

  if (r.overlaps.length > 0) {
    console.log(
      `\n[4b. OVERLAPPING COORDINATES] ${r.overlaps.length} pair(s) within ${OVERLAP_THRESHOLD} units:`
    );
    for (const o of r.overlaps) {
      console.log(`  - ${o.a} <-> ${o.b}: distance ${o.dist}  (${lineRef(o.a)} / ${lineRef(o.b)})`);
    }
  }
  console.log();
}

if (anyCrossClassDuplicateIds.length > 0) {
  console.log('-'.repeat(100));
  console.log('[4c. CROSS-CLASS ID REUSE] (info — separate objects, no silent data loss, but worth checking):');
  for (const entry of anyCrossClassDuplicateIds) console.log(`  - ${entry}`);
  console.log();
}

// --- Sections 5-7: warnings/report only, never affect exit code ---
console.log('='.repeat(100));
console.log('SECTIONS 5-7 — REPORT ONLY (ไม่ block, warning เท่านั้น)');
console.log('='.repeat(100));

for (const r of results) {
  console.log('-'.repeat(100));
  console.log(`CLASS: ${r.className}`);

  console.log(`\n[5. ISOLATED CLUSTERS] ${r.isolatedClusters.length} cluster(s) disconnected from root:`);
  if (r.isolatedClusters.length === 0) console.log('  (none)');
  for (const cluster of r.isolatedClusters) {
    console.log(`  - {${cluster.join(', ')}}`);
  }

  console.log(`\n[6. TYPE/TIER CONSISTENCY]`);
  console.log(`  root count: ${r.rootIds.length} [${r.rootIds.join(', ')}]${r.rootIds.length > 1 ? '  <-- multiple roots' : ''}`);
  if (r.rootWithBadType.length > 0) {
    console.log(`  root id(s) whose node.type is NOT 'root': ${r.rootWithBadType.join(', ')}`);
  }
  console.log(
    `  keystone(s) with outgoing connections beyond themselves (expected for the ascension-tier system; flagged for visibility only): ${r.keystoneWithOutgoing.length}`
  );
  for (const k of r.keystoneWithOutgoing) {
    console.log(`    - ${k.id} -> [${k.to.join(', ')}]`);
  }

  console.log(`\n[7. GRAPH STATS]`);
  console.log(`  nodes: ${r.stats.nodeCount}, edges: ${r.stats.edgeCount}, max depth from root: ${r.stats.maxDepth}`);
  console.log(`  by type: ${JSON.stringify(r.stats.typeCounts)}`);
  console.log();
}

console.log('='.repeat(100));
if (hasBlockingError) {
  console.log('RESULT: FAIL — blocking issues found in sections 1-4 (see above).');
  process.exit(1);
} else {
  console.log('RESULT: PASS — sections 1-4 clean across every class. See sections 5-7 for informational notes.');
  process.exit(0);
}
