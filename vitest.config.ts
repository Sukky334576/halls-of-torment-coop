import { defineConfig, configDefaults } from 'vitest/config';

// 2026-09-12: multiple Claude Code sessions routinely work on this repo in parallel via git
// worktrees checked out under `.claude/worktrees/<name>/` — each one a full copy of the repo,
// test files included. Vitest's default excludes don't know about that directory, so running
// `vitest run` from the repo root picks up every sibling worktree's *.test.ts too, silently
// multiplying the reported test count by however many worktrees happen to exist at that moment
// (confirmed: this inflated "293 tests" / "311 tests" claims in same-day archived specs to what
// was actually 93 — see docs/archive/2026-09-12-card-description-mismatch-fix.md's correction).
// Excluding `.claude/**` makes `vitest run` deterministic regardless of how many worktrees are
// checked out alongside this one.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**']
  }
});
