import { readFileSync, existsSync, writeFileSync, mkdirSync, watch, readdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

const DIST_DIR = join(import.meta.dir, "dist");

let bundleHash = "";

// Ensure data directory exists
const dataDir = join(import.meta.dir, "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Build client bundle
if (!existsSync(DIST_DIR)) {
  mkdirSync(DIST_DIR, { recursive: true });
}

async function buildClient() {
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, "src", "index.tsx")],
    outdir: DIST_DIR,
    minify: false,
    target: "browser",
  });
  if (!result.success) {
    console.error("Build failed:", result.logs);
  } else {
    bundleHash = createHash("md5")
      .update(readFileSync(join(DIST_DIR, "index.js")))
      .digest("hex")
      .slice(0, 8);
    console.log(`Client bundle built. (hash: ${bundleHash})`);
  }
  return result.success;
}

console.log("Building client bundle...");
if (!await buildClient()) process.exit(1);

// SSE clients waiting for reload signal
const reloadClients = new Set<ReadableStreamDefaultController>();



function notifyReload() {
  for (const ctrl of reloadClients) {
    try { ctrl.enqueue("data: reload\n\n"); } catch { reloadClients.delete(ctrl); }
  }
}

// Watch src/ and styles.css for changes
let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRebuild() {
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(async () => {
    console.log("Change detected, rebuilding...");
    await buildClient();
    notifyReload();
  }, 100);
}

watch(join(import.meta.dir, "src"), { recursive: true }, scheduleRebuild);

function statsFile(dataset: string) {
  return join(import.meta.dir, "data", `stats-${dataset}.json`);
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
  <script type="module" src="/bundle.js?v=${bundleHash}"></script>
  <script>
    const es = new EventSource('/api/dev-reload');
    es.onmessage = () => location.reload();
  </script>
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
      const files = readdirSync(join(import.meta.dir, "resources"))
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
      const csvPath = join(import.meta.dir, "resources", dataset);
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
