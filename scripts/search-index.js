#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import {
  collectMarkdownFiles,
  formatOutput,
  makeCjkNgrams,
  parseArgs,
  printResults,
  resolveDefaultRoot,
  runSearchCli,
  scoreNote,
  search,
  tokenize
} from "../src/search.js";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSearchCli(process.argv.slice(2));
}

export {
  parseArgs,
  resolveDefaultRoot,
  tokenize,
  makeCjkNgrams,
  collectMarkdownFiles,
  scoreNote,
  search,
  formatOutput,
  printResults,
  runSearchCli
};
