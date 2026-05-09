flow-7.md — Core Systems & UI Interactions

This file provides detailed diagrams and explanations for deployment, initialization, memory, prompting, types, concurrency, security, offline, settings, conversations, chat history, message actions, model integration.

---

1. Deployment & Communication (React TS + Ollama)

```mermaid
graph TB
    subgraph Browser["Mobile Browser"]
        UI["React TS App (Vite)"]
        Hook["hooks/useChat"]
        UI --> Hook
    end
    subgraph Server["API Server (Optional)"]
        Core["Flow Ave Core (Bun/Node)"]
        Ollama["Ollama Instance (Settings.baseUrl)"]
        Fs["Virtual File System (personas, rules, ...)"]
    end
    Hook -->|fetch /api/agent| Core
    Core --> Fs
    Core -->|POST /api/generate| Ollama
    Core -.->|if tool allowed| ExtAPI["External API"]
```

Explanation: The React frontend can talk directly to Ollama if CORS is enabled, or through a thin API server for production. All environment variables (OLLAMA_NUM_CTX=65536, FLASH_ATTENTION=1, KV_CACHE_TYPE=q4_0, OLLAMA_HOST=0.0.0.0, KEEP_ALIVE=-1, MAX_LOADED_MODELS=1, SCHED_SPREAD=1, MAX_QUEUE=512) are set in the server environment. External APIs like DuckDuckGo are only called if the corresponding tool's rate limit allows it. The backend proxy adds logging, CSP headers, and rate limiting.

---

2. App Initialization & Autoload Registry

```mermaid
flowchart TD
    AppStart["App Mount (main.tsx)"] --> InitStore["Init Zustand stores"]
    InitStore --> LoadSettings["Load settings from localStorage"]
    LoadSettings --> ImportModules["Dynamic import all agents/* folders"]
    ImportModules --> BuildRegistry["Build maps: Tool, Skill, Persona, WebTool"]
    BuildRegistry --> ValidateDeps["Validate skill dependencies"]
    ValidateDeps --> InitHooks["Initialize useChat, useThinking, useModels, useMobile, useToast"]
    InitHooks --> Ready["Render UI, auto‑greeting if enabled"]
```

Explanation: Vite's import.meta.glob imports all modules from agents/personas/, agents/rules/, agents/tools/, agents/skills/, agents/web/, and agents/memory/. The Registry is a plain Map<string, Tool | Skill | WebTool>. Missing dependencies cause an error toast at startup. After hooks are initialized, if greeting.ts requires it, a greeting is generated in a new default conversation.

---

3. Optimized Agent Memory (Detailed Structure & Flow)

```mermaid
graph TB
    subgraph MemoryComponents["Memory Components (per conversation)"]
        SystemPrompt["System Prompt (static)"]
        TaskState["Task State (current objective)"]
        FileContext["File Context (relevant files)"]
        ActionHistory["Action History (summarised steps)"]
        WorkingMemory["Working Memory (tool outputs)"]
        LongTermMemory["Long-term Memory (user facts from memory/)"]
    end

    Input["User Input"] --> TaskParser["Task Parser"]
    TaskParser --> ContextGatherer["Context Gatherer"]
    ContextGatherer --> FileContext
    ContextGatherer --> ActionHistory
    ContextGatherer --> LongTermMemory
    ContextGatherer --> Assembler["Prompt Assembler"]
    Assembler --> Truncate["Truncate if > tokenBudget"]
    Truncate --> FinalPrompt["Final Prompt to LLM"]
    LLM["LLM Response"] --> MemoryUpdater["Memory Updater"]
    MemoryUpdater -->|Save new facts| LongTermMemory
    MemoryUpdater -->|Log step| ActionHistory
```

Explanation: Six memory components work together. LongTermMemory draws from the memory/ folder stored in IndexedDB. WorkingMemory holds ephemeral values cleared on task completion. The memory updater uses a separate small LLM call to extract structured facts from the assistant's answer. Token budget allocation: System Prompt 15% (~9800 tokens), File Context 35% (~22900), ActionHistory 25% (~16300), Output 25% (~16300).

---

4. Prompt Template Structure (with Model Adaptation)

