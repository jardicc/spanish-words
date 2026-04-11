import { readFileSync, existsSync, writeFileSync, mkdirSync, watch, readdirSync } from "fs";
import { join, dirname } from "path";
import {createHash} from "crypto";

const exePath = process.execPath;
console.log(`Executable path: ${exePath}`);

// On Windows, Bun compiled executables have import.meta.dir like "B:\~BUN\root"
// On Linux/Mac it starts with "/$bunfs/"
const DEV = !import.meta.dir.startsWith("/$bunfs/") && !import.meta.dir.includes("~BUN");
const BASE_DIR = DEV ? import.meta.dir : dirname(exePath);

// Keep the console window open on any unhandled crash in compiled mode.
if (!DEV) {
  process.on("uncaughtException", (err) => {
    console.error("\nNEOČEKÁVANÁ CHYBA:", err.message);
    console.error(err.stack ?? "");
    console.error("\nStiskni Enter pro zavření okna...");
    const buf = Buffer.alloc(1);
    try { require("fs").readSync(0, buf, 0, 1, null); } catch {}
    process.exit(1);
  });
}

const DIST_DIR = join(BASE_DIR, "dist");

let bundleHash = "";

// Ensure data directory exists
const dataDir = join(BASE_DIR, "data");
if (!existsSync(dataDir)) {
  console.log(`📁 Vytvářím "${dataDir}" pro ukládání statistik...`);
  mkdirSync(dataDir, { recursive: true });
}

/** In compiled mode, show an error and wait for Enter before exiting so the window doesn't vanish. */
function fatalError(message: string): never {
  console.error(`\nERROR: ${message}`);
  if (!DEV) {
    console.error("\nStiskni Enter pro zavření okna...");
    const buf = Buffer.alloc(1);
    try { require("fs").readSync(0, buf, 0, 1, null); } catch {}
  }
  process.exit(1);
}

function computeBundleHash() {
  const bundlePath = join(DIST_DIR, "index.js");
  if (!existsSync(bundlePath)) return "";
  return createHash("md5").update(readFileSync(bundlePath)).digest("hex").slice(0, 8);
}

if (DEV) {
  // Dev mode: build client bundle from source and watch for changes
  if (!existsSync(DIST_DIR)) {
    console.log(`📁 Vytvářím "${DIST_DIR}" pro vývojový build...`);
    mkdirSync(DIST_DIR, {recursive: true});
  }

  const result = await Bun.build({
    entrypoints: [join(BASE_DIR, "src", "index.tsx")],
    outdir: DIST_DIR,
    minify: false,
    target: "browser",
  });
  if (!result.success) { console.error("Build failed:", result.logs); process.exit(1); }
  bundleHash = computeBundleHash();
  console.log(`Client bundle built. (hash: ${bundleHash})`);
} else {
  // Production / compiled mode: dist/ must already exist next to the exe
  bundleHash = computeBundleHash();
  if (!bundleHash) {
    fatalError(`dist/index.js not found next to the executable.\nOčekávaná cesta: ${join(DIST_DIR, "index.js")}\nSpusť 'bun run release' pro správné sestavení distribuce.`);
  }
}

// SSE clients for dev-reload (dev mode only)
const reloadClients = new Set<ReadableStreamDefaultController>();

function notifyReload() {
  for (const ctrl of reloadClients) {
    try { ctrl.enqueue("data: reload\n\n"); } catch { reloadClients.delete(ctrl); }
  }
}

// Watch src/ for changes (dev mode only)
if (DEV) {
  let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
  watch(join(BASE_DIR, "src"), { recursive: true }, () => {
    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(async () => {
      console.log("Change detected, rebuilding...");
      const result = await Bun.build({
        entrypoints: [join(BASE_DIR, "src", "index.tsx")],
        outdir: DIST_DIR,
        minify: false,
        target: "browser",
      });
      if (result.success) {
        bundleHash = computeBundleHash();
        console.log(`Client bundle rebuilt. (hash: ${bundleHash})`);
        notifyReload();
      }
    }, 100);
  });
}

