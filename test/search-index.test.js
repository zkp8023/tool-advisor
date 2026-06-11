import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  formatOutput,
  parseArgs,
  search,
  tokenize
} from "../scripts/search-index.js";
import {
  normalizeCliArgs
} from "../src/cli.js";
import {
  parseInstallArgs
} from "../src/install.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(testDir, "fixtures", "vault");

test("tokenize expands compact mixed Chinese queries into searchable terms", () => {
  const tokens = tokenize("PPT自动化插件");

  assert.ok(tokens.includes("ppt"));
  assert.ok(tokens.includes("自动化"));
  assert.ok(tokens.includes("插件"));
});

test("default scan scope is limited to the tool knowledge directory", () => {
  const args = parseArgs([]);

  assert.deepEqual(args.dirs, ["AI Tools"]);
});

test("default root uses only the installer-managed knowledge vault", () => {
  const originalRoot = process.env.TOOL_ADVISOR_OBSIDIAN_ROOT;
  const originalConfig = process.env.TOOL_ADVISOR_CONFIG;
  delete process.env.TOOL_ADVISOR_OBSIDIAN_ROOT;
  process.env.TOOL_ADVISOR_CONFIG = path.join(testDir, "fixtures", "missing-config.json");

  try {
    const args = parseArgs([]);

    assert.equal(
      args.root,
      path.join(os.homedir(), ".tool-advisor", "ai-knowledge-vault")
    );
  } finally {
    if (originalRoot === undefined) {
      delete process.env.TOOL_ADVISOR_OBSIDIAN_ROOT;
    } else {
      process.env.TOOL_ADVISOR_OBSIDIAN_ROOT = originalRoot;
    }

    if (originalConfig === undefined) {
      delete process.env.TOOL_ADVISOR_CONFIG;
    } else {
      process.env.TOOL_ADVISOR_CONFIG = originalConfig;
    }
  }
});

test("default root uses the installer-written knowledge vault config", async () => {
  const originalRoot = process.env.TOOL_ADVISOR_OBSIDIAN_ROOT;
  const originalConfig = process.env.TOOL_ADVISOR_CONFIG;
  const configPath = path.join(testDir, "fixtures", "tool-advisor-config.json");
  const configuredRoot = "C:\\configured\\ai-knowledge-vault";

  delete process.env.TOOL_ADVISOR_OBSIDIAN_ROOT;
  process.env.TOOL_ADVISOR_CONFIG = configPath;

  try {
    const { parseArgs: parseArgsWithConfig } = await import(`../src/search.js?config=${Date.now()}`);
    const args = parseArgsWithConfig([]);

    assert.equal(args.root, configuredRoot);
  } finally {
    if (originalRoot === undefined) {
      delete process.env.TOOL_ADVISOR_OBSIDIAN_ROOT;
    } else {
      process.env.TOOL_ADVISOR_OBSIDIAN_ROOT = originalRoot;
    }

    if (originalConfig === undefined) {
      delete process.env.TOOL_ADVISOR_CONFIG;
    } else {
      process.env.TOOL_ADVISOR_CONFIG = originalConfig;
    }
  }
});

test("cli defaults to search when no subcommand is provided", () => {
  const normalized = normalizeCliArgs(["--query", "PPT 自动化"]);

  assert.equal(normalized.command, "search");
  assert.deepEqual(normalized.args, ["--query", "PPT 自动化"]);
});

test("cli accepts explicit install subcommands", () => {
  const normalized = normalizeCliArgs(["install", "--target", "opencode"]);

  assert.equal(normalized.command, "install");
  assert.deepEqual(normalized.args, ["--target", "opencode"]);
});

test("cli does not expose a duplicate install-codex subcommand", () => {
  const normalized = normalizeCliArgs(["install-codex"]);

  assert.equal(normalized.command, "search");
  assert.deepEqual(normalized.args, ["install-codex"]);
});

test("installer accepts explicit knowledge vault choices", () => {
  const cloneArgs = parseInstallArgs(["--target", "codex", "--clone-vault"]);
  const localArgs = parseInstallArgs(["--target", "opencode", "--vault-dir", fixtureRoot]);

  assert.equal(cloneArgs.cloneVault, true);
  assert.equal(localArgs.vaultDir, fixtureRoot);
});

test("installer rejects conflicting knowledge vault choices", () => {
  assert.throws(
    () => parseInstallArgs(["--clone-vault", "--vault-dir", fixtureRoot]),
    /either --clone-vault or --vault-dir/u
  );
});

test("formatOutput hides absolute paths by default and includes diagnostics", () => {
  const args = parseArgs([
    "--query",
    "PPT 自动化 插件",
    "--root",
    fixtureRoot,
    "--dirs",
    "AI Tools,Codex"
  ]);
  const searchResult = search(args);
  const output = formatOutput(args, searchResult);

  assert.equal(output.root, undefined);
  assert.equal(output.root_exists, true);
  assert.equal(output.scanned_file_count, 2);
  assert.equal(output.result_count, 2);
  assert.equal(path.isAbsolute(output.results[0].path), false);
  assert.equal(output.results[0].absolute_path, undefined);
});

test("formatOutput can include absolute paths when explicitly requested", () => {
  const args = parseArgs([
    "--query",
    "PPT 自动化 插件",
    "--root",
    fixtureRoot,
    "--dirs",
    "AI Tools",
    "--show-absolute-paths"
  ]);
  const searchResult = search(args);
  const output = formatOutput(args, searchResult);

  assert.equal(path.isAbsolute(output.root), true);
  assert.equal(path.isAbsolute(output.results[0].absolute_path), true);
});
