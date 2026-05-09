flow-9.md — State, Hooks, Components & API Integration

This file provides detailed diagrams and explanations for Zustand stores, React hooks, component tree, key components, and API/library integration.

---

1. store/chat.tsx — Zustand Chat Store

```mermaid
graph TB
    ChatStore["chat.tsx"] --> Create["create(immer(persist(...)))"]
    Create --> Initial["initial: { conversations: {}, currentConversationId: null, isStreaming: false, error: null }"]
    Create --> Actions["actions: sendMessage, stopResponse, switchConversation, deleteConversation, newConversation, appendThinkingStep, updateThinkingStep, setFinalAnswer, retryMessage, editMessage"]
    Actions --> Send["sendMessage: add user msg → set streaming → call orchestrator"]
    Actions --> Stop["stopResponse: AbortController.abort() → mark cancelled → remove partial steps"]
    Actions --> Switch["switchConversation: set currentConversationId → load history"]
    Actions --> Delete["deleteConversation: remove from map → switch to nearest"]
    Actions --> New["newConversation: create UUID → set current → trigger greeting if enabled"]
    Actions --> AppendThink["appendThinkingStep: push step to conversation.thinkingSteps[]"]
    Actions --> UpdateThink["updateThinkingStep: merge observation into step by stepNumber"]
    Actions --> SetFinal["setFinalAnswer: add assistant msg → clear thinkingSteps → set streaming false"]
    Create --> Middleware["persist middleware: auto‑sync to localStorage"]
```

Explanation: The primary Zustand store manages all conversation state. Uses Immer middleware for immutable updates and persist middleware for automatic localStorage sync. conversations is a Record<string, Conversation> keyed by UUID. currentConversationId determines the active conversation. All actions are dispatched from useChat hook.

---

2. store/settings.tsx — Zustand Settings Store

```mermaid
graph TB
    SettingsStore["settings.tsx"] --> Create["create(persist(...))"]
    Create --> Initial["initial: { ollamaBaseUrl: 'http://localhost:11434', model: 'nexusriot/qwen3.5-opus-distil:9b', displayName: 'you', theme: 'system', showThinking: true, showProcessLog: true, enableThinking: true, enableTools: true, webEnabled: true, memoryEnabled: true, availableModels: [], customModels: [], modelReady: false }"]
    Create --> Actions["actions: updateSetting, testConnection, setTheme, refreshModels, clearAllData"]
    Actions --> Update["updateSetting: merge partial settings object"]
    Actions --> Test["testConnection: ping Ollama → update availableModels → set modelReady"]
    Actions --> SetTheme["setTheme: 'dark' | 'light' | 'system' → apply class to <html>"]
    Actions --> Refresh["refreshModels: GET /api/tags → update availableModels"]
    Actions --> Clear["clearAllData: reset store → clear localStorage → clear IndexedDB"]
    Create --> Middleware["persist middleware: auto‑sync to localStorage"]
```

Explanation: The settings store holds all user preferences. persist middleware automatically syncs to localStorage on every change. modelReady tracks whether the selected model is loaded in Ollama's memory. testConnection pings the Ollama server and populates availableModels. clearAllData performs a full reset.

---

3. hooks/useChat.ts — Primary Chat Hook

```mermaid
flowchart TD
    UseChat["useChat.ts"] --> Export["export function useChat()"]
    Export --> Selectors["Selectors: messages, thinkingSteps, isStreaming, error, conversationId"]
    Export --> Actions["Actions: sendMessage, stopResponse, switchConv, deleteConv, newConv, retryMessage, editMessage"]
    Send["sendMessage(text)"] --> AbortPrev["Abort previous controller if running"]
    AbortPrev --> Gate1["Gate 1: Safety check input (piiDetector, injectionDetector, toxicityAnalyzer)"]
    Gate1 -->|"Blocked"| ReturnError["Return error to UI"]
    Gate1 -->|"Clean"| LoadPersona["Load active persona + memory facts"]
    LoadPersona --> BuildPrompt["Build prompt: system + rules + tools + memory + format"]
    BuildPrompt --> Fetch["POST to Ollama via helpers/ollama.ts (stream: true)"]
    Fetch --> ParseLoop["Parse NDJSON stream via helpers/parse-response-to-ui.ts"]
    ParseLoop -->|"thought"| DispatchThought["dispatch appendThinkingStep"]
    ParseLoop -->|"tool_call"| Gate2["Gate 2: Pre‑approval (Rules Engine)"]
    Gate2 -->|"Denied"| Feedback["Send denial reason to LLM → continue loop"]
    Gate2 -->|"Approved"| Execute["Execute tool/skill/web handler"]
    Execute --> Gate3["Gate 3: Post‑check result"]
    Gate3 -->|"Blocked"| Filter["Filter result"]
    Gate3 -->|"Clean"| DispatchObs["dispatch updateThinkingStep (observation)"]
    ParseLoop -->|"final"| Finalize["dispatch setFinalAnswer → extract memory → save history"]
```

