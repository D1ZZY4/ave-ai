flow-1.md — Core Architecture & Folder Overview

1. Project Root Structure

```mermaid
graph TB
    Root["ave-ai/"] --> Config[".gitignore, .npmrc, package.json, pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.base.json, tsconfig.json"]
    Root --> AveAI["ave-ai/"]
    Root --> Lib["lib/"]
    Root --> Scripts["scripts/"]
    AveAI --> AgentsDir["agents/"]
    AveAI --> BackendDir["backend/"]
    AveAI --> FrontendDir["frontend/"]
    Lib --> ApiClientReact["api-client-react/"]
    Lib --> ApiSpec["api-spec/"]
    Lib --> ApiZod["api-zod/"]
    Lib --> DB["db/"]
    Scripts --> ScriptSrc["src/hello.ts"]
    Scripts --> ScriptPM["post-merge.sh"]
```

Explanation: Root monorepo with pnpm workspaces. ave-ai/ contains agents, backend, frontend. lib/ holds shared libraries for API client generation, Zod schemas, database schema. scripts/ contains Git hooks and utility scripts.

2. ave-ai/agents/ Top-Level Structure

```mermaid
graph TB
    Agents["agents/"] --> Memory["memory/"]
    Agents --> Personas["personas/"]
    Agents --> Rules["rules/"]
    Agents --> Skills["skills/"]
    Agents --> Tools["tools/"]
    Agents --> Web["web/"]
    Memory --> MemFiles["5 files"]
    Personas --> PersFiles["8 files + index.ts"]
    Rules --> RuleFiles["12 files + index.ts"]
    Skills --> SkillFiles["14 files + index.ts"]
    Tools --> ToolFiles["8 files + index.ts"]
    Web --> WebFiles["31 files + index.ts"]
```

Explanation: The agents directory is the brain of the system. Each subfolder defines a distinct capability: memory/ for long-term user facts, personas/ for AI personalities, rules/ for constraint definitions, skills/ for composite workflows, tools/ for atomic functions, and web/ for web automation tools.

3. frontend/src/ Structure

```mermaid
graph TB
    FrontendSrc["frontend/src/"] --> AppTsx["App.tsx"]
    FrontendSrc --> MainTsx["main.tsx"]
    FrontendSrc --> IndexCSS["index.css"]
    FrontendSrc --> Comps["components/"]
    FrontendSrc --> Hlps["helpers/"]
    FrontendSrc --> Hks["hooks/"]
    FrontendSrc --> LibF["lib/"]
    FrontendSrc --> Pgs["pages/"]
    FrontendSrc --> Str["store/"]
    Comps --> BaseComps["12 files + history/, settings/, skills/, tools/, ui/, web/"]
    Hlps --> HelpFiles["16 files"]
    Hks --> HookFiles["4 files"]
    Str --> StoreFiles["2 files"]
```

Explanation: The frontend source tree includes the root app component, entry point, global styles, and folders for components, helpers, hooks, library utilities, pages, and Zustand stores. Components are organized by feature: chat UI, thinking box, modals, and subdirectories for history, settings, skills, tools, UI primitives, and web tools.

4. Macro Architecture & Data Flow

```mermaid
graph TB
    Browser["Mobile Browser"] --> UI["React TS Frontend (Vite)"]
    UI --> UseChat["useChat Hook"]
    UseChat --> Orchestrator["Flow Ave Orchestrator"]
    UseChat --> ZustandStore["Zustand Stores (chat + settings)"]
    ZustandStore --> LocalStorage["localStorage (persist middleware)"]

    Orchestrator --> AgentsRegistry["Agents Registry"]
    AgentsRegistry --> PersonasLoad["Load Persona"]
    AgentsRegistry --> MemoryLoad["Load Memory (user facts)"]
    AgentsRegistry --> RulesValidate["Validate Rules (12 rule sets)"]
    AgentsRegistry --> ToolsExecute["Execute Tools (8 atomic tools)"]
    AgentsRegistry --> SkillsExecute["Execute Skills (14 workflows)"]
    AgentsRegistry --> WebExecute["Execute Web Tools (31 tools)"]

    Orchestrator --> OllamaClient["Ollama API Client (helpers/ollama.ts)"]
    OllamaClient --> OllamaServer["Ollama Instance<br/>baseUrl from Settings<br/>Model: nexusriot/qwen3.5-opus-distil:9b"]

    Orchestrator --> BackendProxy["Backend Proxy (optional)"]
    BackendProxy --> OllamaServer

    ToolsExecute --> HelpersPool["Helpers Pool (16 helpers)"]
    SkillsExecute --> HelpersPool
    WebExecute --> HelpersPool
    MemoryLoad --> HelpersPool
```

