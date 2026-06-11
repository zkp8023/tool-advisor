#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { normalizeCliArgs, runCli } from "../src/cli.js";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2));
}

export {
  normalizeCliArgs,
  runCli
};
