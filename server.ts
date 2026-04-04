import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const STATS_FILE = join(import.meta.dir, "data", "stats.json");
const CSV_FILE = join(import.meta.dir, "resources", "top1000.csv");
const DIST_DIR = join(import.meta.dir, "dist");

// Ensure data directory exists
const dataDir = join(import.meta.dir, "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Build client bundle
if (!existsSync(DIST_DIR)) {
  mkdirSync(DIST_DIR, { recursive: true });
}

console.log("Building client bundle...");
const buildResult = await Bun.build({
  entrypoints: [join(import.meta.dir, "src", "index.tsx")],
  outdir: DIST_DIR,
  minify: false,
  target: "browser",
});

if (!buildResult.success) {
  console.error("Build failed:", buildResult.logs);
  process.exit(1);
}
console.log("Client bundle built successfully.");

function loadStatsFromDisk(): Record<string, { correct: number; incorrect: number }> {
  if (!existsSync(STATS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveStatsToDisk(stats: Record<string, { correct: number; incorrect: number }>) {
  writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
}

let stats = loadStatsFromDisk();

const indexHTML = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Španělská slovíčka</title>
  <style>${readFileSync(join(import.meta.dir, "styles.css"), "utf-8")}</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/bundle.js"></script>
</body>
</html>`;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // API: Get stats
    if (url.pathname === "/api/stats" && req.method === "GET") {
      return Response.json(stats);
    }

    // API: Save answer
    if (url.pathname === "/api/stats" && req.method === "POST") {
      const body = await req.json() as { wordKey: string; correct: boolean };
      const { wordKey, correct } = body;

      if (typeof wordKey !== "string" || typeof correct !== "boolean") {
        return new Response("Bad request", { status: 400 });
      }

      if (!stats[wordKey]) {
        stats[wordKey] = { correct: 0, incorrect: 0 };
      }

      if (correct) {
        stats[wordKey].correct++;
      } else {
        stats[wordKey].incorrect++;
      }

      saveStatsToDisk(stats);
      return Response.json(stats);
    }

    // API: Get CSV words
    if (url.pathname === "/api/words") {
      const csv = readFileSync(CSV_FILE, "utf-8");
      return new Response(csv, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Serve bundle
    if (url.pathname === "/bundle.js") {
      const file = Bun.file(join(DIST_DIR, "index.js"));
      return new Response(file, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // SPA fallback
    return new Response(indexHTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`🇪🇸 Španělská slovíčka běží na http://localhost:${server.port}`);
