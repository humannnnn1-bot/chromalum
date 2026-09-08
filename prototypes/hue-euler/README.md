# Hue Euler lab

Independent prototype for hue-constrained Euler tours. It imports the existing color and geometry data, with its UI, styles, routes, and playback state contained in this directory.

Open `http://127.0.0.1:5173/chromalum/prototypes/hue-euler/` while the current Theory development server is running. If it is not running, use `npm run dev:theory` from the repository root and open that URL.

The octahedron traverses its 12 edges in two forward hue laps. The distance-1-plus-2 graph uses a verified 24-edge tour with adjacent hues and direction reversals. Edge keys, colors, distances, and animation direction are derived from the vertex sequences in `model.ts`.

This page is not imported by the app or added to the production Vite entrypoints. Playback does not write application storage. The Theory link opens the existing development page in a separate tab.

Run checks from the repository root:

```powershell
npx tsc --noEmit -p prototypes/hue-euler/tsconfig.json
npx vitest run prototypes/hue-euler/model.test.ts
npx playwright test -c prototypes/hue-euler/playwright.config.ts --workers=1
```

The prototype's browser checks use a separate test configuration. `browser.check.ts` deliberately does not use the `.test.ts` or `.spec.ts` suffix, so the application's Vitest command does not execute Playwright tests.
