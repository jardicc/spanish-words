/**
 * Full release build:
 *   1. Cleans and recreates release/
 *   2. Builds the client bundle (minified) → release/dist/
 *   3. Copies resources/ (CSV word lists) → release/resources/
 *   4. Compiles server.ts → release/spanish-words.exe
 *
 * Run with: bun run release
 */

import { existsSync, mkdirSync, rmSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";

const root = join(import.meta.dir, "..");
const releaseDir = join(root, "release");

// ── 1. Clean release/ ────────────────────────────────────────────────────────
if (existsSync(releaseDir)) {
  rmSync(releaseDir, { recursive: true, force: true });
}
mkdirSync(join(releaseDir, "dist"), { recursive: true });
mkdirSync(join(releaseDir, "resources"), { recursive: true });

// ── 2. Build client bundle ───────────────────────────────────────────────────
console.log("⚙️  Building client bundle...");
const buildResult = await Bun.build({
  entrypoints: [join(root, "src", "index.tsx")],
  outdir: join(releaseDir, "dist"),
  minify: true,
  target: "browser",
});

if (!buildResult.success) {
  console.error("Client build failed:", buildResult.logs);
  process.exit(1);
}
console.log("✅ Client bundle built.");

// ── 3. Copy resources/ ───────────────────────────────────────────────────────
console.log("📂 Copying resources...");
const resourcesSrc = join(root, "resources");
for (const file of readdirSync(resourcesSrc)) {
  copyFileSync(join(resourcesSrc, file), join(releaseDir, "resources", file));
}
console.log("✅ Resources copied.");

// ── 4. Compile server.ts → exe ───────────────────────────────────────────────
console.log("🔨 Compiling server binary...");
const exeResult = Bun.spawnSync([
  "bun", "build", "--compile",
  join(root, "server.ts"),
  "--outfile", join(releaseDir, "spanish-words"),
], { cwd: root, stdio: ["inherit", "inherit", "inherit"] });

if (exeResult.exitCode !== 0) {
  console.error("Compilation failed.");
  process.exit(exeResult.exitCode ?? 1);
}

console.log(`
🎉 Release ready → release/
   ├── spanish-words.exe
   ├── dist/
   └── resources/
`);
