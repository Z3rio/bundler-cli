#! /usr/bin/env node

// index.ts
var import_child_process = require("child_process");
var import_fs_extra = require("fs-extra");
var verbose = process.argv.includes("-v") || process.argv.includes("-verbose");
var cwd = process.cwd();
var config = null;
var globalIgnores = ["bundle.config.js"];
function debugLog(msg) {
  if (verbose == true) {
    console.log(msg);
  }
}
function validateConfig(cfg) {
  return cfg !== null && typeof cfg == "object" && "name" in cfg && typeof cfg.name == "string" && (!("tasks" in cfg) || typeof cfg.tasks == "undefined" || typeof cfg.tasks == "object") && (!("ignore" in cfg) || typeof cfg.ignore == "undefined" || typeof cfg.ignore == "object");
}
function execute(cmd) {
  (0, import_child_process.execSync)(cmd, verbose ? { stdio: [0, 1, 2] } : void 0);
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
  (0, import_fs_extra.removeSync)(`${cwd}/${config.name}.zip`);
  debugLog("Created zip");
  execute(zipCmd);
  console.log("Successfully bundled files");
} else {
  console.log("Error: Invalid config structure");
}
