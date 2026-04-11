import { GlobalWindow } from "happy-dom";

const isBun = typeof (globalThis as any).Bun !== "undefined";

if (isBun) {
  // Bun doesn't transform CSS imports, so we register a no-op plugin.
  // Under Node.js, vitest.config.ts `css: false` handles this instead.
  const { plugin } = (globalThis as any).Bun;
  plugin({
    name: "css-noop",
    setup(build:any) {
      build.onLoad({ filter: /\.css$/ }, () => ({
        contents: "",
        loader: "js",
      }));
    },
  });

  // Polyfill DOM globals (document, window, etc.) for tests that use createRoot.
  // Under Node.js, Vitest applies `environment: "happy-dom"` automatically.
  // Under Bun that doesn't happen, so we do it once centrally here.
  const win = new GlobalWindow() as any;
  const g = globalThis as any;
  if (!g.document) {
    Object.getOwnPropertyNames(win).forEach((key) => {
      try { if (!(key in g)) g[key] = win[key]; } catch {}
    });
  }
}

// Required for React act() to work correctly in tests
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
