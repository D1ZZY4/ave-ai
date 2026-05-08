# Ave AI

A mobile-first AI chat interface for Ollama — built with React, TypeScript, Tailwind CSS, and Vite. Designed to feel like a real AI agent, not just a chatbot.

## Run & Operate

- `pnpm --filter @workspace/ave-ai run dev` — run the Ave AI web app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React 19 + Vite 7 + Tailwind CSS v4
- State: React Context (settings + chat sessions)
- Ollama REST API for streaming chat

## Folder Structure

```
artifacts/ave-ai/src/
│
├── rules/              ← AI behavior rules (modular, tagged, prioritized)
│   ├── greeting.ts     ← first-message welcome (adapts per persona)
│   ├── tone.ts         ← communication standards (always applies)
│   ├── language.ts     ← user language matching (always applies)
│   ├── agent.ts        ← autonomous agent behavior
│   ├── context.ts      ← conversation memory (applies after 2+ messages)
│   ├── thinking.ts     ← reasoning instructions (when thinking enabled)
│   ├── expert-mode.ts  ← deep analysis (when Expert mode)
│   ├── fast-mode.ts    ← speed-optimized (when Fast mode)
│   ├── safety.ts       ← absolute guardrails (highest priority, always)
│   └── index.ts        ← registry + compileRules(ctx) → system prompt
│
├── personas/           ← 7 distinct AI personas, each in its own file
│   ├── ave-prime.ts    ← balanced, adaptable (default)
│   ├── muse.ts         ← creative, vivid, lateral thinking
│   ├── architect.ts    ← systematic, technical, first-principles
│   ├── diplomat.ts     ← nuanced, measured, multi-perspective
│   ├── sage.ts         ← philosophical, wisdom-seeking
│   ├── maverick.ts     ← bold, contrarian, assumption-breaking
│   ├── mentor.ts       ← patient, teaching, encouraging
│   └── index.ts        ← registry + getPersona()
│
├── skills/             ← conversation focus modes
│   ├── general.ts, developer.ts, summary.ts, prd.ts
│   └── index.ts        ← registry + detectSkill() (auto-detect from message)
│
├── tools/              ← AI-callable tools
│   ├── calculator.ts, current-time.ts, web-search.ts
│   └── index.ts        ← registry + executeTool()
│
├── helpers/            ← utility code
│   ├── ollama.ts       ← Ollama API client + streaming
│   ├── thinking.ts     ← real-time <think> block parser
│   └── storage.ts      ← localStorage helpers
│
├── store/              ← React context (settings, chat sessions/messages)
├── hooks/              ← useChat (send/stop/rules pipeline), useModels
├── components/         ← UI — ActivityLog, ChatInput, Sidebar, Modals...
└── pages/              ← Home (welcome), Chat (active conversation)
```

## Agent Architecture — How a Message is Processed

```
User sends message
        │
        ▼
1. Auto-detect Skill (or use manual selection)
        │
        ▼
2. Load Persona (from personas/)
        │
        ▼
3. Compile Rules (rules/index.ts → compileRules(ctx))
   - Evaluates conditions: isFirstMessage, mode, messageCount, etc.
   - Sorts by priority (safety=200, greeting=100, language=90...)
   - Returns rulesPrompt + appliedRules[]
        │
        ▼
4. Build Layered System Prompt:
   [SKILL] + [PERSONA] + [RULES]
        │
        ▼
5. Stream to Ollama (with all tools registered)
        │
        ▼
6. Parse streaming response:
   ├── <think>...</think> → real-time thinking display
   ├── tool_calls → execute tool, feed result back
   └── content → stream to UI
        │
        ▼
7. Activity Log shown in UI:
   Skill → Persona → Mode → Rules → Thinking → Tool Calls
```

## Rules System

Each rule file exports a `Rule` object:
- `tags[]` — categorization
- `priority` — higher = applied first (safety=200 is absolute)
- `condition(ctx)` — optional, determines if rule applies
- `instruction` — string or function returning string

To add a new rule: create `src/rules/my-rule.ts`, export a `Rule`, register in `index.ts`.

## Personas

7 personas each with distinct `systemPrompt`. Each has a color accent in the UI.
To add a persona: create `src/personas/my-persona.ts`, add to `ALL_PERSONAS` in `index.ts`.

## User Preferences

- All UI text and system prompts in English
- AI output always matches user's language (language rule enforces this)
- Mobile-first: compact sizing, large rounded corners
- No sycophantic language — toneRule enforces this
- "Local instance" instead of any tier/node labels

## Gotchas

- Ollama must run at the configured base URL (default: http://localhost:11434)
- Thinking display requires a model that outputs `<think>...</think>` tags (qwen3, deepseek-r1, etc.)
- `ERR_CONNECTION_REFUSED` in browser = Ollama not reachable (expected in this dev environment)
