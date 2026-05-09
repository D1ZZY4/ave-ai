# Flow Ave AI — Full Implementation Blueprint

This project is a mobile‑first AI agent interface for Ollama, based on a comprehensive architecture documented in 18 flow files (`flow-1.md` through `flow-18.md`) and a detailed folder structure (`project-structure.md`). All files are located in the `planning/` folder.

**Your task as Replit Agent:** implement the entire system by reading and following these files in order. Start with the core architecture, then build out each module. Each file contains Mermaid diagrams and detailed English explanations that serve as the exact blueprint.

---

## Implementation Order

### Step 0: Read the project structure
1. Open `planning/project-structure.md`.
2. Create the exact monorepo layout shown in the diagram, including all folders and files mentioned.
3. Initialize the pnpm workspace, TypeScript configs, and Vite app.

### Step 1: Core Architecture
1. Open `planning/flow-1.md`.
2. Implement **diagrams 1–15**: Project root structure, agents top-level structure, frontend structure, macro architecture & data flow, main execution loop with three validation gates (PII, injection, toxicity), state machine for Fast vs Expert mode, rules engine evaluation flow, control hierarchy & ThinkingBox rendering, folder overviews for personas/rules/skills/tools/web/helpers, and complete end-to-end system flow.

### Step 2: Personas & Rules
1. Open `planning/flow-2.md`.
2. Create every file shown in the `agents/personas/` folder (8 persona files + barrel export).
3. Create every file shown in the `agents/rules/` folder (12 rule files + barrel export).
4. Follow the per‑file diagrams exactly for each file.

### Step 3: Skills & Tools
1. Open `planning/flow-3.md`.
2. Implement all 14 skill files in `agents/skills/` (auto-skills, codex, mermaid-diagram, prd, python-code-style, seo, summarize, tdd, telegram-bot-builder, ui-ux-designer, web-app-testing, web-performance, web-quality, barrel).
3. Implement all 8 tool files in `agents/tools/` (calculator, count, current-time, if-web-enabled-or-disabled, pdf, read-file, write-file, barrel).

### Step 4: Web Tools (Part 1)
1. Open `planning/flow-4.md`.
2. Implement the first 16 web tool files in `agents/web/`: web-api-caller, web-authenticator, web-browser, web-cache-reader, web-crawling, web-diff, web-downloader, web-feed-parser, web-fetcher, web-form-submitter, web-harvester, web-headless-scraper, web-link-extractor, web-metadata-extractor, web-monitor, and the barrel file.

### Step 5: Web Tools (Part 2)
1. Open `planning/flow-5.md`.
2. Implement the remaining 15 web tools: web-navigator, web-paginator, web-parser, web-qrcode-reader, web-reader, web-robots-txt, web-scraping, web-screenshot, web-search, web-sitemap-parser, web-socket-listener, web-spider, web-summarizer, web-validator, web-video-extractor.
3. Complete the barrel export file.

### Step 6: Helpers
1. Open `planning/flow-6.md`.
2. Create all 16 helper utilities in `frontend/src/helpers/`: cache.ts, compression.ts, healthCheck.ts, injectionDetector.ts, ollama.ts, parse-choose-option-to-ui.ts, parse-diagram-to-ui.ts, parse-response-to-ui.ts, parse-selection-to-ui.ts, piiDetector.ts, rateLimit.ts, sanitizer.ts, storage.ts, thinking.ts, tokenizer.ts, toxicityAnalyzer.ts.

### Step 7: Core Systems & UI Interactions
1. Open `planning/flow-7.md`.
2. Implement: deployment & communication setup, app initialization with dynamic registry, optimized agent memory, prompt template structure (with model adaptation), TypeScript core type definitions, concurrency & abort controller, security hardening (CSP & XSS prevention), offline detection & queue (PWA), service worker & PWA manifest, settings flow (load, edit, save, test connection), conversation management (new, switch, delete), chat history storage & retrieval, settings toggles, model selection, cancel/stop response, copy message, retry message, edit & resend message, Qwen3 thinking & vision integration.

### Step 8: Advanced Features
1. Open `planning/flow-8.md`.
2. Implement: model loading & warm‑up, graceful shutdown & cleanup, voice & image input, token usage display, search in chat history, export conversation (JSON/Markdown/PDF), keyboard shortcuts, dark mode / theme switch, notifications (sound/vibrate), system prompt customization, Ollama health check & reconnect, max output token control, Skills.sh integration (skill discovery + hybrid registry), memory system (folder structure, fact extraction flow, prompt injection).

### Step 9: State, Hooks, Components & API Integration
1. Open `planning/flow-9.md`.
2. Build: Zustand chat store (`store/chat.tsx`), Zustand settings store (`store/settings.tsx`), `hooks/useChat.ts` (primary chat hook with full internal flow), `hooks/useThinking.ts` (thinking step selector), `hooks/useModels.ts` (model management), `hooks/use-mobile.tsx` & `hooks/use-toast.ts`, full component tree hierarchy, `ChatInput.tsx` (component behavior), `MessageBubble.tsx` (rendering & actions), `ThinkingBox.tsx` (typewriter animation + spinner), `Sidebar.tsx` (conversation list), `SettingsModal.tsx` (tabbed structure), auto‑generated fetch client (`lib/api-client-react/`), optional backend server, optional database schema, complete Zustand store shape, and `useChat` full internal flow.

