import { runInstallCli } from "./install.js";
import { runSearchCli } from "./search.js";

const COMMANDS = new Set(["search", "install"]);

/**
 * Normalize the top-level CLI shape. The default command is search so users can
 * run `npx ... --query "..."` without memorizing a subcommand.
 *
 * @param {string[]} argv CLI arguments after the executable name.
 * @returns {{command: string, args: string[]}} Normalized command and arguments.
 */
export function normalizeCliArgs(argv) {
  const [first, ...rest] = argv;
  if (COMMANDS.has(first)) {
    return {
      command: first,
      args: rest
    };
  }

  return {
    command: "search",
    args: argv
  };
}

/**
 * Dispatch the top-level CLI.
 *
 * @param {string[]} argv CLI arguments after the executable name.
 * @returns {void}
 */
export function runCli(argv) {
  const { command, args } = normalizeCliArgs(argv);

  if (command === "install") {
    runInstallCli(args);
    return;
  }

  runSearchCli(command === "search" ? args : argv);
}
