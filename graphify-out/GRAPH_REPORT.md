# Graph Report - SamGent  (2026-11-16)

## Corpus Check
- 47 files · ~13,359 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .xml 9, (none) 7, .apk 2)

## Summary
- 398 nodes · 736 edges · 24 communities (14 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a18f1254`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.js
- webui/package.json
- TelemetryCollectors.kt
- compilerOptions
- MainActivity.kt
- Prefs
- Design System Master File
- compilerOptions
- .run
- SamGent
- .oxlintrc.json
- SamGent Android app
- React + TypeScript + Vite
- tsconfig.json
- WifiReceiver.kt
- Export APK after every change
- IntervalConfig.kt
- SmsReceiver.kt
- dependencies

## God Nodes (most connected - your core abstractions)
1. `Prefs` - 20 edges
2. `Button()` - 19 edges
3. `compilerOptions` - 19 edges
4. `Card()` - 16 edges
5. `CardHeader()` - 16 edges
6. `CardTitle()` - 16 edges
7. `CardContent()` - 16 edges
8. `TelemetryCollectors` - 15 edges
9. `DevicesPage()` - 15 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `ApiClient` --references--> `Prefs`  [EXTRACTED]
  android-app/app/src/main/java/com/samgent/app/ApiClient.kt → android-app/app/src/main/java/com/samgent/app/Prefs.kt
- `MainActivity` --references--> `Prefs`  [EXTRACTED]
  android-app/app/src/main/java/com/samgent/app/MainActivity.kt → android-app/app/src/main/java/com/samgent/app/Prefs.kt
- `onSubmit()` --calls--> `setToken()`  [EXTRACTED]
  webui/src/pages/login.tsx → webui/src/lib/api.ts
- `requireDevice()` --calls--> `verifyPassword()`  [EXTRACTED]
  api/src/index.js → api/src/auth.js
- `applyIntervalPut()` --calls--> `parseIntervalBody()`  [EXTRACTED]
  api/src/index.js → api/src/db.js

## Import Cycles
- None detected.

## Communities (24 total, 10 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.11
Nodes (49): react, react-router-dom, App(), RequireAuth(), Layout(), links, Button(), buttonVariants (+41 more)

### Community 1 - "index.js"
Cohesion: 0.07
Nodes (37): allowScripts, better-sqlite3@11.10.0, name, private, scripts, dev, start, test (+29 more)

### Community 2 - "webui/package.json"
Cohesion: 0.05
Nodes (38): class-variance-authority, clsx, lucide-react, react-dom, tailwind-merge, tailwindcss, @tailwindcss/vite, @types/node (+30 more)

### Community 4 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 7 - "Design System Master File"
Cohesion: 0.12
Nodes (16): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+8 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - ".run"
Cohesion: 0.21
Nodes (4): SyncEngine, Sim, TelemetryCollectors, WifiInfo

### Community 10 - "SamGent"
Cohesion: 0.29
Nodes (6): Android, Consent, Folders, Local API without Docker, Quick start (API + WebUI), SamGent

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "SamGent Android app"
Cohesion: 0.40
Nodes (4): Flow, Open in Android Studio, SamGent Android app, Server URL

### Community 13 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 19 - "WifiReceiver.kt"
Cohesion: 0.13
Nodes (3): SyncWorker, WifiEventWorker, WifiReceiver

### Community 20 - "Export APK after every change"
Cohesion: 0.29
Nodes (6): Destination, Export APK after every change, Git workflow (required), How, Rules, SamGent agent rules

### Community 23 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, bcryptjs, better-sqlite3, fastify, @fastify/cors, @fastify/jwt

## Knowledge Gaps
- **5 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 171 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `webui/package.json`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Prefs` (e.g. with `.onReceive()` and `.onReceive()`) actually correct?**
  _`Prefs` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10571184995737426 - nodes in this community are weakly interconnected._
- **Why does `Prefs` connect `Prefs` to `.run`, `WifiReceiver.kt`, `MainActivity.kt`, `SmsReceiver.kt`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0673758865248227 - nodes in this community are weakly interconnected._
- **Should `webui/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05121951219512195 - nodes in this community are weakly interconnected._