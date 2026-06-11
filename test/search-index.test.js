const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const {
  formatOutput,
  parseArgs,
  search,
  tokenize
} = require("../scripts/search-index");

const fixtureRoot = path.join(__dirname, "fixtures", "vault");

test("tokenize expands compact mixed Chinese queries into searchable terms", () => {
  const tokens = tokenize("PPT自动化插件");

  assert.ok(tokens.includes("ppt"));
  assert.ok(tokens.includes("自动化"));
  assert.ok(tokens.includes("插件"));
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
