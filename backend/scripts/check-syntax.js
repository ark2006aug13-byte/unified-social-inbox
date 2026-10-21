import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const backendRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceRoots = ["src"];
const failures = [];

function collectFiles(directory) {
  const entries = readdirSync(directory);

  for (const entry of entries) {
    const fullPath = join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      collectFiles(fullPath);
      continue;
    }

    if (entry.endsWith(".js")) {
      files.push(fullPath);
    }
  }
}

const files = [];

for (const root of sourceRoots) {
  collectFiles(join(backendRoot, root));
}

files.push(join(backendRoot, "server.js"));

for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failures.push({ file, message: error.stderr?.toString() || String(error) });
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`\n✗ ${failure.file}\n${failure.message}`);
  }

  console.error(`\n${failures.length} file(s) failed to parse.`);
  process.exit(1);
}

console.log(`✓ ${files.length} backend source files parsed successfully.`);