Explanation: The heart of the application. useChat wires user input through the full execution loop: safety validation, persona/memory loading, prompt building, Ollama streaming, response parsing, rule evaluation, tool execution, and store updates. Returns { messages, thinkingSteps, isStreaming, error, sendMessage, stopResponse, switchConv, deleteConv, newConv, retryMessage, editMessage }.

---

4. hooks/useThinking.ts — Thinking Step Selector

```mermaid
graph TB
    UseThinking["useThinking.ts"] --> Export["export function useThinking()"]
    Export --> Selector["Selector: state => state.conversations[state.currentConversationId]?.thinkingSteps || []"]
    Selector --> Filter["Filter: only steps belonging to current conversation"]
    Filter --> Return["Return: { steps: ThinkingStep[], isStreaming: boolean }"]
    Export --> Memoized["Memoized: selector equality check prevents unnecessary re‑renders"]
```

Explanation: A lightweight Zustand selector hook that filters the thinkingSteps array for the active conversation. Returns the steps array and the current streaming status. Used by the ThinkingBox component for real‑time rendering.

---

5. hooks/useModels.ts — Model Management Hook

```mermaid
graph TB
    UseModels["useModels.ts"] --> Export["export function useModels()"]
    Export --> State["State: { availableModels: Model[], isLoading: boolean, error: string | null }"]
    Export --> Actions["Actions: refreshModels, testConnection, selectModel, addCustomModel"]
    Actions --> Refresh["refreshModels: GET {baseUrl}/api/tags → parse → update store"]
    Actions --> Test["testConnection: GET {baseUrl}/api/tags → return { ok, models } → update modelReady"]
    Actions --> Select["selectModel: dispatch updateSetting('model', name)"]
    Actions --> AddCustom["addCustomModel: push to customModels → select it"]
```

Explanation: Manages fetching and caching the available Ollama models list. testConnection also sets the modelReady flag in the settings store. addCustomModel allows users to type a model name not yet pulled.

---

6. hooks/use-mobile.tsx & hooks/use-toast.ts

```mermaid
graph TB
    UseMobile["use-mobile.tsx"] --> ExportMobile["export function useMobile()"]
    ExportMobile --> MediaQuery["Media query: '(max-width: 768px)' via matchMedia"]
    MediaQuery --> Listener["Listener: updates isMobile on change"]
    Listener --> ReturnMobile["Return: { isMobile: boolean }"]

    UseToast["use-toast.ts"] --> ExportToast["export function useToast()"]
    ExportToast --> State["State: { toasts: Toast[] }"]
    ExportToast --> Actions["Actions: toast({ title, description, variant }), dismiss(id), dismissAll()"]
    Actions --> AutoDismiss["Auto‑dismiss: setTimeout → remove toast after duration"]
```

Explanation: useMobile detects screen width ≤ 768px for responsive UI (sidebar becomes drawer). useToast manages a queue of toast notifications with auto‑dismiss timers. Used by Copy, Save, and error feedback across the app.

---

7. Component Tree — Full Hierarchy

```mermaid
graph TB
    App["App.tsx"] --> Providers["ThemeProvider + StoreProvider + Router"]
    Providers --> Layout["Layout Wrapper"]
    Layout --> Header["Header.tsx"]
    Layout --> Sidebar["Sidebar.tsx"]
    Layout --> Pages["Pages"]
    Pages --> ChatPage["Chat.tsx"]
    Pages --> HomePage["Home.tsx"]
    Pages --> NotFound["not-found.tsx"]
    ChatPage --> MessageList["MessageList.tsx"]
    ChatPage --> ThinkingBox["ThinkingBox.tsx"]
    ChatPage --> ChatInput["ChatInput.tsx"]
    ChatPage --> ChoiceCards["ChoiceCards.tsx"]
    ChatPage --> ActivityLog["ActivityLog.tsx"]
    Header --> ModelSelector["ModelSelector.tsx"]
    Header --> PersonaSelector["PersonaSelector.tsx"]
    Header --> TokenBar["Token Progress Bar"]
    Sidebar --> SearchBar["Search Input"]
    Sidebar --> ConversationList["Conversation Items"]
    Sidebar --> NewChatBtn["New Chat Button"]
    App --> GlobalModals["Global Modals"]
    GlobalModals --> SettingsModal["settings/SettingsModal.tsx"]
    GlobalModals --> SkillsModal["skills/SkillsModal.tsx"]
    GlobalModals --> ToolsModal["tools/ToolsModal.tsx"]
    GlobalModals --> WebModal["web/WebModal.tsx"]
    GlobalModals --> HistoryModal["history/HistoryModal.tsx"]
    SettingsModal --> ConnectionPanel["Connection.tsx"]
    SettingsModal --> CapabilitiesPanel["Capabilities.tsx"]
    SettingsModal --> PersonasPanel["Personas.tsx"]
    SettingsModal --> SkillsPanel["Skills.tsx"]
```