Explanation: The user interacts with the React UI which invokes the useChat hook. This hook acts as the central orchestrator, loading personas, rules, tools, skills, memory, and communicating with Ollama (directly or via an optional backend proxy). All tool/skill/web executions consume a shared pool of helper utilities. State is persisted to localStorage via Zustand's persist middleware.

5. Main Execution Loop with Three Validation Gates

```mermaid
flowchart TD
    Start(["User Input + conversationId"]) --> LoadPersona["Load Persona from agents/personas"]
    LoadPersona --> LoadMemory["Load user facts from agents/memory"]
    LoadMemory --> LoadRules["Load all 12 Rule Sets from agents/rules"]
    LoadRules --> Gate1{"Gate 1: Input Safety<br/>piiDetector + injectionDetector + toxicityAnalyzer"}
    Gate1 -->|"Blocked"| DeniedUI["Return SAFETY_BLOCK to UI"]
    Gate1 -->|"Clean"| Mode{"Mode? (Fast or Expert)"}

    Mode -->|Fast| FastPath["Build Fast Prompt:<br/>- system prompt only<br/>- no tool schema<br/>- stream: false"]
    Mode -->|Expert| ExpertPath["Build Expert Prompt:<br/>- system prompt + memory facts<br/>- tool/web JSON schema<br/>- ReAct format instructions<br/>- stream: true"]

    FastPath --> CallOllama["POST to Ollama API via helpers/ollama.ts"]
    ExpertPath --> CallOllama
    CallOllama --> ParseStream["Parse NDJSON stream via helpers/parse-response-to-ui.ts"]
    ParseStream --> DetectType{"Response Type?"}

    DetectType -->|"final_answer"| Gate3{"Gate 3: Output Safety<br/>piiDetector + toxicityAnalyzer"}
    Gate3 -->|"Blocked"| FilterOutput["Filter via helpers/sanitizer"]
    Gate3 -->|"Clean"| ExtractMemory["Extract facts → memory/"]
    FilterOutput --> ExtractMemory
    ExtractMemory --> ReturnUI["Return FinalAnswer to UI<br/>+ add assistant ChatMessage<br/>+ clear thinkingSteps"]

    DetectType -->|"tool_call/skill_call/web_call"| Gate2{"Gate 2: Pre-Approval<br/>(safety + tool rules + rate limit)"}
    Gate2 -->|"Denied"| FeedbackDenial["Send denial reason to LLM<br/>LLM re-thinks alternative"]
    FeedbackDenial --> CallOllama
    Gate2 -->|"Approved"| ExecDecision{"Execution Type?"}
    ExecDecision -->|Tool| ExecTool["Run tool handler from agents/tools/"]
    ExecDecision -->|Skill| ExecSkill["Run skill pipeline from agents/skills/"]
    ExecDecision -->|Web| ExecWeb["Run web tool from agents/web/"]
    ExecTool --> PostCheck["Post-Check Result<br/>(safety scan output)"]
    ExecSkill --> PostCheck
    ExecWeb --> PostCheck
    PostCheck -->|"Problematic"| FilterResult["Filter or block result"]
    PostCheck -->|"Clean"| LogStep["Log ThinkingStep"]
    FilterResult --> LogStep
    LogStep --> CheckStop{"Stop Condition?"}
    CheckStop -->|"Max iterations reached"| ForceFinal["Force LLM to give final answer"]
    CheckStop -->|"Not yet"| CallOllama
    CheckStop -->|"final_answer flag"| Gate3
    ForceFinal --> CallOllama
```

Explanation: The execution loop applies three safety gates: input validation, pre-approval of actions, and output filtering. Fast mode skips tools and streaming; Expert mode enables full ReAct loop with tools/skills/web capabilities. Denied actions are fed back to the LLM for self-correction. Every step is logged to the Zustand store for the ThinkingBox UI. Memory extraction runs after a successful final answer.