```mermaid
graph TB
    subgraph Prompt["Prompt Assembly"]
        System["System: persona.systemPrompt + long-term facts"]
        Rules["Rules (formatted from rules/)"]
        Tools["Tools JSON Schema (if tools enabled)"]
        Format["Format Instructions (ReAct or Thinking)"]
        Examples["Few-shot examples (2-3)"]
        Model["Model-specific block (Qwen3: thinking tag)"]
    end
    System --> Assembly["Assembly"]
    Rules --> Assembly
    Tools --> Assembly
    Format --> Assembly
    Examples --> Assembly
    Model --> Assembly
    Assembly --> Final["Final Prompt to Ollama"]
```

Explanation: The prompt is assembled from six blocks. System includes persona's systemPrompt and long-term memory facts. Tools block is only included in Expert mode when enableTools is true. For Qwen3-based models, an extra instruction encourages native reasoning tags (思考/回答). Few-shot examples demonstrate the ReAct format.

---

5. TypeScript Core Type Definitions

```mermaid
graph LR
    subgraph Types["src/types.ts"]
        Persona["Persona { name, systemPrompt, displayName, toneInstruction }"]
        Tool["Tool { name, description, parameters: ZodSchema, handler: (params) => Promise<ToolResult> }"]
        Skill["Skill { name, description, steps: string[] }"]
        WebTool["WebTool { name, description, parameters: ZodSchema, handler: (params) => Promise<WebToolResult> }"]
        RuleSet["RuleSet { global, mode, tools, safety, language, tone, greeting, thinking }"]
        ThinkingStep["ThinkingStep { stepNumber, thought, action?, actionInput?, observation?, timestamp, conversationId }"]
        ChatMessage["ChatMessage { id, role, content, timestamp, conversationId }"]
        Conversation["Conversation { id, title, personaId, mode, messages: ChatMessage[], thinkingSteps: ThinkingStep[], createdAt, updatedAt }"]
        Settings["Settings { ollamaBaseUrl, model, displayName, showProcessLog, showThinking, enableThinking, enableTools, webEnabled, memoryEnabled, theme }"]
        MemoryFact["MemoryFact { key, value, timestamp, confidence }"]
        RuleResult["RuleResult = { decision: 'Allow' | 'Modify' | 'Deny', reason?: string, modifiedData?: any }"]
        ToolResult["ToolResult = { success: boolean, data?: any, error?: string }"]
        WebToolResult["WebToolResult = { success: boolean, data?: any, error?: string }"]
        AgentState["AgentState = { conversations: Record<string, Conversation>, currentConversationId: string | null, settings: Settings, isStreaming: boolean, error: string | null }"]
    end
```

Explanation: Centralized types ensure consistency across all modules. Persona and Tool use ZodSchema for runtime validation. MemoryFact stores key-value pairs with confidence scores. AgentState defines the full Zustand store shape. All modules import from this single types file.

---

6. Concurrency & Abort Controller

```mermaid
flowchart TD
    UserInput["User sends input (with conversationId)"] --> AbortPrev{"Is thinking active for this conversation?"}
    AbortPrev -->|Yes| Abort["Abort previous controller"]
    AbortPrev -->|No| Start["Create new AbortController"]
    Abort --> Start
    Start --> Execute["Run execution loop"]
    Execute --> Check{"controller.signal.aborted?"}
    Check -->|Yes| Cancel["Stop, save partial, show 'Cancelled'"]
    Check -->|No| Continue["Continue"]
```

Explanation: Each conversation maintains its own AbortController in the Zustand store (Map<conversationId, AbortController>). When a new message is sent, any pending request for that conversation is aborted to prevent duplicate responses. The controller signal is passed to fetch calls and checked periodically during streaming.

---

7. Security Hardening (CSP & XSS Prevention)

```mermaid
flowchart TD
    Response["LLM Output"] --> Sanitize["DOMPurify.sanitize()"]
    Sanitize --> CSP["Apply Content-Security-Policy header"]
    CSP --> React["Render with React auto‑escape"]
    Input["User Input"] --> CSRF["Validate CSRF token"]
    CSRF --> API["Send to API"]
```

Explanation: All LLM output is purified via DOMPurify before rendering (prevents XSS). CSP headers set: default-src 'self'; script-src 'self'; connect-src 'self' ollamaBaseUrl. React's JSX auto-escapes all string interpolations as defense-in-depth. CSRF tokens are required for state-changing requests when the optional backend proxy is used.