### Step 10: Testing, Build, Dependencies & Roadmap
1. Open `planning/flow-10.md`.
2. Configure: testing strategy (Vitest + Testing Library + Playwright), environment variables, scripts & build pipeline, monorepo layout, package.json dependencies, CSS / styling architecture (Tailwind CSS + shadcn/ui), internationalization (i18n) preparation, telemetry (optional, off by default), roadmap & extensibility points, complete file tree.

### Step 11: UI Components Detail
1. Open `planning/flow-11.md`.
2. Implement: `ActivityLog.tsx` (real‑time process log with expandable entries), `ChoiceCards.tsx` (clickable option buttons with animations), `Header.tsx` (mode toggle, token bar, persona/model selectors), `QuestionForm.tsx` (text + image + voice input), `HistoryModal.tsx` (browse, search, export, delete conversations), `SkillsModal.tsx` (installed + remote Skills.sh tabs), `ToolsModal.tsx` (tool inspector with rate limits), `WebModal.tsx` (web tool manager with global/per‑tool toggles).

### Step 12: Memory Folder
1. Open `planning/flow-12.md`.
2. Implement the five files inside `agents/memory/`: `index.ts` (barrel export), `types.ts` (MemoryFact interface), `store.ts` (IndexedDB CRUD operations), `extractor.ts` (LLM‑based fact extraction from assistant responses), `retriever.ts` (load facts and format for prompt injection).

### Step 13: Replit‑Style Thinking Flow & AI Storage
1. Open `planning/flow-13.md`.
2. Implement: step‑by‑step thought → action → observation streaming (Replit‑style), AI agent storage architecture (workspace/, uploads/, cache/, data/ folders with access rules), file upload & AI processing flow, storage folder lifecycle (create, clean, archive), tool access control matrix.

### Step 14: System Hardening & Edge Cases
1. Open `planning/flow-14.md`.
2. Implement: graceful degradation on connection loss, malicious input handling (sanitization → injection → PII → toxicity), LLM response anomaly handling (malformed JSON repair), rate limiting & resource protection, token budget overflow protection, abort controller cleanup on navigation, concurrent tool execution safety, security headers & CSP for backend proxy, error boundary & crash recovery, sensitive data redaction on export.

### Step 15: Multi‑Modal & Model Management
1. Open `planning/flow-15.md`.
2. Implement: visual input pipeline (image → base64 → multimodal prompt), voice input pipeline (MediaRecorder → Whisper/SpeechRecognition), multi‑modal output rendering (text, code, mermaid diagrams, images, tables, JSON), model switching & warm‑up, model download & pull progress, model capability detection (Qwen, Llama, Mistral, DeepSeek), multi‑modal integration summary.

### Step 16: Parallel Task Execution & Archive Tools
1. Open `planning/flow-16.md`.
2. Implement: parallel task execution architecture (task analyzer → parallel pool / sequential queue), parallel task worker pool, task decomposition logic (DAG + topological sort), archive tools (`agents/tools/archive.ts` — extract/compress ZIP, TAR, GZ, 7Z, RAR), archive format support matrix, archive processing flow, rules update for archive tools.

### Step 17: Statistics Dashboard & Analytics
1. Open `planning/flow-17.md`.
2. Implement: `StatisticsModal.tsx` with 6 tabs (Overview, Tokens, Tools, Skills, Conversations, Performance), data sources & tracking architecture, automatic metrics collection (messages, tools, tokens, time, errors), chart visualizations, export as JSON/CSV, integration with Header and Sidebar.

### Step 18: Agent Feedback & Behavior Adaptation
1. Open `planning/flow-18.md`.
2. Implement: feedback collection UI (thumbs‑up/down in MessageBubble with reason dialog), feedback storage & aggregation (by persona, tool, mode, time), feedback‑driven rule adjustment (auto‑tweak tone, suggest mode/tool changes), feedback‑driven memory updates (boost/reduce fact confidence), end‑to‑end feedback loop, Feedback tab in StatisticsModal.

---

## Important Notes

- **Each Mermaid diagram is the exact specification** — implement the flow/states exactly as drawn.
- **TypeScript interfaces** are defined in `flow-7.md` (diagram 5); reuse them everywhere.
- **Zustand store shapes** are in `flow-9.md` (diagrams 1 & 2).
- **Ollama client** is described in `flow-6.md` (diagram 6) — use that helper for all API calls.
- **The main execution loop** with three validation gates is in `flow-1.md` (diagram 5).
- **The Replit‑style thinking box behavior** is described in `flow-13.md` (diagram 1) and `flow-9.md` (diagram 10).
- **Do not skip any diagram** — each one contributes a piece of the final system.
- After implementing a file, tell me which file you completed so I can guide you to the next one.
- **All files are located in the `planning/` folder.** Start by listing and reading them.

---

**Start by reading `planning/project-structure.md` and `planning/flow-1.md`, then implement.**