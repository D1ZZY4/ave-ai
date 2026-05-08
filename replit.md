# Ave AI

A mobile-first AI chat interface for Ollama, inspired by modern AI chat apps. Built with React, TypeScript, Tailwind CSS, and Vite.

## Run & Operate

- `pnpm --filter @workspace/ave-ai run dev` — run the Ave AI web app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React 19 + Vite 7 + Tailwind CSS v4
- State: React Context (no external state lib)
- Ollama REST API for streaming chat

## Where things live

```
artifacts/ave-ai/src/
├── tools/          ← one file per tool (calculator, current-time, web-search)
│   └── index.ts   ← registry + executeTool()
├── skills/         ← one file per skill (general, developer, summary, prd)
│   └── index.ts   ← registry + detectSkill()
├── helpers/        ← utility code (ollama API client, thinking parser, storage)
├── store/          ← React context (settings, chat sessions/messages)
├── hooks/          ← useChat (send/stop), useModels (fetch Ollama models)
├── components/     ← UI components
│   └── ActivityLog.tsx  ← real-time process log (skill, persona, thinking, tools)
└── pages/          ← Home (welcome), Chat (active conversation)
```

## Architecture decisions

- **Contract-first tools/skills**: each tool and skill is its own file — add a new file + register in index.ts, done.
- **Auto-detect skill**: analyzes user message keywords to pick the best skill automatically; user can always override.
- **Process log (ActivityLog)**: every AI response shows what skill, persona, mode was used + real-time thinking stream (like Replit Agent). Controlled via Settings toggles.
- **Layered system prompt**: `skill.prompt + persona.addition + mode.instruction + thinking.instruction` — all composable.
- **Streaming thinking parser**: `helpers/thinking.ts` handles partial `<think>...</think>` tags during streaming.
- **No router**: simple view state (`home` | `chat`) in App.tsx — intentional for mobile simplicity.

## Product

Ave AI connects to a local Ollama instance and provides:
- Real-time streaming chat with thinking/reasoning display
- Model selector (auto-fetched from Ollama)
- Persona system: Ave Prime, Muse, Architect, Diplomat
- Skills: General, Developer, Summary, PRD (with auto-detection)
- Mode: Fast (speed-optimized) or Expert (deep reasoning)
- Built-in tools: Calculator, Current Time, Web Search
- Chat history stored in localStorage
- Custom Ollama base URL in Settings
- Show/hide process log and thinking independently

## User preferences

- Language: All UI and system prompts in English; AI output matches user's language
- Mobile-first: compact sizing, large rounded corners, touch-friendly
- No "alay" language anywhere — professional and clean copy

## Gotchas

- Ollama must be running and accessible at the configured base URL
- `ERR_CONNECTION_REFUSED` in browser console = Ollama not reachable (expected in dev environment)
- Thinking display requires a model that outputs `<think>...</think>` tags (e.g. qwen3, deepseek-r1)