6. State Machine: Fast vs Expert Mode

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> FastSession : "Mode = Fast"
    Idle --> ExpertSession : "Mode = Expert"

    state FastSession {
        [*] --> F_Loading : "Load persona + rules + settings"
        F_Loading --> F_InputCheck : "evaluateInput()"
        F_InputCheck --> F_Denied : "Safety violation"
        F_Denied --> [*]
        F_InputCheck --> F_BuildPrompt : "Input clean"
        F_BuildPrompt --> F_CallLLM : "POST with stream:false"
        F_CallLLM --> F_OutputCheck : "evaluateOutput()"
        F_OutputCheck --> F_Filter : "PII/Toxicity found"
        F_Filter --> F_Return : "Return filtered answer"
        F_OutputCheck --> F_Return : "Output clean"
        F_Return --> [*]
    }

    state ExpertSession {
        [*] --> E_Loading : "Load persona + rules + settings"
        E_Loading --> E_InputCheck : "evaluateInput()"
        E_InputCheck --> E_Denied : "Safety violation"
        E_Denied --> [*]
        E_InputCheck --> ReActLoop : "Enter ReAct Loop"
        state ReActLoop {
            [*] --> Thinking : "LLM generates thought"
            Thinking --> Selecting : "LLM selects action"
            Selecting --> PreCheck : "Pre-approve action"
            PreCheck --> PreDenied : "Action denied"
            PreDenied --> Thinking : "LLM re-thinks"
            PreCheck --> Executing : "Action approved"
            Executing --> PostCheck : "Post-check result"
            PostCheck --> PostBlocked : "Result blocked"
            PostBlocked --> Thinking : "LLM re-thinks"
            PostCheck --> Observing : "Result clean"
            Observing --> Thinking : "Continue loop"
            Observing --> FinalAnswer : "Final flag detected"
        }
        FinalAnswer --> E_OutputCheck : "evaluateOutput()"
        E_OutputCheck --> E_Filter : "PII/Toxicity found"
        E_Filter --> E_Return : "Return + extract memory"
        E_OutputCheck --> E_Return : "Output clean"
        E_Return --> [*]
    }
```

Explanation: Fast mode is a linear, single-pass interaction with no tools or streaming. Expert mode includes a nested ReAct loop with sub-states for thinking, action selection, pre-approval, execution, post-check, and observation. Denials at any stage cause the LLM to re-think. Both modes end with output validation and optional filtering.

7. Rules Engine: Evaluation Flow

```mermaid
flowchart TD
    Trigger["Trigger: Input / ToolCall / Output"] --> Evaluator["Evaluator (rules loaded from agents/rules/)"]
    Evaluator --> GlobalRules["agent.ts, global.ts, context.ts"]
    Evaluator --> ModeRules["expert-mode.ts, fast-mode.ts"]
    Evaluator --> TargetRules["tools.ts"]
    Evaluator --> SafetyRules["safety.ts"]
    Evaluator --> LanguageRules["language.ts, tone.ts"]
    Evaluator --> GreetingRules["greeting.ts"]
    Evaluator --> ThinkingRules["thinking.ts"]

    GlobalRules --> Aggregator["Aggregator"]
    ModeRules --> Aggregator
    TargetRules --> Aggregator
    SafetyRules --> Aggregator
    LanguageRules --> Aggregator
    GreetingRules --> Aggregator
    ThinkingRules --> Aggregator

    Aggregator --> PrioritySort["Priority: Safety(100) > Global(80) > Mode(60) > Target(40) > Language(20) > Tone(10)"]
    PrioritySort --> SequentialCheck["Sequential evaluation — short-circuit on first DENY"]
    SequentialCheck --> Decision{"Decision"}
    Decision -->|Allow| AllowAction["Allow"]
    Decision -->|Modify| ModifyAction["Allow with modification"]
    Decision -->|Deny| DenyAction["Reject + ReasonCode"]
```

Explanation: The Rules Engine collects all 12 rule sets, sorts them by priority, and evaluates sequentially. Safety rules are evaluated first; a denial stops further checks. Results can be Allow, Modify (e.g., redact PII), or Deny (with a reason code fed back to the LLM).

8. Control Hierarchy & ThinkingBox Rendering

```mermaid
graph TB
    subgraph ControlPlane["Control Plane"]
        RulesEngine["Rules Engine"] --> Orchestrator["Orchestrator (useChat)"]
    end
    subgraph CoreDomain["Core Domain"]
        Persona["Persona"]
        HelperPool["Helper Pool (16 helpers)"]
        Registry["Registry (Map<string, Tool|Skill|WebTool>)"]
    end
    subgraph ExecutionPlane["Execution"]
        LLM["Ollama API"]
        Executor["Tool/Skill/Web Executor"]
    end
    subgraph StatePlane["State & Stream"]
        Store["Zustand Store"]
        ThinkingSteps["ThinkingStep[]"]
        Stream["useThinking hook"]
    end
    Orchestrator --> Persona
    Orchestrator --> HelperPool
    Orchestrator --> Registry
    Orchestrator --> ExecutionPlane
    Orchestrator --> Store
    Store --> ThinkingSteps
    ThinkingSteps --> Stream
    Stream --> ThinkingBoxComponent["ThinkingBox.tsx"]