---

8. Offline Detection & Queue (PWA)

```mermaid
flowchart TD
    OnlineCheck{"navigator.onLine?"} -->|Online| Direct["Send request"]
    OnlineCheck -->|Offline| Queue["Save to IndexedDB"]
    Queue --> Event["Listen 'online' event"]
    Event --> Flush["Send all queued"]
    Flush --> Direct
```

Explanation: The sw.js service worker intercepts fetch requests. When offline, user messages are stored in IndexedDB with a pending status. A toast notifies the user that the message is queued. Once the online event fires, all queued messages are sent in order, and the UI updates with the AI responses.

---

9. Service Worker & PWA Manifest

```mermaid
graph TB
    HTML["index.html"] --> Manifest["manifest.json"]
    HTML --> SW["Register sw.js"]
    SW --> Strategy["Cache-first for static, Network-first for API"]
```

Explanation: The PWA manifest enables "Add to Home Screen" with app name, icons, theme color, and display mode "standalone". The service worker caches static assets (HTML, CSS, JS) using cache-first strategy. API calls use network-first with offline queue fallback.

---

10. Settings Flow: Load, Edit, Save, Test Connection

```mermaid
flowchart TD
    Open["SettingsModal opened"] --> Load["Load settings from store"]
    Load --> Display["Display form: Base URL, Model, Display Name, Toggles"]
    Display --> Test{"Test Connection?"}
    Test -->|Yes| Fetch["GET {baseUrl}/api/tags"]
    Fetch -->|OK| ShowModels["Show model list + Connected"]
    Fetch -->|Error| ShowErr["Show connection error"]
    Display --> Edit["User edits values"]
    Edit --> Save{"Save?"}
    Save --> Validate["Validate inputs"]
    Validate -->|Valid| Persist["Save to store + localStorage"]
    Validate -->|Invalid| ShowValidation["Show inline errors"]
```

Explanation: The Settings modal uses useSettings hook to read/write the Zustand settings store. "Test Connection" sends a HEAD/GET request to Ollama's /api/tags endpoint. On success, it populates the model dropdown with available models. Validation ensures URL is valid HTTP/HTTPS format and model name is not empty. Settings persist to localStorage via Zustand's persist middleware.

---

11. Conversation Management: New, Switch, Delete

```mermaid
stateDiagram-v2
    [*] --> List: Sidebar
    List --> New: "New Chat" button
    New --> Active: Create ID, set current
    List --> Switch: Click existing chat
    Switch --> Active: Load conversation
    Active --> Delete: Delete button
    Delete --> List: Remove and pick next
```

Explanation: All conversations are stored in store/chat.tsx as Record<string, Conversation>. The active conversation's ID (currentConversationId) determines which data is displayed. "New Chat" creates a UUID, sets title "New Chat", and optionally triggers the greeting rule. Switching chats only changes the active ID. Deleting removes from store and localStorage, then switches to the nearest remaining conversation.

---

12. Chat History: Storage & Retrieval

```mermaid
flowchart LR
    Send["User sends message"] --> AddUser["Add user ChatMessage to store"]
    AddUser --> Process["Orchestrator processes"]
    Process --> AddAsst["Add assistant ChatMessage"]
    AddAsst --> Render["<MessageList> re‑renders"]
    OpenOld["User opens old chat"] --> Get["Retrieve conversation from store"]
    Get --> Render
```

Explanation: Messages are rendered in MessageList.tsx via MessageBubble.tsx. Store updates trigger re-renders only for the active conversation via Zustand selectors. Old chats are never fetched from a server; they are loaded from localStorage on startup and stored in the Zustand store.

---

13. Settings Toggles: Show Process Log / Thinking

```mermaid
flowchart TD
    ThinkStep["New thinking step"] --> ShowThink{"showThinking?"}
    ShowThink -->|Yes| RenderThinking["Display in ThinkingBox"]
    ShowThink -->|No| HideThinking["Store only"]
    LogEntry["Process log event"] --> ShowLog{"showProcessLog?"}
    ShowLog -->|Yes| RenderLog["Show in ActivityLog panel"]
    ShowLog -->|No| HideLog["Skip rendering"]
```