function statsFile(dataset: string) {
  return join(BASE_DIR, "data", `stats-${dataset}.json`);
}

function loadStatsFromDisk(dataset: string): Record<string, { correct: number; incorrect: number }> {
  const file = statsFile(dataset);
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return {};
  }
}

function saveStatsToDisk(dataset: string, stats: Record<string, { correct: number; incorrect: number }>) {
  writeFileSync(statsFile(dataset), JSON.stringify(stats, null, 2), "utf-8");
}

const statsCache = new Map<string, Record<string, { correct: number; incorrect: number }>>();

function getStats(dataset: string) {
  if (!statsCache.has(dataset)) {
    statsCache.set(dataset, loadStatsFromDisk(dataset));
  }
  return statsCache.get(dataset)!;
}

function getIndexHTML() {
  const devReloadScript = DEV
    ? `\n  <script>\n    const es = new EventSource('/api/dev-reload');\n    es.onmessage = () => location.reload();\n  </script>`
    : "";
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Španělská slovíčka</title>
  <style>${existsSync(join(DIST_DIR, "index.css")) ? readFileSync(join(DIST_DIR, "index.css"), "utf-8") : ""}</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/bundle.js?v=${bundleHash}"></script>${devReloadScript}
</body>
</html>`;
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Dev: SSE reload endpoint
    if (url.pathname === "/api/dev-reload") {
      let ctrl: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(c) {
          ctrl = c;
          ctrl.enqueue("retry: 1000\n\n");
          reloadClients.add(ctrl);
        },
        cancel() {
          reloadClients.delete(ctrl);
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // API: Get stats
    if (url.pathname === "/api/stats" && req.method === "GET") {
      const dataset = url.searchParams.get("dataset") ?? "top1000.csv";
      return Response.json(getStats(dataset));
    }

    // API: Reset stats
    if (url.pathname === "/api/stats" && req.method === "DELETE") {
      const dataset = url.searchParams.get("dataset") ?? "top1000.csv";
      statsCache.set(dataset, {});
      saveStatsToDisk(dataset, {});
      return Response.json({});
    }

    // API: Save answer
    if (url.pathname === "/api/stats" && req.method === "POST") {
      const body = await req.json() as { wordKey: string; correct: boolean; dataset?: string };
      const { wordKey, correct } = body;
      const dataset = body.dataset ?? "top1000.csv";

      if (typeof wordKey !== "string" || typeof correct !== "boolean") {
        return new Response("Bad request", { status: 400 });
      }

      const stats = getStats(dataset);
      if (!stats[wordKey]) {
        stats[wordKey] = { correct: 0, incorrect: 0 };
      }
      if (correct) {
        stats[wordKey].correct++;
      } else {
        stats[wordKey].incorrect++;
      }
      saveStatsToDisk(dataset, stats);
      return Response.json(stats);
    }

    // API: List available datasets
    if (url.pathname === "/api/datasets") {
      const files = readdirSync(join(BASE_DIR, "resources"))
        .filter((f) => f.endsWith(".csv"));
      return Response.json(files);
    }

    // API: Get CSV words
    if (url.pathname === "/api/words") {
      const dataset = url.searchParams.get("dataset") ?? "top1000.csv";
      // Prevent path traversal
      if (dataset.includes("/") || dataset.includes("\\") || dataset.includes("..")) {
        return new Response("Bad request", { status: 400 });
      }
      const csvPath = join(BASE_DIR, "resources", dataset);
      if (!existsSync(csvPath)) {
        return new Response("Not found", { status: 404 });
      }
      const csv = readFileSync(csvPath, "utf-8");
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
    return new Response(getIndexHTML(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`🇪🇸 Španělská slovíčka běží na http://localhost:${server.port}`);

if (!DEV) {
  // Open browser automatically in production / compiled mode
  const url = `http://localhost:${server.port}`;
  Bun.spawnSync(["cmd", "/c", "start", url], { stdio: ["ignore", "ignore", "ignore"] });
  console.log("Prohlížeč byl otevřen. Server běží — zavři toto okno pro ukončení.");
}