Explanation: The component tree is rooted at App.tsx. Global providers (theme, store, router) wrap the layout. The main Chat.tsx page composes MessageList, ThinkingBox, ChatInput, ChoiceCards, and ActivityLog. Five global modals are available from any view: Settings (with tabs for Connection, Capabilities, Personas, Skills), Skills, Tools, Web, and History.

---

8. ChatInput.tsx — Component Behavior

```mermaid
flowchart TD
    Render["ChatInput renders"] --> Mode{"isStreaming?"}
    Mode -->|Yes| ShowStop["Show Stop button (square icon)"]
    Mode -->|No| ShowSend["Show Send button (arrow icon)"]
    UserType["User types"] --> AutoResize["Textarea auto‑resizes up to 5 lines"]
    Submit["Enter (without Shift)"] --> Validate["Check text.trim().length > 0"]
    Validate -->|Valid| Dispatch["dispatch(sendMessage(text))"]
    Validate -->|Empty| Ignore["Ignore"]
    Stop["User clicks Stop"] --> DispatchStop["dispatch(stopResponse())"]
    AttachBtn["User clicks Attach"] --> FilePicker["Open file picker or voice recorder"]
```

Explanation: The input area is a textarea that grows up to 5 lines. Enter sends the message; Shift+Enter inserts a newline. The Stop button is only visible during streaming. An attach button allows file/image uploads and voice recording.

---

9. MessageBubble.tsx — Rendering & Actions

```mermaid
flowchart TD
    Msg["Message object"] --> Bubble["Render bubble (user: right, assistant: left)"]
    Bubble --> Markdown["Render Markdown via react‑markdown"]
    Markdown --> Plugins["Plugins: code blocks (syntax highlight), tables, lists, bold/italic"]
    Bubble --> HoverActions["Hover: show action icons"]
    HoverActions --> Copy["Copy: strip Markdown, copy plain text to clipboard"]
    HoverActions --> Retry["Retry (assistant only): regenerate response"]
    HoverActions --> Edit["Edit (user only): turn bubble into editable textarea"]
    Bubble --> Timestamp["Show relative timestamp (e.g., '2 min ago')"]
```

Explanation: Each message bubble renders Markdown content with syntax‑highlighted code blocks, tables, and formatting. Hover reveals action buttons: Copy (all messages), Retry (assistant messages to regenerate), and Edit (user messages to correct and resend). Timestamps use relative formatting.

---

10. ThinkingBox.tsx — Animation Internals

```mermaid
flowchart TD
    NewStep["New step arrives from useThinking hook"] --> Typewriter["Typewriter effect: character‑by‑character using setInterval(30ms)"]
    Typewriter --> CheckObs{"Has observation?"}
    CheckObs -->|No| ShowSpinner["Pulsing spinner next to Action"]
    CheckObs -->|Yes| ShowComplete["Show full step with Observation"]
    ShowComplete --> CheckFinal{"finalAnswer received?"}
    CheckFinal -->|Yes| SlideUp["Slide‑up animation, hide box"]
    CheckFinal -->|No| WaitNext["Wait for next step"]
    ShowSpinner --> WaitNext
    AutoScroll["Auto‑scroll to bottom on new step"] --> Container["Container: max‑height with overflow‑y scroll"]
```

Explanation: The ThinkingBox uses a typewriter effect (character‑by‑character rendering at 30ms intervals) for the thought text. While awaiting an observation, a pulsing spinner is shown next to the action. Auto‑scroll ensures the latest step is always visible. When the final answer arrives, the box slides up and disappears.

---

11. Sidebar.tsx — Conversation List

