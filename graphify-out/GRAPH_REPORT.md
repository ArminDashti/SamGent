# Graph Report - SamGent  (2026-11-11)

## Corpus Check
- 40 files · ~9,337 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .xml 9, (none) 7, .properties 2)

## Summary
- 292 nodes · 494 edges · 19 communities (13 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4bae93c1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.js
- webui/package.json
- Collectors.kt
- compilerOptions
- MainActivity.kt
- dependencies
- Design System Master File
- compilerOptions
- devDependencies
- SamGent
- .oxlintrc.json
- SamGent Android app
- React + TypeScript + Vite
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 19 edges
2. `Button()` - 17 edges
3. `compilerOptions` - 15 edges
4. `Card()` - 14 edges
5. `CardHeader()` - 14 edges
6. `CardTitle()` - 14 edges
7. `CardContent()` - 14 edges
8. `Input()` - 14 edges
9. `DevicesPage()` - 13 edges
10. `react` - 12 edges

## Surprising Connections (you probably didn't know these)
- `MainActivity` --references--> `Prefs`  [EXTRACTED]
  android-app/app/src/main/java/com/samgent/app/MainActivity.kt → android-app/app/src/main/java/com/samgent/app/Prefs.kt
- `onSubmit()` --calls--> `setToken()`  [EXTRACTED]
  webui/src/pages/login.tsx → webui/src/lib/api.ts
- `ApiClient` --references--> `Prefs`  [EXTRACTED]
  android-app/app/src/main/java/com/samgent/app/ApiClient.kt → android-app/app/src/main/java/com/samgent/app/Prefs.kt
- `requireDevice()` --calls--> `verifyPassword()`  [EXTRACTED]
  api/src/index.js → api/src/auth.js
- `RequireAuth()` --calls--> `getToken()`  [EXTRACTED]
  webui/src/App.tsx → webui/src/lib/api.ts

## Import Cycles
- None detected.

## Communities (19 total, 6 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.14
Nodes (41): lucide-react, react, App(), RequireAuth(), Layout(), links, Button(), buttonVariants (+33 more)

### Community 1 - "index.js"
Cohesion: 0.08
Nodes (27): allowScripts, better-sqlite3@11.10.0, name, private, scripts, dev, start, test (+19 more)

### Community 2 - "webui/package.json"
Cohesion: 0.06
Nodes (29): class-variance-authority, clsx, react-dom, react-router-dom, tailwind-merge, tailwindcss, @tailwindcss/vite, @types/node (+21 more)

### Community 3 - "Collectors.kt"
Cohesion: 0.07
Nodes (5): ApiClient, Collectors, Prefs, SmsReceiver, SyncWorker

### Community 4 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 6 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, bcryptjs, better-sqlite3, fastify, @fastify/cors, @fastify/jwt

### Community 7 - "Design System Master File"
Cohesion: 0.12
Nodes (16): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+8 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+1 more)

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

## Knowledge Gaps
- **5 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 151 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `webui/package.json`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13804713804713806 - nodes in this community are weakly interconnected._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07657657657657657 - nodes in this community are weakly interconnected._
- **Should `webui/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06386554621848739 - nodes in this community are weakly interconnected._
- **Should `Collectors.kt` be split into smaller, more focused modules?**
  _Cohesion score 0.06533776301218161 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._