```

Explanation: The system is divided into four planes. The Control Plane enforces rules. The Core Domain holds personas, helpers, and the tool/skill registry. The Execution Plane communicates with Ollama and runs actions. The State Plane manages reactive data and streams thinking steps to the ThinkingBox UI component via the useThinking hook.

9. agents/personas/ Folder Overview

```mermaid
graph TB
    PersonasDir["agents/personas/"] --> Adaptive["adaptive.ts"]
    PersonasDir --> Casual["casual.ts"]
    PersonasDir --> Creative["creative.ts"]
    PersonasDir --> Default["default.ts"]
    PersonasDir --> Developer["developer.ts"]
    PersonasDir --> Planner["planner.ts"]
    PersonasDir --> Wise["wise.ts"]
    PersonasDir --> Index["index.ts (barrel)"]
```

Explanation: Eight persona files plus a barrel export. Each exports a Persona object containing systemPrompt, displayName, and toneInstruction.

10. agents/rules/ Folder Overview

```mermaid
graph LR
    RulesDir["agents/rules/"] --> Agent["agent.ts"]
    RulesDir --> Context["context.ts"]
    RulesDir --> Expert["expert-mode.ts"]
    RulesDir --> Fast["fast-mode.ts"]
    RulesDir --> Global["global.ts"]
    RulesDir --> Greeting["greeting.ts"]
    RulesDir --> Language["language.ts"]
    RulesDir --> Safety["safety.ts"]
    RulesDir --> Thinking["thinking.ts"]
    RulesDir --> Tone["tone.ts"]
    RulesDir --> Tools["tools.ts"]
    RulesDir --> Index["index.ts (barrel)"]
```

Explanation: Twelve rule files plus barrel. Each file exports a RuleSet object consumed by the Rules Engine.

11. agents/skills/ Folder Overview

```mermaid
graph TB
    SkillsDir["agents/skills/"] --> Auto["auto-skills.ts"]
    SkillsDir --> Codex["codex.ts"]
    SkillsDir --> Mermaid["mermaid-diagram.ts"]
    SkillsDir --> PRD["prd.ts"]
    SkillsDir --> Python["python-code-style.ts"]
    SkillsDir --> SEO["seo.ts"]
    SkillsDir --> Summarize["summarize.ts"]
    SkillsDir --> TDD["tdd.ts"]
    SkillsDir --> Telegram["telegram-bot-builder.ts"]
    SkillsDir --> UIUX["ui-ux-designer.ts"]
    SkillsDir --> WebTest["web-app-testing.ts"]
    SkillsDir --> WebPerf["web-performance.ts"]
    SkillsDir --> WebQual["web-quality.ts"]
    SkillsDir --> Index["index.ts (barrel)"]
```

Explanation: Fourteen skill files plus barrel. Each exports a Skill object with an ordered array of tool names or sub-skill names to execute.

12. agents/tools/ Folder Overview

```mermaid
graph TB
    ToolsDir["agents/tools/"] --> Calc["calculator.ts"]
    ToolsDir --> Count["count.ts"]
    ToolsDir --> CTime["current-time.ts"]
    ToolsDir --> IfWeb["if-web-enabled-or-disabled.ts"]
    ToolsDir --> PDF["pdf.ts"]
    ToolsDir --> ReadFile["read-file.ts"]
    ToolsDir --> WriteFile["write-file.ts"]
    ToolsDir --> Index["index.ts (barrel)"]
