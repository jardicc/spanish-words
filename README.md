# Spanish Words

A browser-based flashcard app for learning Spanish vocabulary. It quizzes you on the top 1000 most common Spanish words using multiple quiz strategies, tracks your progress per word, and prioritizes words you struggle with.

## What it does

- **Three quiz modes:**
  - *Španělsky → Česky* — given a Spanish word, pick the Czech translation
  - *Česky → Španělsky* — given a Czech translation, pick the Spanish word
  - *Členy* — given a noun, pick the correct article (`el` / `la`)
- **Smart word selection** — words you get wrong appear more often; mastered words (≥3 attempts, ≥99.9% correct) are retired
- **Persistent stats** — answers are saved to `data/stats.json` via a REST API and survive server restarts
- **Error log** — wrong answers accumulate in the top half of the screen for review during the session
- **Keyboard support** — press `1`–`6` to select answers without touching the mouse

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.com) |
| Frontend | React 19 + TypeScript |
| Bundler | `Bun.build()` |
| Server | Custom Bun HTTP server (`server.ts`) |
| Styling | Component-scoped CSS files |
| Tests | Vitest + `react-dom/server` |

## Project structure

```
src/
  index.tsx              # React entry point
  App.tsx                # Root component + state management
  App.css                # Layout styles
  types.ts               # Shared TypeScript interfaces
  strategies.ts          # Quiz strategy implementations
  csv.ts                 # CSV parser
  stats-client.ts        # API client for stats (load / save / reset)
  levenshtein.ts         # Used for generating plausible wrong answers
  styles/
    base.css             # Global reset and body styles
  components/
    ProgressBar.tsx      # Mastered/attempted word counts + fill bar
    StrategySelector.tsx # Strategy toggle buttons
    Feedback.tsx         # Single wrong-answer log entry
    QuizCard.tsx         # Quiz prompt + answer buttons
    ScoreDisplay.tsx     # Session correct/incorrect counts and rate
    ConfirmDialog.tsx    # Reset stats confirmation overlay
resources/
  top1000.csv            # Vocabulary data (rank, article, word, EN, CZ, part of speech)
data/
  stats.json             # Persisted per-word stats (auto-created)
test/
  *.test.tsx             # Integration tests for each component and strategy logic
server.ts                # HTTP server: serves HTML, bundle, stats API, live reload
vitest.config.ts         # Vitest configuration
wallaby.js               # Wallaby configuration (autoDetect)
```

## How it works

1. On startup, `server.ts` builds the React bundle via `Bun.build()` and computes an MD5 hash of the output for cache-busting.
2. The server inlines the compiled CSS directly into the HTML response — no external stylesheet requests.
3. The browser loads the bundle, fetches `/api/words` (the raw CSV) and `/api/stats`, then generates the first quiz question.
4. Each answered question POSTs to `/api/stats`; the server updates the in-memory stats object and flushes it to `data/stats.json`.
5. During development (`bun run dev`), `fs.watch` monitors `src/` for changes, rebuilds on save with a 100 ms debounce, and notifies the browser via a Server-Sent Events endpoint (`/api/dev-reload`) which triggers an automatic page reload.

## Getting started

```bash
bun install
```

**Development** (with live reload):
```bash
bun run dev
```

**Production:**
```bash
bun run start
```

Open [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
bunx vitest run        # single run
bunx vitest            # watch mode
```

Tests use `react-dom/server` (`renderToStaticMarkup`) to render components to HTML and assert on their structure and content without a DOM or browser.
