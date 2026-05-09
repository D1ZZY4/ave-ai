flow-13.md — Replit-Style Thinking Flow & AI Storage Architecture

---

1. Replit-Style Thinking Flow (Step-by-Step Reasoning)

```mermaid
sequenceDiagram
    participant U as User
    participant O as Orchestrator
    participant L as LLM (Ollama)
    participant T as Tool Executor
    participant S as Store (Zustand)
    participant UI as ThinkingBox UI

    U->>O: "Buatkan laporan dari sales.csv"
    O->>L: Prompt + tools schema

    Note over L: Internal Reasoning #1
    L-->>O: Thought: "Perlu membaca file dulu"
    O->>S: dispatch appendThinkingStep({ thought })
    S->>UI: Typewriter: "Perlu membaca file dulu"

    L-->>O: Action: read_file("sales.csv")
    O->>S: dispatch updateThinkingStep({ action })
    S->>UI: Spinner + "read_file"

    O->>T: execute(read_file)
    T-->>O: Result: "isi file 100 baris"
    O->>S: dispatch updateThinkingStep({ observation })
    S->>UI: Tampilkan observation

    Note over L: Internal Reasoning #2
    L-->>O: Thought: "Hitung statistik penjualan"
    O->>S: dispatch appendThinkingStep({ thought })

    L-->>O: Action: calculator("avg(kolom)")
    O->>T: execute(calculator)
    T-->>O: Result: 42.5
    O->>S: dispatch updateThinkingStep({ observation })

    Note over L: Internal Reasoning #3
    L-->>O: Thought: "Buat visualisasi chart"
    L-->>O: Action: create_chart(data, "bar")
    O->>T: execute(create_chart)
    T-->>O: Result: base64 PNG
    O->>S: dispatch updateThinkingStep({ observation })

    Note over L: Final
    L-->>O: Final Answer: "Rata-rata 42.5, grafik terlampir"
    O->>S: dispatch setFinalAnswer
    S->>UI: Sembunyikan thinking box, tampilkan jawaban
```

Explanation:

· Complete step-by-step reasoning flow matching Replit Agent behavior.
· Each Thought is streamed character-by-character via typewriter effect (see flow-9 #10 for animation internals).
· Tool calls display a pulsing spinner until observation arrives (see flow-1 #5 for execution loop, flow-1 #6 for ReActLoop state machine).
· Loop continues until LLM emits final_answer flag (see flow-1 #5 for stopping conditions).
· All steps logged to Zustand store via appendThinkingStep and updateThinkingStep actions (see flow-9 #1 for chat store actions, flow-6 #15 for thinking helper).

---

2. AI Agent Storage Architecture

```mermaid
graph TB
    subgraph AgentFS["agents/.agent-fs/"]
        Workspace["workspace/ — Temporary session files"]
        Uploads["uploads/ — User uploaded files (persistent)"]
        Cache["cache/ — Disk-based tool result cache"]
        Data["data/ — Reference data & templates (read-only)"]
    end

    subgraph ToolsAccess["Tool Access by Folder"]
        ReadFile["read-file: workspace/, uploads/, data/"]
        WriteFile["write-file: workspace/, uploads/"]
        PDF["pdf: reads uploads/, writes workspace/"]
        WebDownload["web-downloader: saves to workspace/"]
        Calculator["calculator, count, current-time: no filesystem access"]
    end

    Workspace --> WorkspaceLifecycle["Created at session start, cleaned on session end"]
    Uploads --> UploadsLifecycle["Persists across sessions, user-managed"]
    Cache --> CacheLifecycle["TTL-based expiration from rules/tools.ts"]
    Data --> DataLifecycle["Static read-only reference files"]

    RulesEngine["Rules Engine (flow-1 #7, flow-2 #19)"] -.->|allowedPaths| AgentFS
    RulesEngine -.->|maxFileSizeBytes| AgentFS
    RulesEngine -.->|allowedExtensions| AgentFS
```

Explanation:

· AI agent requires dedicated filesystem access scoped by folder purpose.
· workspace/: Ephemeral — created on first tool use, archived/cleaned after conversation ends (see flow-8 #2 for session cleanup).
· uploads/: Persistent — user files remain across sessions, accessible via read-file tool (see flow-3 #22 for read-file handler).
· cache/: Disk-based complement to in-memory cache (see flow-6 #2 for cache helper); TTL from rules/tools.ts (see flow-2 #19).
· data/: Read-only templates and reference files.
· All paths validated against allowedPaths in Rules Engine before any tool execution (see flow-1 #5 Gate 2 Pre-Approval).

---

3. File Upload & AI Processing Flow

```mermaid
flowchart TD
    Upload["User uploads file via QuestionForm (flow-11 #4)"] --> Validate["Validate: extension + size"]
    Validate -->|"Invalid"| Reject["Show error toast"]
    Validate -->|"Valid"| Save["Save to agents/.agent-fs/uploads/"]
    Save --> Notify["Add to LLM context: file path + metadata"]
    Notify --> LLMRead["LLM calls read-file with path"]
    LLMRead --> Process["AI processes: read → analyze → transform"]
    Process --> WriteResult["Write results to workspace/"]
    WriteResult --> OfferDownload["Optional: user downloads result"]

    ToolsUsed["Tools involved"] --> ReadFileTool["read-file (flow-3 #22)"]
    ToolsUsed --> WriteFileTool["write-file (flow-3 #23)"]
    ToolsUsed --> PDFTool["pdf (flow-3 #21)"]
    ToolsUsed --> WebDownload["web-downloader (flow-4 #8)"]

    RulesApplied["Rules applied"] --> AllowedExtensions[".csv, .json, .txt, .pdf, .png, .jpg"]
    RulesApplied --> MaxSize["maxFileSizeBytes: 10485760 (10MB)"]
```

Explanation:

· File upload starts from QuestionForm component (see flow-11 #4 for image/voice upload UI).
· Validation checks extension against allowedExtensions and size against maxFileSizeBytes from rules/tools.ts (see flow-2 #19).
· Uploaded file path is injected into LLM context so it can reference the file in tool calls.
· AI processes files using standard tools (read-file, write-file, pdf, web-downloader) — all documented in flow-3 and flow-4.
· Results are written to workspace/ and optionally offered for download by the user.

---

4. Storage Folder Lifecycle

```mermaid
stateDiagram-v2
    [*] --> AppStart: App initializes

    state AppStart {
        [*] --> CheckWorkspace: Check if workspace/ exists
        CheckWorkspace --> CreateWorkspace: If not, create empty folder
        CreateWorkspace --> CheckUploads: Check if uploads/ exists
        CheckUploads --> CreateUploads: If not, create empty folder
        CreateUploads --> CheckCache: Check if cache/ exists
        CheckCache --> CreateCache: If not, create empty folder
        CreateCache --> CheckData: Check if data/ exists
        CheckData --> CreateData: If not, create with defaults
        CreateData --> Ready: All folders ready
    }

    Ready --> SessionActive: User starts conversation

    state SessionActive {
        [*] --> CleanWorkspace: Clean expired cache entries
        CleanWorkspace --> Working: AI uses workspace/ for temp files
        Working --> EndSession: Conversation ends
        EndSession --> Archive: Archive workspace/ contents (optional)
        Archive --> CleanWorkspace2: Clear workspace/ for next session
    }

    SessionActive --> AppShutdown: User closes app
    AppShutdown --> PersistState: Save to localStorage + IndexedDB
```

Explanation:

· Folders are created at application startup if they don't exist (see flow-7 #2 for app initialization).
· workspace/ is cleaned at the start of each new conversation.
· cache/ entries are pruned based on TTL from rules/tools.ts (see flow-2 #19).
· uploads/ and data/ persist across sessions without automatic cleanup.
· On app shutdown, state is persisted to localStorage and IndexedDB (see flow-7 #8 for offline detection, flow-9 #1-2 for store persistence).

---

5. Tool Access Control Matrix

```mermaid
graph TB
    subgraph AccessMatrix["Access Control Matrix"]
        direction TB
        Rows["Tool → Folder Permissions"]
        R1["read-file: workspace/ ✅ | uploads/ ✅ | data/ ✅ | cache/ ❌"]
        R2["write-file: workspace/ ✅ | uploads/ ✅ | data/ ❌ | cache/ ❌"]
        R3["pdf (read): uploads/ ✅ | data/ ✅ / (write): workspace/ ✅"]
        R4["web-downloader: workspace/ ✅ only"]
        R5["web-fetcher: no filesystem access"]
        R6["calculator/count/time: no filesystem access"]
    end

    RulesEngineCheck["Rules Engine (flow-1 #7)"] -->|"Pre-approval Gate 2"| AccessMatrix
    AccessMatrix -->|"Allow"| Execute["Tool executes"]
    AccessMatrix -->|"Deny"| Feedback["Denial reason → LLM re-thinks (flow-1 #5)"]
```

Explanation:

· Each tool has a defined access matrix specifying which folders it can read from and write to.
· The Rules Engine enforces these permissions at Gate 2 (Pre-Approval) — see flow-1 #5 and flow-1 #7.
· Denied access results in feedback to the LLM, which can then re-plan (self-correction, see flow-2 #9 agent.ts selfCorrection).
· This matrix is configured in rules/tools.ts (flow-2 #19) and enforced by the tool executor.

---

End of flow-13.md. This covers the Replit-style step-by-step thinking flow and the AI agent storage architecture with folder permissions. Continued in flow-14.md (System Hardening & Edge Cases).