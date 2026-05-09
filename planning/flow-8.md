flow-8.md — Advanced Features & Utilities

This file provides detailed diagrams and explanations for model loading, shutdown, voice/image input, token display, search, export, shortcuts, theme, notifications, customization, health check, token control, Skills.sh integration, and memory system.

---

1. Model Loading & Warm‑up

```mermaid
flowchart TD
    FirstCall["First input in session"] --> Check{"modelReady in store?"}
    Check -->|No| ShowSpinner["UI: 'Loading model...'"]
    ShowSpinner --> Warm["Send minimal prompt to Ollama"]
    Warm -->|Response| SetReady["modelReady = true"]
    SetReady --> Proceed["Process real input"]
    Warm -->|Timeout| PullPrompt["Offer to pull model"]
    PullPrompt --> Pull["Pull via Ollama API (stream progress)"]
    Pull --> Warm
```

Explanation: Before the first real user message, a tiny warm‑up request ensures the model is loaded into GPU/RAM. If the model is missing, the UI suggests pulling it via Ollama's API, streaming download progress. Once loaded, the modelReady flag is set and subsequent requests skip warm‑up.

---

2. Graceful Shutdown & Cleanup

```mermaid
flowchart TD
    BeforeUnload["beforeunload event"] --> Save["Persist current conversation to localStorage"]
    Save --> Abort["Abort all AbortControllers"]
    Abort --> ClearTimers["Clear intervals/timeouts"]
    ClearTimers --> Exit["Tab closes"]
```

Explanation: The useChat hook registers a beforeunload listener that saves the current conversation state, aborts any pending requests (prevents dangling connections), and clears timers to prevent memory leaks. When the tab reopens, conversations are restored from localStorage.

---

3. Voice & Image Input

```mermaid
flowchart TD
    Mic["User taps Mic icon"] --> Record["MediaRecorder API"]
    Record --> Stop["Stop & get blob"]
    Stop --> STT["Send to Whisper / SpeechRecognition"]
    STT --> InsertText["Insert transcript into input"]
    Image["User taps Image icon"] --> Pick["File picker (camera/gallery)"]
    Pick --> Encode["Convert to base64"]
    Encode --> Attach["Attach to message.images"]
```

Explanation: Voice input uses the browser's MediaRecorder API and sends audio to a Speech‑to‑Text endpoint (Whisper or browser SpeechRecognition). Image input opens a file picker, converts the image to base64, and attaches it to the message for Ollama's multimodal endpoint (supported by Qwen3.5‑opus).

---

4. Token Usage Display

```mermaid
flowchart TD
    Resp["LLM response received"] --> Tok["Extract eval_count"]
    Tok --> Update["conversation.totalTokens += eval_count"]
    Update --> Pct["Calculate % used"]
    Pct --> Bar["Update token progress bar in Header"]
    Bar --> Warn{"Usage > 80%?"}
    Warn -->|Yes| Yellow["Turn bar yellow, tooltip: 'Context nearly full'"]
    Warn -->|No| Normal["Normal display"]
```

Explanation: After each LLM response, the eval_count from Ollama is used to update the conversation's total token usage. A progress bar in the Header component shows consumption relative to the 65536 budget. When usage exceeds 80%, it changes color to yellow with a warning tooltip about impending compression.

---

5. Search in Chat History

```mermaid
flowchart TD
    Search["User types in sidebar search"] --> Filter["Filter conversations by title/content"]
    Filter --> Highlight["Highlight matches"]
    Click["User clicks result"] --> Jump["Open conversation & scroll to message"]
    Jump --> HighlightMsg["Brief yellow highlight on matched message"]
```

Explanation: The sidebar search performs case‑insensitive substring matching against conversation titles and message contents. Results are displayed instantly. Clicking a result opens the conversation and scrolls to the matching message with a brief highlight animation.

---

6. Export Conversation