```mermaid
flowchart TD
    Sidebar["Sidebar.tsx"] --> Responsive{"isMobile? (useMobile hook)"}
    Responsive -->|Yes| Drawer["Drawer: slide from left, overlay"]
    Responsive -->|No| Permanent["Permanent: fixed left panel, 280px wide"]
    Sidebar --> Header["Header: 'Flow Ave AI' + menu button"]
    Sidebar --> Search["Search bar: filter conversations by title/content"]
    Sidebar --> List["List: conversations sorted by updatedAt DESC"]
    List --> Item["Each item: title, last message snippet, timestamp"]
    Item --> Click["Click: switchConversation(id)"]
    Item --> DeleteMenu["Right‑click or long‑press: delete option"]
    Sidebar --> NewBtn["'New Chat' button at top (always visible)"]
```

Explanation: The sidebar provides conversation management. On mobile, it becomes a swipeable drawer. Conversations are sorted by most recent activity. Each item shows title, last message preview, and relative timestamp. Right‑click or long‑press reveals a delete option. A persistent "New Chat" button is at the top.

---

12. SettingsModal.tsx — Structure

```mermaid
graph TB
    Modal["SettingsModal.tsx"] --> Tabs["Tabs: Connection, Capabilities, Personas, Skills"]
    Tabs --> Connection["Connection.tsx"]
    Connection --> BaseUrl["Input: Ollama Base URL"]
    Connection --> ModelDropdown["Dropdown: Model (from useModels)"]
    Connection --> DisplayName["Input: Display Name"]
    Connection --> TestBtn["'Test Connection' button"]
    Tabs --> Capabilities["Capabilities.tsx"]
    Capabilities --> ToggleEnableThinking["Toggle: Enable Thinking"]
    Capabilities --> ToggleEnableTools["Toggle: Enable Tools"]
    Capabilities --> ToggleWebEnabled["Toggle: Web Enabled"]
    Capabilities --> ToggleMemoryEnabled["Toggle: Memory Enabled"]
    Capabilities --> ToggleShowThinking["Toggle: Show Thinking"]
    Capabilities --> ToggleShowLog["Toggle: Show Process Log"]
    Tabs --> Personas["Personas.tsx"]
    Personas --> PersonaList["List all personas with descriptions"]
    Personas --> EditPrompt["Edit system prompt override per persona"]
    Tabs --> Skills["Skills.tsx"]
    Skills --> SkillList["List installed skills with enable/disable toggles"]
```

Explanation: The Settings modal uses a tabbed interface. Connection configures the Ollama server. Capabilities toggles features (thinking, tools, web, memory) and UI settings (show thinking, show log). Personas allows browsing and customizing system prompts. Skills lists installed skills with enable/disable toggles.

---

13. lib/api-client-react/ — Auto‑Generated Fetch Client

```mermaid
graph LR
    ApiClient["lib/api-client-react/"] --> Src["src/"]
    Src --> CustomFetch["custom-fetch.ts: base fetch wrapper with error handling"]
    Src --> Index["index.ts: barrel export"]
    Src --> Generated["generated/api.ts: typed API functions from OpenAPI spec"]
    Generated --> Orval["Generated by Orval from api-spec/openapi.yaml"]
    Orval --> Hooks["(Optional) TanStack Query hooks for React"]
```

Explanation: An auto‑generated typed fetch client created by Orval from the OpenAPI specification. custom-fetch.ts provides a configured fetch instance with base URL, headers, and error handling. In the local‑only setup, this can be replaced by direct Ollama calls, but it's available for optional backend proxy usage.

---

14. backend/ — Optional API Server

```mermaid
graph TB
    Backend["backend/"] --> Build["build.mjs: ESBuild bundling script"]
    Backend --> Src["src/"]
    Src --> App["app.ts: Express/Hono app setup"]
    Src --> Index["index.ts: server entry point"]
    Src --> Routes["routes/"]
    Routes --> Health["health.ts: GET /health → { status: 'ok' }"]
    Routes --> OllamaRoute["ollama.ts: proxy /api/generate → Ollama"]
    Routes --> IndexRoute["index.ts: route aggregator"]
    Src --> Middlewares["middlewares/"]
    Src --> Lib["lib/logger.ts: Pino structured logger"]
    OllamaRoute --> AddLogging["Add logging: request method, URL, response time"]
    OllamaRoute --> AddCSP["Add CSP headers: default-src 'self'; connect-src ollamaBaseUrl"]
    OllamaRoute --> RateLimit["Optional: rate limiting per IP"]
    OllamaRoute --> Proxy["Proxy: forward request body to Ollama, stream response back"]
```

Explanation: An optional backend proxy server built with Express or Hono. It adds structured logging (Pino), Content‑Security‑Policy headers, and optional rate limiting. The /api/generate route proxies requests to Ollama, streaming responses back to the frontend. This is useful when direct browser‑to‑Ollama CORS is not feasible.

