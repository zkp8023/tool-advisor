#!/usr/bin/env node

import { runInstallCli } from "../src/install.js";

try {
  runInstallCli(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