```

Explanation: Eight atomic tool files plus barrel. Each exports a Tool object with Zod schema and handler function.

13. agents/web/ Folder Overview

```mermaid
graph TB
    WebDir["agents/web/"] --> W1["web-api-caller.ts"]
    WebDir --> W2["web-authenticator.ts"]
    WebDir --> W3["web-browser.ts"]
    WebDir --> W4["web-cache-reader.ts"]
    WebDir --> W5["web-crawling.ts"]
    WebDir --> W6["web-diff.ts"]
    WebDir --> W7["web-downloader.ts"]
    WebDir --> W8["web-feed-parser.ts"]
    WebDir --> W9["web-fetcher.ts"]
    WebDir --> W10["web-form-submitter.ts"]
    WebDir --> W11["web-harvester.ts"]
    WebDir --> W12["web-headless-scraper.ts"]
    WebDir --> W13["web-link-extractor.ts"]
    WebDir --> W14["web-metadata-extractor.ts"]
    WebDir --> W15["web-monitor.ts"]
    WebDir --> W16["web-navigator.ts"]
    WebDir --> W17["web-paginator.ts"]
    WebDir --> W18["web-parser.ts"]
    WebDir --> W19["web-qrcode-reader.ts"]
    WebDir --> W20["web-reader.ts"]
    WebDir --> W21["web-robots-txt.ts"]
    WebDir --> W22["web-scraping.ts"]
    WebDir --> W23["web-screenshot.ts"]
    WebDir --> W24["web-search.ts"]
    WebDir --> W25["web-sitemap-parser.ts"]
    WebDir --> W26["web-socket-listener.ts"]
    WebDir --> W27["web-spider.ts"]
    WebDir --> W28["web-summarizer.ts"]
    WebDir --> W29["web-validator.ts"]
    WebDir --> W30["web-video-extractor.ts"]
    WebDir --> Index["index.ts (barrel)"]
```

Explanation: Thirty-one web tool files plus barrel. Each exports a WebTool object providing browser automation, scraping, API calling, and content extraction capabilities.

14. frontend/src/helpers/ Folder Overview

```mermaid
graph LR
    HelpersDir["frontend/src/helpers/"] --> H1["cache.ts"]
    HelpersDir --> H2["compression.ts"]
    HelpersDir --> H3["healthCheck.ts"]
    HelpersDir --> H4["injectionDetector.ts"]
    HelpersDir --> H5["ollama.ts"]
    HelpersDir --> H6["parse-choose-option-to-ui.ts"]
    HelpersDir --> H7["parse-diagram-to-ui.ts"]
    HelpersDir --> H8["parse-response-to-ui.ts"]
    HelpersDir --> H9["parse-selection-to-ui.ts"]
    HelpersDir --> H10["piiDetector.ts"]
    HelpersDir --> H11["rateLimit.ts"]
    HelpersDir --> H12["sanitizer.ts"]
    HelpersDir --> H13["storage.ts"]
    HelpersDir --> H14["thinking.ts"]
    HelpersDir --> H15["tokenizer.ts"]
    HelpersDir --> H16["toxicityAnalyzer.ts"]
```

Explanation: Sixteen pure utility modules. They provide caching, compression, health checks, injection/PII/toxicity detection, an Ollama client, NDJSON stream parsing (response, diagram, choose‑option, selection), rate limiting, HTML sanitization, IndexedDB storage, thinking step management, and token counting.

15. Complete System Flow (End-to-End)

```mermaid
graph TB
    User["👤 User"] --> ChatInput["ChatInput.tsx"]
    ChatInput --> UseChat["useChat.ts"]
    UseChat --> SafetyHelpers["piiDetector + injectionDetector + toxicityAnalyzer"]
    SafetyHelpers --> SafetyRules["rules/safety.ts"]
    UseChat --> PersonaData["personas/*.ts"]
    UseChat --> MemoryFacts["memory/ (IndexedDB)"]
    UseChat --> PromptBuilder["Prompt Assembler: System + Rules + Tools + Memory"]
    UseChat --> OllamaClient["helpers/ollama.ts"]
    OllamaClient --> SettingsStore["store/settings.tsx"]
    OllamaClient --> Ollama["Ollama Instance"]
    Ollama --> ParseHelper["helpers/parse-response-to-ui.ts"]
    ParseHelper --> UseChat
    UseChat --> RulesEngine["Rules Engine (12 rule sets)"]
    RulesEngine --> ToolExecutor["Tool/Skill/Web Executor"]
    ToolExecutor --> UseChat
    UseChat --> ChatStore["store/chat.tsx"]
    ChatStore --> MessageList["MessageList.tsx"]
    ChatStore --> ThinkingBox["ThinkingBox.tsx"]
    ChatStore --> LocalStorage["localStorage"]
    UseChat --> MemoryExtractor["memory/extractor.ts"]
    MemoryExtractor --> IndexedDB["IndexedDB"]
```

Explanation: End‑to‑end data flow from user input through safety checks, persona/memory loading, prompt building, Ollama communication, response parsing, rule evaluation, tool execution, store updates, UI rendering, and memory persistence. Every component is connected and dependencies flow strictly through defined interfaces.

---

End of flow-1.md. This file covers the core architecture, execution loop, state machine, rules engine, control hierarchy, and folder overviews. Subsequent files will provide per-file diagrams and detailed explanations for personas, rules, skills, tools, web tools, and helpers.