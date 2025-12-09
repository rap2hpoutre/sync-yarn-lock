#!/usr/bin/env node

import { promises as fs } from "fs";
import { exec } from "child_process";
import util from "util";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const execPromise = util.promisify(exec);

// ANSI colors
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

const HELP = `
${colors.cyan("sync-yarn-lock")} - Sync package.json versions with yarn.lock

${colors.yellow("USAGE")}
  npx sync-yarn-lock [options]

${colors.yellow("OPTIONS")}
  -h, --help      Show this help message
  -v, --version   Show version number
  -d, --dry-run   Preview changes without modifying package.json
  -s, --silent    Only output errors

${colors.yellow("DESCRIPTION")}
  Updates all dependency versions in package.json to match the exact
  versions resolved in yarn.lock. Works with Yarn 4 (Berry).

${colors.yellow("EXAMPLES")}
  npx sync-yarn-lock          Sync versions and save
  npx sync-yarn-lock --dry-run   Preview changes only
`;

function parseArgs(args) {
  return {
    help: args.includes("-h") || args.includes("--help"),
    version: args.includes("-v") || args.includes("--version"),
    dryRun: args.includes("-d") || args.includes("--dry-run"),
    silent: args.includes("-s") || args.includes("--silent"),
  };
}

async function syncPackageJson(options = {}) {
  const { dryRun = false, silent = false } = options;

  if (!silent) {
    console.log(
      colors.cyan("🔄 Syncing package.json versions with yarn.lock...")
    );
  }

  const pkgPath = "./package.json";

  // Check if package.json exists
  try {
    await fs.access(pkgPath);
  } catch {
    console.error(
      colors.red("❌ Error: package.json not found in current directory")
    );
    process.exit(1);
  }

  // Check if yarn is available and yarn.lock exists
  try {
    await execPromise("yarn --version");
  } catch {
    console.error(colors.red("❌ Error: Yarn is not installed or not in PATH"));
    process.exit(1);
  }

  const pkgContent = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
  const depSections = ["dependencies", "devDependencies", "peerDependencies"];

  // Regex to extract exact version (e.g., 18.2.0) from identifier (e.g., react@npm:18.2.0)
  const versionRegex = /:(?<version>[\d\w.-]+)"?$/;

  let updatedCount = 0;
  const changes = [];

  for (const section of depSections) {
    if (!pkgContent[section]) continue;

    const packagesToUpdate = Object.keys(pkgContent[section]);

    for (const pkgName of packagesToUpdate) {
      try {
        const { stdout } = await execPromise(`yarn info ${pkgName} --json`);
        const info = JSON.parse(stdout);

        let resolvedValue = null;

        if (info.value) {
          resolvedValue = info.value;
        } else if (info.children?.[0]?.value) {
          resolvedValue = info.children[0].value;
        } else if (info.children) {
          const versionEntry = info.children.find((c) => c.key === "Version");
          if (versionEntry) {
            resolvedValue = `${pkgName}@npm:${versionEntry.value}`;
          }
        }

        if (!resolvedValue) {
          throw new Error("Could not find resolved identifier");
        }

        const match = resolvedValue.match(versionRegex);
        const resolvedVersion = match?.groups?.version;

        if (
          resolvedVersion &&
          pkgContent[section][pkgName] !== resolvedVersion
        ) {
          const originalVersion = pkgContent[section][pkgName];
          changes.push({
            name: pkgName,
            from: originalVersion,
            to: resolvedVersion,
            section,
          });

          if (!dryRun) {
            pkgContent[section][pkgName] = resolvedVersion;
          }
          updatedCount++;

          if (!silent) {
            const prefix = dryRun ? colors.dim("[dry-run]") : "";
            console.log(
              `${prefix} ${colors.green("✓")} ${pkgName}: ${colors.dim(
                originalVersion
              )} → ${colors.green(resolvedVersion)}`
            );
          }
        }
      } catch (error) {
        // Package might be a git dependency, workspace, or alias - skip it
        if (!silent) {
          console.log(colors.yellow(`⚠ Skipped ${pkgName}: ${error.message}`));
        }
      }
    }
  }

  if (updatedCount === 0) {
    if (!silent) {
      console.log(colors.green("✨ All versions are already in sync!"));
    }
    return;
  }

  if (!dryRun) {
    await fs.writeFile(pkgPath, JSON.stringify(pkgContent, null, 2) + "\n");
    if (!silent) {
      console.log(
        colors.green(`\n🎉 Updated ${updatedCount} package(s) in package.json`)
      );
    }
  } else {
    if (!silent) {
      console.log(
        colors.cyan(
          `\n📋 Would update ${updatedCount} package(s) (dry-run mode)`
        )
      );
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (options.version) {
    console.log(`sync-yarn-lock v${pkg.version}`);
    process.exit(0);
  }

  try {
    await syncPackageJson({
      dryRun: options.dryRun,
      silent: options.silent,
    });
  } catch (error) {
    console.error(colors.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

main();