Explanation: Two Zustand selectors conditionally render ThinkingBox and ActivityLog components. Data is always recorded; toggles only affect visibility. Both settings default to true and are controlled from Settings > Capabilities panel.

---

14. Model Selection: Refresh List

```mermaid
flowchart TD
    Refresh["User clicks Refresh"] --> Fetch["GET {baseUrl}/api/tags"]
    Fetch --> Parse["Parse JSON array"]
    Parse --> Update["Save available models to store"]
    Update --> Dropdown["<ModelSelector> re‑renders dropdown"]
    Select["User picks model"] --> Save["Save to settings"]
```

Explanation: The useModels hook fetches and stores the model list from Ollama's /api/tags. ModelSelector displays a searchable dropdown. Users can also type a custom model name and click "+" to add it to customModels. Selected model is saved to settings and localStorage.

---

15. Cancel / Stop Response

```mermaid
flowchart TD
    StopBtn["User clicks Stop"] --> Dispatch["dispatch(STOP_RESPONSE)"]
    Dispatch --> Abort["controller.abort()"]
    Abort --> Mark["Set status 'cancelled'"]
    Mark --> RemovePartial["Remove incomplete ThinkingSteps"]
    RemovePartial --> ShowMsg["Show 'Response cancelled' system message"]
```

Explanation: The ChatInput component renders a Stop button (square icon) only when isStreaming is true. Clicking dispatches STOP_RESPONSE, which calls AbortController.abort(), marks the conversation as cancelled, removes incomplete thinking steps, and restores the Send button.

---

16. Copy Message

```mermaid
flowchart TD
    CopyBtn["User clicks Copy icon"] --> GetText["Get message content (plain text)"]
    GetText --> Clipboard["navigator.clipboard.writeText()"]
    Clipboard -->|OK| Toast["Show 'Copied!' toast"]
    Clipboard -->|Fail| ToastErr["Show 'Failed to copy'"]
```

Explanation: Implemented in MessageBubble.tsx. Markdown is stripped before copying. Uses the modern async Clipboard API with a fallback to document.execCommand('copy') for older browsers.

---

17. Retry Message

```mermaid
flowchart TD
    RetryBtn["User clicks Retry"] --> GetLastUser["Find last user message"]
    GetLastUser --> RemoveAsst["Remove assistant response from store"]
    RemoveAsst --> Resend["dispatch(USER_INPUT) with same content"]
```

Explanation: Retry replaces the last assistant message with a fresh generation. The original user prompt is re-sent exactly as before. The Orchestrator processes it as a new input, and the LLM may generate a different response.

---

18. Edit & Resend Message

```mermaid
flowchart TD
    EditBtn["User clicks Edit"] --> InlineEdit["Message turns into textarea"]
    InlineEdit --> Modify["User edits text"]
    Modify --> Submit["Press Resend"]
    Submit --> Update["Update user message in store"]
    Update --> Truncate["Delete all messages after edited one"]
    Truncate --> Resend["dispatch(USER_INPUT) with new text"]
```

Explanation: Editing a user message turns it into an editable textarea. On resend, the user message is updated in the store, all subsequent messages are deleted (to maintain conversation consistency), and a new USER_INPUT is dispatched with the corrected text.

---

19. Qwen3 Thinking & Vision Integration

```mermaid
flowchart TD
    Detect["Detect model from Settings.model"] --> IsQwen{"Contains 'qwen'?"}
    IsQwen -->|Yes| Set["Set thinkingFormat = 'qwen3'"]
    IsQwen -->|No| Default["Default ReAct format"]
    Set --> Instruct["Add 'Use reasoning before answering' to prompt"]
    Instruct --> Vision{"Vision supported? (9b‑opus)"}
    Vision -->|Yes| AddImg["Allow image input in prompt"]
    Vision -->|No| Done["Done"]
```

Explanation: Model-specific adaptations are injected into the prompt's ModelSpecific block. For Qwen3-based models (nexusriot/qwen3.5-opus-distil:9b), an instruction encourages native reasoning with 思考/回答 tags. Vision capability allows image uploads via QuestionForm.tsx, which base64-encodes images and includes them in the Ollama request's images field.

---

End of flow-7.md. Continued in flow-8.md (Utilities & Advanced Features).