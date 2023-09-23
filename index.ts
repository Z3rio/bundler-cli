#! /usr/bin/env node
import { execSync } from "child_process";
import { removeSync } from "fs-extra";

const verbose: boolean = false;
const cwd = process.cwd();
let config: Config | null = null;
const globalIgnores = ["bundle.config.js"];

interface Config {
  name: string;
  tasks?: string[];
  ignore?: string[];
}

function debugLog(msg: string): void {
  if (verbose == true) {
    console.log(msg);
  }
}

function validateConfig(cfg: unknown): boolean {
  return (
    cfg !== null &&
    typeof cfg == "object" &&
    "name" in cfg &&
    typeof cfg.name == "string" &&
    (!("tasks" in cfg) ||
      typeof cfg.tasks == "undefined" ||
      typeof cfg.tasks == "object") &&
    (!("ignore" in cfg) ||
      typeof cfg.ignore == "undefined" ||
      typeof cfg.ignore == "object")
  );
}

function execute(cmd: string): void {
  execSync(cmd, verbose ? { stdio: [0, 1, 2] } : undefined);
}

try {
  config = require(cwd + "/bundler.config");
} catch (e) {
  console.log("Error: Could not find/require bundler.config.js file");
  debugLog(e);
}

if (config !== null && validateConfig(config)) {
  debugLog("Valid config: " + JSON.stringify(config));

  if (config.tasks) {
    for (let i = 0; i < config.tasks.length; i++) {
      execute(config.tasks[i]);
    }
  }

  let zipCmd = `7z a ${config.name}.zip`;

  if (config.ignore) {
    config.ignore = [...config.ignore, ...globalIgnores];

    for (let i = 0; i < config.ignore.length; i++) {
      zipCmd += ` -x!${config.ignore[i]}`;
    }
  }

  debugLog("Deleted zip");
  removeSync(`${cwd}/${config.name}.zip`);

  debugLog("Created zip");
  execute(zipCmd);

  console.log("Successfully bundled files");
} else {
  console.log("Error: Invalid config structure");
}
