│   .gitignore
│   .npmrc
│   package.json
│   pnpm-lock.yaml
│   pnpm-workspace.yaml
│   tsconfig.base.json
│   tsconfig.json
│   
├───ave-ai
│   ├───agents
│   │   ├───memory
│   │   ├───personas
│   │   │       adaptive.ts
│   │   │       casual.ts
│   │   │       creative.ts
│   │   │       default.ts
│   │   │       developer.ts
│   │   │       index.ts
│   │   │       planner.ts
│   │   │       wise.ts
│   │   │
│   │   ├───rules
│   │   │       agent.ts
│   │   │       context.ts
│   │   │       expert-mode.ts
│   │   │       fast-mode.ts
│   │   │       global.ts
│   │   │       greeting.ts
│   │   │       index.ts
│   │   │       language.ts
│   │   │       safety.ts
│   │   │       thinking.ts
│   │   │       tone.ts
│   │   │       tools.ts
│   │   │
│   │   ├───skills
│   │   │       auto-skills.ts
│   │   │       codex.ts
│   │   │       index.ts
│   │   │       mermaid-diagram.ts
│   │   │       prd.ts
│   │   │       python-code-style.ts
│   │   │       seo.ts
│   │   │       summarize.ts
│   │   │       tdd.ts
│   │   │       telegram-bot-builder.ts
│   │   │       ui-ux-designer.ts
│   │   │       web-app-testing.ts
│   │   │       web-performance.ts
│   │   │       web-quality.ts
│   │   │
│   │   ├───tools
│   │   │       calculator.ts
│   │   │       count.ts
│   │   │       current-time.ts
│   │   │       if-web-enabled-or-disabled.ts
│   │   │       index.ts
│   │   │       pdf.ts
│   │   │       read-file.ts
│   │   │       write-file.ts
│   │   │
│   │   └───web
│   │           index.ts
│   │           web-api-caller.ts
│   │           web-authenticator.ts
│   │           web-browser.ts
│   │           web-cache-reader.ts
│   │           web-crawling.ts
│   │           web-diff.ts
│   │           web-downloader.ts
│   │           web-feed-parser.ts
│   │           web-fetcher.ts
│   │           web-form-submitter.ts
│   │           web-harvester.ts
│   │           web-headless-scraper.ts
│   │           web-link-extractor.ts
│   │           web-metadata-extractor.ts
│   │           web-monitor.ts
│   │           web-navigator.ts
│   │           web-paginator.ts
│   │           web-parser.ts
│   │           web-qrcode-reader.ts
│   │           web-reader.ts
│   │           web-robots-txt.ts
│   │           web-scraping.ts
│   │           web-screenshot.ts
│   │           web-search.ts
│   │           web-sitemap-parser.ts
│   │           web-socket-listener.ts
│   │           web-spider.ts
│   │           web-summarizer.ts
│   │           web-validator.ts
│   │           web-video-extractor.ts
│   │
│   ├───backend
│   │   │   build.mjs
│   │   │   package.json
│   │   │   tsconfig.json
│   │   │
│   │   ├───dist
│   │   │       index.mjs
│   │   │       index.mjs.map
│   │   │       pino-file.mjs
│   │   │       pino-file.mjs.map
│   │   │       pino-pretty.mjs
│   │   │       pino-pretty.mjs.map
│   │   │       pino-worker.mjs
│   │   │       pino-worker.mjs.map
│   │   │       thread-stream-worker.mjs
│   │   │       thread-stream-worker.mjs.map
│   │   │
│   │   └───src
│   │       │   app.ts
│   │       │   index.ts
│   │       │
│   │       ├───lib
│   │       │       .gitkeep
│   │       │       logger.ts
│   │       │
│   │       ├───middlewares
│   │       │       .gitkeep
│   │       │
│   │       └───routes
│   │               health.ts
│   │               index.ts
│   │               ollama.ts
│   │
│   └───frontend
│       │   components.json
│       │   index.html
│       │   package.json
│       │   tsconfig.json
│       │   vite.config.ts
│       │
│       ├───public
│       │       favicon.svg
│       │       manifest.json
│       │       opengraph.jpg
│       │       robots.txt
│       │       sw.js
│       │
│       └───src
│           │   App.tsx
│           │   index.css
│           │   main.tsx
│           │
│           ├───components
│           │   │   ActivityLog.tsx
│           │   │   ChatInput.tsx
│           │   │   ChoiceCards.tsx
│           │   │   Header.tsx
│           │   │   MessageBubble.tsx
│           │   │   MessageList.tsx
│           │   │   ModelSelector.tsx
│           │   │   PersonaSelector.tsx
│           │   │   QuestionForm.tsx
│           │   │   Sidebar.tsx
│           │   │   ThinkingBox.tsx
│           │   │
│           │   ├───history
│           │   │       HistoryModal.tsx
│           │   │
│           │   ├───settings
│           │   │       Capabilities.tsx
│           │   │       Connection.tsx
│           │   │       Personas.tsx
│           │   │       SettingsModal.tsx
│           │   │       Skills.tsx
│           │   │
│           │   ├───skills
│           │   │       SkillsModal.tsx
│           │   │
│           │   ├───tools
│           │   │       ToolsModal.tsx
│           │   │
│           │   ├───ui
│           │   │       accordion.tsx
│           │   │       alert-dialog.tsx
│           │   │       alert.tsx
│           │   │       aspect-ratio.tsx
│           │   │       avatar.tsx
│           │   │       badge.tsx
│           │   │       breadcrumb.tsx
│           │   │       button-group.tsx
│           │   │       button.tsx
│           │   │       calendar.tsx
│           │   │       card.tsx
│           │   │       carousel.tsx
│           │   │       chart.tsx
│           │   │       checkbox.tsx
│           │   │       collapsible.tsx
│           │   │       command.tsx
│           │   │       context-menu.tsx
│           │   │       dialog.tsx
│           │   │       drawer.tsx
│           │   │       dropdown-menu.tsx
│           │   │       empty.tsx
│           │   │       field.tsx
│           │   │       form.tsx
│           │   │       hover-card.tsx
│           │   │       input-group.tsx
│           │   │       input-otp.tsx
│           │   │       input.tsx
│           │   │       item.tsx
│           │   │       kbd.tsx
│           │   │       label.tsx
│           │   │       menubar.tsx
│           │   │       navigation-menu.tsx
│           │   │       pagination.tsx
│           │   │       popover.tsx
│           │   │       progress.tsx
│           │   │       radio-group.tsx
│           │   │       resizable.tsx
│           │   │       scroll-area.tsx
│           │   │       select.tsx
│           │   │       separator.tsx
│           │   │       sheet.tsx
│           │   │       sidebar.tsx
│           │   │       skeleton.tsx
│           │   │       slider.tsx
│           │   │       sonner.tsx
│           │   │       spinner.tsx
│           │   │       switch.tsx
│           │   │       table.tsx
│           │   │       tabs.tsx
│           │   │       textarea.tsx
│           │   │       toast.tsx
│           │   │       toaster.tsx
│           │   │       toggle-group.tsx
│           │   │       toggle.tsx
│           │   │       tooltip.tsx
│           │   │
│           │   └───web
│           │           WebModal.tsx
│           │
│           ├───helpers
│           │       cache.ts
│           │       compression.ts
│           │       healthCheck.ts
│           │       injectionDetector.ts
│           │       ollama.ts
│           │       parse-choose-option-to-ui.ts
│           │       parse-diagram-to-ui.ts
│           │       parse-response-to-ui.ts
│           │       parse-selection-to-ui.ts
│           │       piiDetector.ts
│           │       rateLimit.ts
│           │       sanitizer.ts
│           │       storage.ts
│           │       thinking.ts
│           │       tokenizer.ts
│           │       toxicityAnalyzer.ts
│           │
│           ├───hooks
│           │       use-mobile.tsx
│           │       use-toast.ts
│           │       useChat.ts
│           │       useModels.ts
│           │
│           ├───lib
│           │       personas.ts
│           │       utils.ts
│           │
│           ├───pages
│           │       Chat.tsx
│           │       Home.tsx
│           │       not-found.tsx
│           │
│           └───store
│                   chat.tsx
│                   settings.tsx
│
├───lib
│   ├───api-client-react
│   │   │   package.json
│   │   │   tsconfig.json
│   │   │   tsconfig.tsbuildinfo
│   │   │
│   │   ├───dist
│   │   │   │   custom-fetch.d.ts
│   │   │   │   custom-fetch.d.ts.map
│   │   │   │   index.d.ts
│   │   │   │   index.d.ts.map
│   │   │   │
│   │   │   └───generated
│   │   │           api.d.ts
│   │   │           api.d.ts.map
│   │   │           api.schemas.d.ts
│   │   │           api.schemas.d.ts.map
│   │   │
│   │   └───src
│   │       │   custom-fetch.ts
│   │       │   index.ts
│   │       │
│   │       └───generated
│   │               api.schemas.ts
│   │               api.ts
│   │
│   ├───api-spec
│   │       openapi.yaml
│   │       orval.config.ts
│   │       package.json
│   │
│   ├───api-zod
│   │   │   package.json
│   │   │   tsconfig.json
│   │   │   tsconfig.tsbuildinfo
│   │   │
│   │   ├───dist
│   │   │   │   index.d.ts
│   │   │   │   index.d.ts.map
│   │   │   │
│   │   │   └───generated
│   │   │       │   api.d.ts
│   │   │       │   api.d.ts.map
│   │   │       │
│   │   │       └───types
│   │   │               healthStatus.d.ts
│   │   │               healthStatus.d.ts.map
│   │   │               index.d.ts
│   │   │               index.d.ts.map
│   │   │
│   │   └───src
│   │       │   index.ts
│   │       │
│   │       └───generated
│   │           │   api.ts
│   │           │
│   │           └───types
│   │                   healthStatus.ts
│   │                   index.ts
│   │
│   └───db
│       │   drizzle.config.ts
│       │   package.json
│       │   tsconfig.json
│       │   tsconfig.tsbuildinfo
│       │
│       ├───dist
│       │   │   index.d.ts
│       │   │   index.d.ts.map
│       │   │
│       │   └───schema
│       │           index.d.ts
│       │           index.d.ts.map
│       │
│       └───src
│           │   index.ts
│           │
│           └───schema
│                   index.ts
│
└───scripts
    │   package.json
    │   post-merge.sh
    │   tsconfig.json
    │
    └───src
            hello.ts