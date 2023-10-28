#! /usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// index.ts
var import_child_process = require("child_process");
var import_node_path = __toESM(require("path"), 1);
var import_fs_extra = require("fs-extra");
var dataPath = import_node_path.default.join(__dirname, "../", "data.json");
var verbose = process.argv.includes("-v") || process.argv.includes("-verbose");
var cwd = process.cwd();
var config = null;
var globalIgnores = [
  "bundle.config.js",
  "bundle.ps1",
  ".git",
  ".github",
  ".gitattributes",
  ".gitignore"
];
(async () => {
  if ((0, import_fs_extra.existsSync)(dataPath) == false) {
    await (0, import_fs_extra.writeFile)(dataPath, "{}");
  }
  (0, import_fs_extra.readFile)(dataPath, "utf8", async (err, dataJsonData) => {
    if (err) {
      console.error(err);
      return;
    }
    let data = null;
    try {
      data = JSON.parse(dataJsonData);
    } catch (e) {
      data = {};
    }
    function debugLog(msg) {
      if (verbose == true) {
        console.log(msg);
      }
    }
    function validateConfig(cfg) {
      return cfg !== null && typeof cfg == "object" && "name" in cfg && typeof cfg.name == "string" && (!("tasks" in cfg) || typeof cfg.tasks == "undefined" || typeof cfg.tasks == "object") && (!("ignore" in cfg) || typeof cfg.ignore == "undefined" || typeof cfg.ignore == "object");
    }
    function getFxManifestVersion(text) {
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
    function fxManifestContainsDevUiPage(text) {
      const lines = text.split(/\r?\n|\r|\n/g).filter((line) => line.includes("ui_page"));
      for (const line of lines) {
        if (line.includes("--") == false && line.includes("localhost") == true) {
          return true;
        }
      }
      return false;
    }
    function execute(cmd) {
      (0, import_child_process.execSync)(cmd, verbose ? { stdio: [0, 1, 2] } : void 0);
    }
    try {
      const importedConfig = await import("file:///" + cwd + "/bundler.config.mjs");
      config = importedConfig.default;
    } catch (e) {
      debugLog(e);
      try {
        const importedConfig = await import("file:///" + cwd + "/bundler.config.js");
        config = importedConfig.default;
      } catch (e2) {
        debugLog(e2);
        console.log("Error: Could not find/require bundler.config.js file");
      }
    }
    (0, import_fs_extra.readFile)(
      import_node_path.default.join(cwd, "fxmanifest.lua"),
      "utf8",
      (err2, fxmanifestData) => {
        if (err2) {
          console.error(err2);
          return;
        }
        const version = getFxManifestVersion(fxmanifestData);
        if (data == null) {
          data = {};
        }
        if (version !== null) {
          if (data[cwd] !== void 0) {
            if (data[cwd].version == version) {
              console.log("DONT FORGET TO UPDATE THE VERSION");
            }
            data[cwd].version = version;
          } else {
            data[cwd] = {
              version
            };
          }
        }
        if (fxManifestContainsDevUiPage(fxmanifestData) == true) {
          console.log("REMOVE/COMMENT THE DEV UI_PAGE");
        }
        (0, import_fs_extra.writeFile)(dataPath, JSON.stringify(data));
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
      }
    );
  });
})();
