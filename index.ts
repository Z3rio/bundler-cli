#! /usr/bin/env node
import { execSync } from "child_process";
import path from "node:path";
import { existsSync, readFile, removeSync, writeFile } from "fs-extra";
import { Config, DataRecord } from "./structs";

const dataPath = path.join(__dirname, "../", "data.json");
const verbose: boolean =
  process.argv.includes("-v") || process.argv.includes("-verbose");
const cwd = process.cwd();
let config: Config | null = null;
const globalIgnores = [
  "bundle.config.js",
  "bundle.ps1",
  ".git",
  ".github",
  ".gitattributes",
  ".gitignore",
];

// path, Data
let data: Record<string, DataRecord> = {};

(async () => {
  if (existsSync(dataPath) == false) {
    await writeFile(dataPath, "{}");
  }

  readFile(dataPath, "utf8", (err, dataJsonData) => {
    if (err) {
      console.error(err);
      return;
    }

    data = JSON.parse(dataJsonData);

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

    function getFxManifestVersion(text: string): string | null {
      text = text.replace("fx_version", "");
      const idx = text.indexOf("version");

      if (idx !== -1) {
        const lines = text.substring(idx).split(/\r?\n|\r|\n/g);

        if (lines.length >= 1) {
          const line = lines[0];
          const splits = line.split(line.includes("'") == true ? "'" : '"');

          if (splits.length >= 2) {
            return splits[1];
          }
        }
      }

      return null;
    }

    function fxManifestContainsDevUiPage(text: string): boolean {
      const lines = text
        .split(/\r?\n|\r|\n/g)
        .filter((line: string) => line.includes("ui_page"));

      for (const line of lines) {
        if (
          line.includes("--") == false &&
          line.includes("localhost") == true
        ) {
          return true;
        }
      }

      return false;
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

    readFile(
      path.join(cwd, "fxmanifest.lua"),
      "utf8",
      (err, fxmanifestData) => {
        if (err) {
          console.error(err);
          return;
        }

        const version = getFxManifestVersion(fxmanifestData);

        if (version !== null) {
          if (data[cwd] !== undefined) {
            if (data[cwd].version == version) {
              console.log("DONT FORGET TO UPDATE THE VERSION");
            }

            data[cwd].version = version;
          } else {
            data[cwd] = {
              version: version,
            };
          }
        }

        if (fxManifestContainsDevUiPage(fxmanifestData) == true) {
          console.log("REMOVE/COMMENT THE DEV UI_PAGE");
        }

        writeFile(dataPath, JSON.stringify(data));

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
      },
    );
  });
})();
