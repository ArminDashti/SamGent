# Graph Report - SamGent  (2026-11-17)

## Corpus Check
- 58 files · ~15,951 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .xml 9, (none) 7, .apk 2)

## Summary
- 440 nodes · 882 edges · 22 communities (14 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e7fbe699`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.js
- webui/package.json
- TelemetryCollectors.kt
- compilerOptions
- App.tsx
- Prefs
- Design System Master File
- compilerOptions
- SamGent
- .oxlintrc.json
- SamGent Android app
- React + TypeScript + Vite
- tsconfig.json
- WifiMonitor.kt
- Export APK after every change
- IntervalConfig.kt
- SmsReceiver.kt

## God Nodes (most connected - your core abstractions)
1. `Prefs` - 20 edges
2. `Button()` - 19 edges
3. `compilerOptions` - 19 edges
4. `react` - 18 edges
5. `cn()` - 18 edges
6. `Input()` - 16 edges
7. `DevicesPage()` - 16 edges
8. `TelemetryCollectors` - 15 edges
9. `compilerOptions` - 15 edges
10. `App()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `RequireAuth()` --calls--> `getToken()`  [EXTRACTED]
  webui/src/App.tsx → webui/src/lib/api.ts
- `App()` --calls--> `DevicesPage()`  [EXTRACTED]
  webui/src/App.tsx → webui/src/pages/devices.tsx
- `App()` --calls--> `EntitiesPage()`  [EXTRACTED]
  webui/src/App.tsx → webui/src/pages/entities.tsx
- `App()` --calls--> `LoginPage()`  [EXTRACTED]
  webui/src/App.tsx → webui/src/pages/login.tsx
- `App()` --calls--> `SearchPage()`  [EXTRACTED]
  webui/src/App.tsx → webui/src/pages/search.tsx

## Import Cycles
- None detected.

## Communities (22 total, 8 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.12
Nodes (36): lucide-react, react, AppShell(), signOut(), mainLinks, SidebarNav(), SidebarNavProps, Button() (+28 more)

### Community 1 - "index.js"
Cohesion: 0.06
Nodes (43): allowScripts, better-sqlite3@11.10.0, dependencies, bcryptjs, better-sqlite3, fastify, @fastify/cors, @fastify/jwt (+35 more)

### Community 2 - "webui/package.json"
Cohesion: 0.05
Nodes (36): class-variance-authority, clsx, tailwind-merge, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom (+28 more)

### Community 3 - "TelemetryCollectors.kt"
Cohesion: 0.08
Nodes (5): Collectors, SyncEngine, Sim, TelemetryCollectors, WifiInfo

### Community 4 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (35): react-dom, react-router-dom, App(), RequireAuth(), DataTable(), DataTableColumn, DataTableProps, PageHeader() (+27 more)

### Community 6 - "Prefs"
Cohesion: 0.06
Nodes (6): ApiClient, BootReceiver, MainActivity, Prefs, SamGentApp, SyncWorker

### Community 7 - "Design System Master File"
Cohesion: 0.12
Nodes (16): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+8 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

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

### Community 20 - "Export APK after every change"
Cohesion: 0.29
Nodes (6): Destination, Export APK after every change, Git workflow (required), How, Rules, SamGent agent rules

## Knowledge Gaps
- **5 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 185 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `webui/package.json`, `App.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Prefs` (e.g. with `.onReceive()` and `.onReceive()`) actually correct?**
  _`Prefs` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12159329140461216 - nodes in this community are weakly interconnected._
- **Why does `Prefs` connect `Prefs` to `WifiMonitor.kt`, `TelemetryCollectors.kt`, `SmsReceiver.kt`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05589225589225589 - nodes in this community are weakly interconnected._
- **Why does `react-router-dom` connect `App.tsx` to `App.tsx`, `webui/package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._