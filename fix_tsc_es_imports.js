#!/usr/bin/env node

import fs from "fs";
import path from "path";
import cJson from "comment-json";
import prompt from "prompt-sync";
import sh from "shelljs";

const APP_ID = "FIX_TS_IMPORTS:";
const DEFAULT_TSCONFIG = "./tsconfig.json";
const MATCH_PATTERN = /(["'])(?!.*\.js)(\.?\.\/.*)(["'])/;
const FORBIDDEN_FOLDERS = ["src", "node_modules", "app"];

const setup = {
  ask_to_proceed: true,
  alternate_tsconfig: null,
  verbose: false,
  dry_run: false,
};

/** Check for command line args and change setup object accordingly */
getArgs();

/** Gets the outDir configuration for tsconfig.json or alternative .json file */
const outDir = getOutDirFromConfig(setup.alternate_tsconfig);

/** Find the files to work on or emit a folder not found error */
let files;
try {
  files = sh.find(outDir).filter((file) => file.match(/\.js$/));
} catch (error) {
  console.error(APP_ID, "ERROR:", "does this '" + outDir + "' folder exists?");
  process.exit(1);
}
console.log(APP_ID, "found", files.length, ".js files:", files);

/** Show what will be done */
if (setup.verbose) {
  console.log();
  console.log(sh.grep(MATCH_PATTERN, files).toString());
}

/** Check if the -y flag has been issued or ask for a confirmation to proceed */
if (setup.ask_to_proceed) askToProceed() ? proceed(files) : process.exit(0);
else proceed(files);

/**
 * Get command line args
 */
function getArgs() {
  let args = process.argv;

  for (let index = 3; index <= args.length; index++) {
    const element = args[index - 1];

    if (element === "-h" || element === "--help") printHelp();
    else if (element === "-y" || element === "--yes")
      setup.ask_to_proceed = false;
    else if (element === "-V" || element === "--verbose") setup.verbose = true;
    else if (element === "-d" || element === "--dry") {
      setup.dry_run = true;
      setup.verbose = true;
      setup.ask_to_proceed = false;
    } else if (element.includes(".json") || element.includes(".JSON"))
      setup.alternate_tsconfig = element;
    else printHelp();
  }
}

/**
 * Prints a basic usage help
 */
function printHelp() {
  console.log(`fix-tsc-es-imports:

Looks for every '.js' file at the 'compileOptions.outDir' folder found on the default 'tsconfig.json' or another provided '.json' config file. Then fixes all extensionless typescript relative imports and exports, adding '.js' extensions to them.

Usage: fix_tsc_imports [-h|--help] [-y] [alternative_tsconfig.json]

  -h --help     usage info
  -y --yes      ignore confirmation and proceed straight away
  -V --verbose  verbose, outputs sed changed strings
  -d --dry      dry run, do not change anything and output sed changed strings (implied -V and -y)

An alternative 'tsconfig.json' can be provided. It must have a '.json' extension. For example:

  fix_tsc_imports -y ./dev/dev_tsconfig.json

`);
  process.exit(0);
}

/**
 * Asks for user confirmation to proceed
 */
function askToProceed() {
  let promptObj = prompt({});
  let input = promptObj("Proceed (Y/n)?", "y");
  return input === "y" || input === "Y" ? true : false;
}

/**
 * The substitution itself
 */
function proceed(foundFiles) {
  /**
   * From <https://stackoverflow.com/questions/62619058/appending-js-extension-on-relative-import-statements-during-typescript-compilat/73075563#73075563>
   */
  if (!setup.dry_run) {
    sh.sed("-i", MATCH_PATTERN, "$1$2$3.js$4", foundFiles);
    console.log(APP_ID, "done.");
  } else console.log(APP_ID, "nothing done, dry run.");
}

/**
 * Get outDir from tsconfig.json or an alternative json file
 */
function getOutDirFromConfig(alternativeTsConfig) {
  let tsConfig = alternativeTsConfig ? alternativeTsConfig : DEFAULT_TSCONFIG;
  let outDir;

  try {
    outDir = cJson.parse(fs.readFileSync(tsConfig).toString()).compilerOptions
      .outDir;
  } catch (error) {
    console.error(
      APP_ID,
      "ERROR:",
      "could not find 'compilerOptions.outDir' in '" + tsConfig + "'"
    );
    process.exit(1);
  }

  console.log(APP_ID, "found", tsConfig, 'outDir: "' + outDir + '"');

  if (!checkSubfolder(outDir)) {
    console.error(
      APP_ID,
      "ERROR:",
      "'outDir' is not a subfolder of current folder or is in the forbidden list:",
      FORBIDDEN_FOLDERS,
      "Are you starting the 'outDir' parameter with a slash? Please review your tsconfig.json file to output to a safe subfolder."
    );
    process.exit(1);
  }

  return outDir;
}

/**
 * Check if outDir is a subfolder of the current folder and not in the forbidden list
 */
function checkSubfolder(folder) {
  const relative = path.relative("./", folder);

  let forbidden = false;

  /** Check if folder is not in the forbidden list */
  FORBIDDEN_FOLDERS.forEach((value) => {
    if (value === relative.toLowerCase()) forbidden = true;
  });

  return (
    !forbidden &&
    relative &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
}
