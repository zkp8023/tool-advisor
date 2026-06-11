import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_ROOT_CANDIDATES = [
  path.join(os.homedir(), ".tool-advisor", "ai-knowledge-vault")
];
const DEFAULT_DIRS = ["AI Tools"];

/**
 * Resolve the installer config path at call time so tests and agent sessions can
 * override it with `TOOL_ADVISOR_CONFIG` without reloading the module.
 *
 * @returns {string} Tool Advisor config path.
 */
function resolveConfigPath() {
  return process.env.TOOL_ADVISOR_CONFIG
    || path.join(os.homedir(), ".tool-advisor", "config.json");
}

/**
 * Read the knowledge vault path recorded by the installer.
 *
 * @returns {string} Configured knowledge vault path, or an empty string.
 */
export function readConfiguredRoot() {
  const configPath = resolveConfigPath();
  if (!fs.existsSync(configPath)) {
    return "";
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return typeof config.knowledgeVaultRoot === "string" ? config.knowledgeVaultRoot : "";
  } catch {
    return "";
  }
}

/**
 * Resolve the AI knowledge vault root. Public installs must not depend on the
 * author's machine layout. The installer-written config captures whether the
 * user chose their own vault or the maintained GitHub vault.
 *
 * @returns {string} Best-effort Obsidian AI workspace root.
 */
export function resolveDefaultRoot() {
  if (process.env.TOOL_ADVISOR_OBSIDIAN_ROOT) {
    return process.env.TOOL_ADVISOR_OBSIDIAN_ROOT;
  }

  const configuredRoot = readConfiguredRoot();
  if (configuredRoot) {
    return configuredRoot;
  }

  return DEFAULT_ROOT_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || DEFAULT_ROOT_CANDIDATES[0];
}

/**
 * @typedef {Object} SearchArgs
 * @property {string} query Search phrase provided by the agent.
 * @property {number} limit Maximum number of results to print.
 * @property {string} root Obsidian AI workspace root.
 * @property {string[]} dirs Relative directories to scan under root.
 * @property {boolean} showAbsolutePaths Include local absolute paths in CLI output.
 */

/**
 * Parse CLI arguments for local index search.
 *
 * @param {string[]} argv Raw process arguments after the script path.
 * @returns {SearchArgs} Normalized search arguments.
 */
export function parseArgs(argv) {
  const args = {
    query: "",
    limit: 8,
    root: resolveDefaultRoot(),
    dirs: DEFAULT_DIRS,
    showAbsolutePaths: false
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
    } else if (arg === "--show-absolute-paths") {
      args.showAbsolutePaths = true;
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
export function tokenize(query) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) {
    return [];
  }

  const separatorParts = normalized
    .split(/[\s,.;:!?，。；：！？、()[\]{}"'`<>|\\/]+/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const compactParts = separatorParts.flatMap((part) => {
    const latinRuns = part.match(/[a-z0-9._+#-]+/g) || [];
    const cjkRuns = part.match(/[\p{Script=Han}]+/gu) || [];
    return [...latinRuns, ...cjkRuns.flatMap(makeCjkNgrams)];
  });

  return [...new Set([normalized, ...separatorParts, ...compactParts])];
}

/**
 * Build short Chinese n-grams for compact natural-language queries. This keeps
 * Chinese input useful without adding a tokenizer dependency to a local plugin.
 *
 * @param {string} text Consecutive Han characters from the query.
 * @returns {string[]} Searchable Chinese fragments.
 */
export function makeCjkNgrams(text) {
  const grams = [];
  const maxSize = Math.min(4, text.length);

  for (let size = 2; size <= maxSize; size += 1) {
    for (let index = 0; index <= text.length - size; index += 1) {
      grams.push(text.slice(index, index + size));
    }
  }

  if (text.length === 1) {
    grams.push(text);
  }

  return grams;
}

/**
 * Recursively collect Markdown files below a directory.
 *
 * @param {string} dir Absolute directory to scan.
 * @returns {string[]} Absolute Markdown file paths.
 */
export function collectMarkdownFiles(dir) {
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
export function scoreNote(filePath, content, tokens) {
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
 * @typedef {Object} SearchResult
 * @property {Array<{path: string, title: string, score: number, preview: string}>} results Ranked note matches.
 * @property {number} scannedFileCount Number of Markdown files considered.
 * @property {boolean} rootExists Whether the configured workspace root exists.
 */

/**
 * Search local Obsidian notes for candidate tools.
 *
 * @param {SearchArgs} args Search arguments.
 * @returns {SearchResult} Ranked matches and scan diagnostics.
 */
export function search(args) {
  const tokens = tokenize(args.query);
  if (tokens.length === 0) {
    return {
      results: [],
      scannedFileCount: 0,
      rootExists: fs.existsSync(args.root)
    };
  }

  const rootExists = fs.existsSync(args.root);
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

  return {
    results: results
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, args.limit),
    scannedFileCount: files.length,
    rootExists
  };
}

/**
 * Build JSON-safe CLI output. Absolute paths are opt-in so shared logs do not
 * expose local machine layout by default.
 *
 * @param {SearchArgs} args Search arguments.
 * @param {SearchResult} searchResult Search results and diagnostics.
 * @returns {Object} JSON-ready output contract for agent consumers.
 */
export function formatOutput(args, searchResult) {
  const output = {
    query: args.query,
    root_exists: searchResult.rootExists,
    scanned_dirs: args.dirs,
    scanned_file_count: searchResult.scannedFileCount,
    result_count: searchResult.results.length,
    results: searchResult.results.map((result) => {
      const relativePath = path.relative(args.root, result.path) || path.basename(result.path);
      const formatted = {
        path: relativePath.split(path.sep).join("/"),
        title: result.title,
        score: result.score,
        preview: result.preview
      };

      if (args.showAbsolutePaths) {
        formatted.absolute_path = result.path;
      }

      return formatted;
    })
  };

  if (args.showAbsolutePaths) {
    output.root = args.root;
  }

  return output;
}

/**
 * Print search results as JSON for reliable agent parsing.
 *
 * @param {SearchArgs} args Search arguments.
 * @param {SearchResult} searchResult Search results and diagnostics.
 * @returns {void}
 */
export function printResults(args, searchResult) {
  const output = formatOutput(args, searchResult);

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

/**
 * Run the search CLI with an argv-compatible argument list.
 *
 * @param {string[]} argv CLI arguments after the executable name.
 * @returns {void}
 */
export function runSearchCli(argv) {
  const args = parseArgs(argv);
  printResults(args, search(args));
}
