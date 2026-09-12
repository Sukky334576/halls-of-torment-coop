import os from 'os';
import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';

/** Samples host (VPS) and process (this game-server) CPU/RAM on a timer and writes one row per
 * sample straight to telemetry.db — no TelemetryBuffer batching needed here, unlike game_events/
 * error_log: this runs at most once every few seconds (not from the 25Hz tick loop), so a plain
 * synchronous insert is not a performance concern. */
export class SystemMetricsSampler {
  private lastCpuInfo: os.CpuInfo[] | null = null;
  private lastProcCpuUsage: NodeJS.CpuUsage = process.cpuUsage();
  private lastProcCpuAt: number = Date.now();
  private timer: ReturnType<typeof setInterval> | null = null;
  private insertStmt: Database.Statement;

  constructor(private db: Database.Database) {
    this.insertStmt = db.prepare(`
      INSERT INTO system_metrics
        (host_cpu_pct, host_mem_used_mb, host_mem_total_mb, process_cpu_pct, process_rss_mb,
         disk_used_mb, disk_total_mb, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
  }

  /** Disk space of the filesystem holding telemetry.db itself — the disk that actually matters
   * for whether this data can keep growing (see risk #24: no retention/prune policy yet).
   * `better-sqlite3`'s Database exposes the path it was opened with via `.name`; for an
   * in-memory DB (unit tests) that's the literal string ':memory:', which has no real
   * filesystem to statfs — falls back to `process.cwd()` there, and returns null entirely if
   * `fs.statfsSync` isn't available/fails for any other reason (e.g. an unsupported platform)
   * rather than let a disk-space failure take down the whole sample. */
  private getDiskUsage(): { usedMb: number; totalMb: number } | null {
    try {
      const dbPath = this.db.name;
      const dirToCheck = dbPath && dbPath !== ':memory:' ? path.dirname(dbPath) : process.cwd();
      const stats = fs.statfsSync(dirToCheck);
      const totalBytes = stats.blocks * stats.bsize;
      // bavail (not bfree) excludes blocks reserved for root — the figure that reflects what
      // this (non-root) process can actually still write.
      const availableBytes = stats.bavail * stats.bsize;
      return {
        totalMb: Math.round(totalBytes / (1024 * 1024)),
        usedMb: Math.round((totalBytes - availableBytes) / (1024 * 1024))
      };
    } catch {
      return null;
    }
  }

  /** % of all cores busy (0-100) since the last call — null on the very first call, since there's
   * no earlier snapshot yet to diff against. */
  private computeHostCpuPercent(): number | null {
    const cpus = os.cpus();
    const previous = this.lastCpuInfo;
    this.lastCpuInfo = cpus;
    if (!previous) return null;

    let idleDelta = 0;
    let totalDelta = 0;
    for (let i = 0; i < cpus.length; i++) {
      const prev = previous[i].times;
      const curr = cpus[i].times;
      idleDelta += curr.idle - prev.idle;
      totalDelta +=
        curr.user - prev.user + (curr.nice - prev.nice) + (curr.sys - prev.sys) + (curr.idle - prev.idle) + (curr.irq - prev.irq);
    }
    if (totalDelta <= 0) return null;
    return Math.round((1 - idleDelta / totalDelta) * 1000) / 10;
  }

  /** % of a single core this Node process used since the last call (can exceed 100 only if the
   * process somehow used more than one core's worth of time in the interval — this app is
   * effectively single-threaded, so that's not expected in practice). Unlike the host CPU
   * reading, this never returns null — `lastProcCpuUsage` starts as a real snapshot taken in the
   * constructor, so even the very first call has a genuine (if short) interval to diff against.
   * Two calls landing in the same millisecond (Date.now()'s resolution) still return a real 0
   * rather than null — found via a rapid-succession test where returning null here silently
   * dropped the whole sample row even though host CPU/memory were still perfectly measurable. */
  private computeProcessCpuPercent(): number {
    const now = Date.now();
    const elapsedMicros = (now - this.lastProcCpuAt) * 1000;
    const diff = process.cpuUsage(this.lastProcCpuUsage);
    this.lastProcCpuUsage = process.cpuUsage();
    this.lastProcCpuAt = now;
    if (elapsedMicros <= 0) return 0;
    return Math.round(((diff.user + diff.system) / elapsedMicros) * 1000) / 10;
  }

  /** Exposed for tests — computes one sample and writes it if both CPU deltas were available
   * (i.e. not the very first call since the sampler was constructed). */
  sampleOnce(): void {
    const hostCpuPct = this.computeHostCpuPercent();
    const processCpuPct = this.computeProcessCpuPercent();
    if (hostCpuPct === null) return; // Only the very first call ever hits this (see above).

    const hostMemTotalMb = Math.round(os.totalmem() / (1024 * 1024));
    const hostMemFreeMb = Math.round(os.freemem() / (1024 * 1024));
    const processRssMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
    const disk = this.getDiskUsage();

    this.insertStmt.run(
      hostCpuPct,
      hostMemTotalMb - hostMemFreeMb,
      hostMemTotalMb,
      processCpuPct,
      processRssMb,
      disk?.usedMb ?? null,
      disk?.totalMb ?? null,
      Date.now()
    );
  }

  start(intervalMs: number): void {
    if (this.timer) return; // already running
    this.timer = setInterval(() => this.sampleOnce(), intervalMs);
    this.timer.unref?.(); // a live sampler alone shouldn't keep the process from exiting
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