```mermaid
flowchart TD
    ExportBtn["User clicks Export"] --> Menu{"Choose format: JSON, MD, PDF"}
    Menu -->|JSON| GenJSON["JSON.stringify(conversation)"]
    Menu -->|MD| GenMD["Convert messages to Markdown"]
    Menu -->|PDF| GenPDF["Generate PDF via jsPDF"]
    GenJSON --> Download["Trigger download"]
    GenMD --> Download
    GenPDF --> Download
```

Explanation: Export is available from the conversation context menu. JSON preserves full structured data including thinking steps. Markdown converts messages to a readable text format with role labels. PDF generates a printable document via jspdf with a simple text layout.

---

7. Keyboard Shortcuts

```mermaid
flowchart TD
    KeyDown["keydown event (global)"] --> Which{"Which key?"}
    Which -->|Enter| Send["Send message (unless Shift)"]
    Which -->|Shift+Enter| Newline["Insert newline"]
    Which -->|Escape| Cancel["Cancel response"]
    Which -->|Ctrl+K| FocusSearch["Focus sidebar search"]
    Which -->|Ctrl+N| NewChat["New conversation"]
```

Explanation: A global useEffect in App.tsx listens for keyboard events. Shortcuts are displayed in a small tooltip for discoverability. Enter sends the message; Shift+Enter inserts a newline. Escape cancels an ongoing response. Ctrl+K focuses the search bar; Ctrl+N creates a new conversation.

---

8. Dark Mode / Theme Switch

```mermaid
flowchart TD
    Load["App load"] --> Pref{"localStorage theme?"}
    Pref -->|dark| ApplyDark
    Pref -->|light| ApplyLight
    Pref -->|none| Sys{"prefers-color-scheme?"}
    Sys -->|dark| ApplyDark
    Sys -->|light| ApplyLight
    Toggle["User toggles switch"] --> Flip["Flip theme class on <html>"]
    Flip --> Store["Save to localStorage"]
```

Explanation: Theme is set on first load based on localStorage or the system preference (prefers-color-scheme). A toggle switch in the UI allows manual override and persists the choice. Tailwind's darkMode: 'class' applies the theme by toggling a dark class on the root HTML element.

---

9. Notifications (Sound/Vibrate)

```mermaid
flowchart TD
    Done["Response finishes"] --> Focus{"Tab focused?"}
    Focus -->|No| Notify["new Notification('Ave AI replied')"]
    Focus -->|Yes| Vibe["navigator.vibrate(200) if mobile"]
```

Explanation: When a response completes and the browser tab is not in focus, the Web Notification API fires an alert. On mobile, the Vibration API provides haptic feedback. Permission for notifications is requested on first use.

---

10. System Prompt Customization

```mermaid
flowchart TD
    OpenSettings["Settings > Persona"] --> EditOverrides["Edit textarea for system prompt overrides"]
    EditOverrides --> Save["Save to localStorage keyed by persona"]
    Save --> Apply["On next conversation, use overridden prompt"]
```

Explanation: Each persona's system prompt can be overridden by the user in the Settings > Personas panel. The custom prompt is stored in localStorage under personaOverride_{personaName}. The Orchestrator checks for an override before loading the default prompt, allowing fine‑tuning of AI behavior.

---

11. Ollama Health Check & Reconnect

```mermaid
flowchart TD
    BeforeCall["Before any Ollama call"] --> Ping["Quick HEAD to base URL"]
    Ping -->|OK| Proceed["Proceed with request"]
    Ping -->|Fail| Retry["Retry with exponential backoff"]
    Retry -->|Exhausted| UIErr["Show persistent error bar"]
    UIErr --> Manual["User can retry manually"]
```

Explanation: Before each series of requests, a lightweight health check verifies the Ollama server is reachable. If it fails, exponential backoff retries are attempted. After exhaustion, the UI shows a persistent red banner with a "Retry" button. This prevents silent failures and informs the user to check their connection.

---

