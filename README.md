# English Adventure · A2 → B1

A static, expandable PWA for 30-minute daily English learning. Course content is data-driven and organized as one JSON package per week, following the user's Russian PWA extension pattern.

## Current delivery
- PWA shell, responsive learning path, week/day navigation.
- Week 1 course package with seven lessons and integrated vocabulary, listening, speaking, reading, writing and quizzes.
- `courses/catalog.json` generated from `courses/weekN-course.json` by `scripts/build.mjs`.
- Local progress, XP, streak and JSON export.
- Optional DeepSeek AI module with user-entered API Key saved in this browser.
- AI context builder, task-specific prompts and response validation.
- GitHub Pages Actions workflow and basic course tests.

## Add a week
1. Add `courses/week2-course.json` (or the next unused week number).
2. Keep exactly seven lessons per week. Use globally unique lesson IDs and quiz IDs.
3. Run `node --test tests/*.test.cjs` and `node scripts/build.mjs`.
4. Commit the new weekly JSON. GitHub Actions regenerates `courses/catalog.json` in the published artifact.

The weekly pack schema is documented in `docs/COURSE_FORMAT.md`.

## Run locally
Use Node.js 22 or newer:

```bash
node --test tests/*.test.cjs
node scripts/build.mjs
npx serve site
```

Do not open `index.html` via `file://`; use a local HTTP server.

## Deploy
Create a dedicated GitHub repository for this PWA, push the project to its `main` branch, then set GitHub Pages source to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` builds and deploys `site/`.

## DeepSeek API Key handling
- No developer key is included.
- The user enters their own key in Settings.
- Save on this device stores the key and model in this browser’s localStorage. Clear API Key removes them.
- It is never written to LocalStorage, IndexedDB, cache, or course files.
- Requests go from the browser to DeepSeek's official API endpoint. Browser CORS support must be verified on the deployed origin; if direct browser requests are blocked, add a stateless relay that does not persist or log the Authorization header.
- Any context enabled by the user is sent to DeepSeek. The context preview lets the user inspect the payload before use.

## Important limitation of this first scaffold
Week 1 is populated. Weeks 2–12 are intentionally not fabricated as empty or repetitive lessons; they will be added as independent weekly packages and validated before release. Speech recognition/pronunciation scoring is not included yet.
