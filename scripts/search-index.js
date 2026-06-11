#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_ROOT_CANDIDATES = [
  "D:\\Resource\\Obsidian\\AI",
  path.join(os.homedir(), "Documents", "Obsidian", "AI")
];
const DEFAULT_DIRS = ["AI Tools", "Claude Code", "Codex"];

/**
 * Resolve the Obsidian AI workspace root. The environment variable keeps the
 * public plugin portable, while local fallback paths preserve the author's
 * current setup and a common Windows vault location.
 *
 * @returns {string} Best-effort Obsidian AI workspace root.
 */
function resolveDefaultRoot() {
  if (process.env.TOOL_ADVISOR_OBSIDIAN_ROOT) {
    return process.env.TOOL_ADVISOR_OBSIDIAN_ROOT;
  }

  return DEFAULT_ROOT_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || DEFAULT_ROOT_CANDIDATES[0];
}

/**
 * @typedef {Object} SearchArgs
 * @property {string} query Search phrase provided by the agent.
 * @property {number} limit Maximum number of results to print.
 * @property {string} root Obsidian AI workspace root.
 * @property {string[]} dirs Relative directories to scan under root.
 */

/**
 * Parse CLI arguments for local index search.
 *
 * @param {string[]} argv Raw process arguments after the script path.
 * @returns {SearchArgs} Normalized search arguments.
 */
function parseArgs(argv) {
  const args = {
    query: "",
    limit: 8,
    root: resolveDefaultRoot(),
    dirs: DEFAULT_DIRS
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--query" && argv[i + 1]) {
      args.query = argv[i + 1];
      i += 1;
    } else if (arg === "--limit" && argv[i + 1]) {
      const parsed = Number.parseInt(argv[i + 1], 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        args.limit = parsed;
      }
      i += 1;
    } else if (arg === "--root" && argv[i + 1]) {
      args.root = argv[i + 1];
      i += 1;
    } else if (arg === "--dirs" && argv[i + 1]) {
      args.dirs = argv[i + 1].split(",").map((item) => item.trim()).filter(Boolean);
      i += 1;
    }
  }

  return args;
}

/**
 * Split a query into lowercase tokens. Chinese text is kept as phrase tokens
 * because whitespace tokenization is unreliable for mixed-language notes.
 *
 * @param {string} query User query.
 * @returns {string[]} Tokens used for scoring.
 */
function tokenize(query) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) {
    return [];
  }

  const parts = normalized
    .split(/[\s,.;:!?，。；：！？、()[\]{}"'`<>|\\/]+/u)
    .map((part) => part.trim())
    .filter(Boolean);

  return [...new Set([normalized, ...parts])];
}

/**
 * Recursively collect Markdown files below a directory.
 *
 * @param {string} dir Absolute directory to scan.
 * @returns {string[]} Absolute Markdown file paths.
 */
function collectMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    let entries;

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".")) {
          stack.push(fullPath);
        }
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * Extract a compact text preview around the strongest token match.
 *
 * @param {string} content File content.
 * @param {string[]} tokens Query tokens.
 * @returns {string} Single-line preview.
 */
function makePreview(content, tokens) {
  const squashed = content.replace(/\s+/g, " ").trim();
  const lower = squashed.toLowerCase();
  const token = tokens.find((item) => lower.includes(item));
  const index = token ? lower.indexOf(token) : 0;
  const start = Math.max(0, index - 80);
  const end = Math.min(squashed.length, index + 220);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < squashed.length ? "..." : "";
  return `${prefix}${squashed.slice(start, end)}${suffix}`;
}

/**
 * Score a note by title and content token hits.
 *
 * @param {string} filePath Absolute Markdown file path.
 * @param {string} content File content.
 * @param {string[]} tokens Query tokens.
 * @returns {number} Relevance score.
 */
function scoreNote(filePath, content, tokens) {
  const title = path.basename(filePath, ".md").toLowerCase();
  const lower = content.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (title.includes(token)) {
      score += 8;
    }

    const firstHit = lower.indexOf(token);
    if (firstHit >= 0) {
      score += 3;
      if (firstHit < 500) {
        score += 2;
      }
    }
  }

  return score;
}

/**
 * Search local Obsidian notes for candidate tools.
 *
 * @param {SearchArgs} args Search arguments.
 * @returns {Array<{path: string, title: string, score: number, preview: string}>}
 */
function search(args) {
  const tokens = tokenize(args.query);
  if (tokens.length === 0) {
    return [];
  }

  const files = args.dirs.flatMap((dir) => collectMarkdownFiles(path.join(args.root, dir)));
  const results = [];

  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    const score = scoreNote(filePath, content, tokens);
    if (score > 0) {
      results.push({
        path: filePath,
        title: path.basename(filePath, ".md"),
        score,
        preview: makePreview(content, tokens)
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, args.limit);
}

/**
 * Print search results as JSON for reliable agent parsing.
 *
 * @param {SearchArgs} args Search arguments.
 * @param {ReturnType<typeof search>} results Search results.
 * @returns {void}
 */
function printResults(args, results) {
  const output = {
    query: args.query,
    root: args.root,
    scanned_dirs: args.dirs,
    result_count: results.length,
    results
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  printResults(args, search(args));
}

module.exports = {
  parseArgs,
  resolveDefaultRoot,
  tokenize,
  collectMarkdownFiles,
  scoreNote,
  search
};