12. Max Output Token Control

```mermaid
flowchart TD
    Build["Build Ollama request"] --> Options["Set num_predict = maxOutputTokens"]
    Options --> Val{"Value from global.ts"}
    Val -->|undefined| Default["Use 4096"]
    Val -->|number| Use["Use that"]
    Use --> Send["Send request"]
    Default --> Send
```

Explanation: The num_predict option caps the LLM's output length, preventing runaway generations that could slow UI rendering or exhaust the context window. The default is 4096 tokens, configurable via rules/global.ts.

---

13. Skills.sh Integration — Skill Discovery

```mermaid
flowchart TD
    UserSearch["User searches skill in SkillsModal"] --> Query["GET skills.sh/api/skills?q=term"]
    Query --> List["Display skill list with descriptions"]
    List --> Install{"User clicks Install"}
    Install --> Download["Download skill definition JSON"]
    Download --> Convert["Convert to Flow Ave Skill format"]
    Convert --> Cache["Cache in localStorage + skills/remote/"]
    Cache --> Register["Add to global Skill Registry"]
```

Explanation: The SkillsModal has a "Remote" tab that fetches skills from Skills.sh. Installed remote skills are cached locally for offline use. The conversion layer maps arbitrary skill JSON to the internal Skill interface. Remote skills pass through the same Rules Engine validation as local skills.

---

14. Skills.sh Integration — Hybrid Skill Registry

```mermaid
graph TB
    subgraph Registry["Global Skill Map"]
        Local["Local skills/"]
        Remote["Cached remote skills/"]
    end
    LLM["LLM tool_call"] --> Lookup["Registry.get(name)"]
    Lookup --> Local
    Lookup --> Remote
```

Explanation: The Registry is a unified Map containing both local and remote skills. Whether a skill originated locally or from Skills.sh, it is executed in the same sandbox with the same rules applied. LLM tool calls look up skills by name without needing to know the source.

---

15. Memory System — Folder Structure & Storage

```mermaid
graph TB
    subgraph MemoryFolder["src/memory/"]
        Index["index.ts (barrel)"]
        Types["types.ts (MemoryFact interface)"]
        Store["store.ts (IndexedDB wrapper)"]
        Extractor["extractor.ts (LLM‑based fact extraction)"]
        Retriever["retriever.ts (load facts for prompt)"]
    end
```

Explanation: The memory/ folder encapsulates all long‑term memory logic. store.ts provides CRUD operations on IndexedDB. extractor.ts sends a small LLM request to extract structured {key, value} facts from an assistant message. retriever.ts loads all facts and formats them for the system prompt.

---

16. Memory System — Fact Extraction Flow

```mermaid
flowchart TD
    Final["Assistant final answer"] --> ShouldExtract{"Extract facts? (store setting)"}
    ShouldExtract -->|Yes| Call["Small LLM call with extraction prompt"]
    Call --> Parse["Parse JSON array"]
    Parse --> Merge["Merge with existing facts (update or insert)"]
    Merge --> Save["Save to IndexedDB"]
    ShouldExtract -->|No| Skip["Skip"]
```

Explanation: Fact extraction can be toggled in Settings (memoryEnabled). It uses a tiny prompt like "Extract any user facts from this message as JSON {key, value}". Duplicate keys are updated with the latest value and timestamp.

---

17. Memory System — Prompt Injection

```mermaid
flowchart TD
    PrePrompt["Before building system prompt"] --> Load["Load user facts from memory"]
    Load --> Format["Format: 'Known user info: \n- name: John\n- job: developer'"]
    Format --> Inject["Prepend to system prompt"]
```

Explanation: Fact injection is performed by the Prompt Assembler. The Orchestrator calls memory/retriever.ts before every call to Ollama, loading all stored facts and prepending them to the system prompt as "Known user information: ..."

---

End of flow-8.md. Continued in flow-9.md (State, Hooks, Components, & API Integration).