---

15. lib/db/ — Optional Database Schema

```mermaid
graph LR
    DB["lib/db/"] --> Config["drizzle.config.ts: Drizzle ORM configuration"]
    DB --> Src["src/"]
    Src --> IndexDB["index.ts: database connection"]
    Src --> Schema["schema/index.ts"]
    Schema --> ConversationsTable["conversations: { id, title, personaId, mode, createdAt, updatedAt }"]
    Schema --> MessagesTable["messages: { id, conversationId, role, content, timestamp }"]
    Schema --> FactsTable["memory_facts: { key, value, timestamp, confidence }"]
```

Explanation: A Drizzle ORM schema for optional server‑side persistence using PostgreSQL. Currently unused in the local‑only version (which uses IndexedDB via helpers/storage.ts), but available for future server‑based deployments. Tables mirror the client‑side data structures.

---

16. Zustand Store Shape — Complete AgentState

```mermaid
graph TB
    AgentState["AgentState"] --> Conversations["conversations: Record<string, Conversation>"]
    AgentState --> CurrentId["currentConversationId: string | null"]
    AgentState --> Streaming["isStreaming: boolean"]
    AgentState --> Error["error: string | null"]
    AgentState --> Settings["settings: Settings"]
    Conversations --> ConvShape["Conversation { id, title, personaId, mode, messages: ChatMessage[], thinkingSteps: ThinkingStep[], createdAt, updatedAt }"]
    Settings --> SettingsShape["Settings { ollamaBaseUrl, model, displayName, theme, showThinking, showProcessLog, enableThinking, enableTools, webEnabled, memoryEnabled, availableModels, customModels, modelReady }"]
```

Explanation: The complete Zustand store shape combining both chat.tsx and settings.tsx. conversations is keyed by UUID. All state is automatically persisted to localStorage via Zustand's persist middleware.

---

17. useChat Hook — Full Internal Flow

```mermaid
flowchart TD
    Hook["useChat()"] --> ReturnAPI["Returns: { messages, thinkingSteps, isStreaming, error, sendMessage, stopResponse, ... }"]
    ReturnAPI --> SendMsg["sendMessage(text, conversationId)"]
    SendMsg --> CheckConv["If no conversationId → create new conversation first"]
    CheckConv --> AbortPrev["If isStreaming → AbortController.abort() for this conversationId"]
    AbortPrev --> NewController["Create new AbortController → store in Map"]
    NewController --> AddUserMsg["dispatch: add user ChatMessage to store"]
    AddUserMsg --> Gate1["Gate 1: safety check input"]
    Gate1 -->|"Blocked"| ErrorReturn["dispatch: setError, setStreaming false"]
    Gate1 -->|"Clean"| LoadContext["Load persona + memory facts + rules"]
    LoadContext --> BuildPrompt["Assemble prompt: System + Rules + Tools + Format + Memory + History + UserMsg"]
    BuildPrompt --> POST["POST to Ollama: helpers/ollama.ts → async generator"]
    POST --> StreamLoop["For each yielded chunk:"]
    StreamLoop -->|"thought"| ThoughtUpdate["dispatch: appendThinkingStep({ stepNumber, thought })"]
    StreamLoop -->|"action"| ActionUpdate["dispatch: updateThinkingStep({ action, actionInput })"]
    ActionUpdate --> Gate2["Gate 2: pre‑approve action"]
    Gate2 -->|"Denied"| FeedbackLLM["Send denial + reason as new prompt → continue streaming"]
    Gate2 -->|"Approved"| ExecuteTool["Execute tool/skill/web handler"]
    ExecuteTool --> Gate3["Gate 3: post‑check result"]
    Gate3 -->|"Blocked"| FilterResult["Filter/redact result"]
    Gate3 -->|"Clean"| ObsUpdate["dispatch: updateThinkingStep({ observation })"]
    StreamLoop -->|"final"| Finalize["dispatch: setFinalAnswer → add assistant msg → clear steps → setStreaming false"]
    Finalize --> ExtractMemory["If memoryEnabled → extract facts via LLM → save to IndexedDB"]
    ExtractMemory --> Done["Done"]
```

Explanation: The complete internal flow of useChat, showing every step from message dispatch through safety gates, context loading, prompt assembly, streaming, rule evaluation, tool execution, finalization, and memory extraction. AbortControllers are managed per conversation to prevent race conditions.

---

End of flow-9.md. Continued in flow-10.md (Testing, Build, Dependencies, Internationalization, Telemetry, Roadmap).