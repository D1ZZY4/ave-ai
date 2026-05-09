flow-16.md — Parallel Task Execution & Archive Tools

---

1. Parallel Task Execution Architecture

```mermaid
flowchart TD
    UserInput["User sends complex request"] --> TaskAnalyzer["Task Analyzer: decompose into subtasks"]
    TaskAnalyzer --> IdentifyParallel{"Subtasks independent?"}
    IdentifyParallel -->|"Yes"| ParallelPool["Parallel Execution Pool"]
    IdentifyParallel -->|"No"| SequentialQueue["Sequential Queue (dependency chain)"]

    ParallelPool --> Worker1["Worker 1: Tool A"]
    ParallelPool --> Worker2["Worker 2: Tool B"]
    ParallelPool --> Worker3["Worker 3: Web Tool C"]
    Worker1 --> ResultAggregator["Result Aggregator"]
    Worker2 --> ResultAggregator
    Worker3 --> ResultAggregator
    
    SequentialQueue --> Step1["Step 1: Tool X"]
    Step1 --> Step2["Step 2: Tool Y (depends on X)"]
    Step2 --> Step3["Step 3: Tool Z (depends on Y)"]
    Step3 --> ResultAggregator

    ResultAggregator --> MergeLogic{"Merge strategy?"}
    MergeLogic -->|"Concatenate"| Merge1["Combine all results into one observation"]
    MergeLogic -->|"Summarize"| Merge2["LLM summarizes all results"]
    MergeLogic -->|"Delegated"| Merge3["Worker results stored separately"]
    
    Merge1 --> SendToLLM["Send combined observation to LLM"]
    Merge2 --> SendToLLM
    Merge3 --> SendToLLM
    SendToLLM --> ContinueReAct["LLM continues ReAct loop (flow-1 #5)"]
```

Explanation:

· Complex user requests are decomposed into subtasks by the Task Analyzer (see flow-1 #5 for main execution loop).
· Independent subtasks run in parallel via a worker pool; dependent tasks run sequentially.
· Results are aggregated using configurable merge strategies before being sent back to the LLM.
· Built on top of the ReAct loop architecture (see flow-1 #6 for state machine).
· Concurrent execution safety is enforced (see flow-14 #7 for concurrent tool execution).

---

2. Parallel Task Worker Pool

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant T as Task Analyzer
    participant W1 as Worker 1
    participant W2 as Worker 2
    participant W3 as Worker 3
    participant A as Aggregator

    O->>T: "Analyze: scrape 3 sites + summarize each"
    T->>T: Decompose into 4 subtasks
    T-->>O: Subtasks: [scrape A, scrape B, scrape C, summarize all]

    O->>W1: dispatch(scrape, siteA)
    O->>W2: dispatch(scrape, siteB)
    O->>W3: dispatch(scrape, siteC)

    par Parallel Execution
        W1->>W1: fetch + parse siteA
        W2->>W2: fetch + parse siteB
        W3->>W3: fetch + parse siteC
    end

    W1-->>A: resultA
    W2-->>A: resultB
    W3-->>A: resultC

    A->>A: Merge: Concatenate results
    A-->>O: Combined observation

    O->>O: Continue ReAct loop with observation
    O->>O: LLM summarizes parallel results
```

Explanation:

· Each worker runs independently with its own AbortController (see flow-7 #6).
· Results are collected by the Aggregator once all workers complete.
· Failed workers report errors; successful results are still merged.
· Built on top of the concurrent tool execution safety in flow-14 #7.

---

3. Task Decomposition Logic

```mermaid
flowchart TD
    LLMResponse["LLM requests multiple tool calls"] --> ParseCalls["Parse tool_calls array"]
    ParseCalls --> Count{"Number of tool calls?"}
    Count -->|"1"| SingleExec["Execute single tool normally"]
    Count -->|"2+"| AnalyzeDeps["Analyze dependencies between calls"]

    AnalyzeDeps --> CheckParams{"Any output used as input?"}
    CheckParams -->|"Yes"| BuildDAG["Build directed acyclic graph of dependencies"]
    BuildDAG --> TopoSort["Topological sort: determine execution order"]
    TopoSort --> GroupLevels["Group by level: same-level tasks = parallel"]

    CheckParams -->|"No"| AllParallel["All tasks independent → full parallel"]
    AllParallel --> DispatchAll["Dispatch all to worker pool simultaneously"]

    GroupLevels --> ExecuteLevel["Execute level 1 (parallel)"]
    ExecuteLevel --> WaitLevel["Wait for level completion"]
    WaitLevel --> ExecuteNext["Execute level 2 (parallel)"]
    ExecuteNext --> ContinueUntilDone["Continue until all levels done"]

    DispatchAll --> WaitAll["Promise.all for all workers"]
    ExecuteLevel --> WaitAll
    WaitAll --> CollectAll["Collect all results"]
    CollectAll --> ReturnToOrch["Return to Orchestrator"]
```

Explanation:

· Task decomposition builds a DAG to determine execution order.
· Same-level tasks (no mutual dependencies) are parallelized.
· Topological sort ensures dependent tasks run after prerequisites complete.
· All parallel tasks use Promise.all with individual error handling.

---

4. Archive Tools — agents/tools/archive.ts

```mermaid
graph TB
    Archive["archive.ts"] --> Export["export default Tool"]
    Export --> Name["name: 'archive'"]
    Export --> Desc["description: 'Extract and compress archive files (ZIP, TAR, GZ, 7Z, RAR)'"]
    Export --> Params["parameters: ZodSchema { action: z.enum(['extract','compress']), source: z.string(), destination: z.string(), format: z.enum(['zip','tar','gz','7z','rar']).optional(), files: z.array(z.string()).optional() }"]
    Export --> Handler["handler: async (params) => ToolResult"]
    
    Handler --> ActionSwitch{"action?"}
    ActionSwitch -->|"extract"| ExtractFlow["Extract: validate source path, detect format"]
    ActionSwitch -->|"compress"| CompressFlow["Compress: validate files exist, create archive"]

    ExtractFlow --> ValidateSource["Check: source exists in allowedPaths"]
    ValidateSource --> DetectFormat["Auto-detect: extension or magic bytes"]
    DetectFormat --> ExtractArchive["Extract: use appropriate library per format"]
    ExtractArchive --> VerifyExtraction["Verify: destination folder has extracted files"]
    VerifyExtraction --> ReturnExtract["Return: { success, data: { extractedFiles, totalSize } }"]

    CompressFlow --> ValidateFiles["Check: all source files exist in allowedPaths"]
    ValidateFiles --> ValidateDest["Check: destination path in allowedPaths"]
    ValidateDest --> CreateArchive["Create: use appropriate compression library"]
    CreateArchive --> VerifyArchive["Verify: archive file created and valid"]
    VerifyArchive --> ReturnCompress["Return: { success, data: { archivePath, size, format } }"]
```

Explanation:

· Supports ZIP, TAR, GZ, 7Z, RAR formats for both extraction and compression.
· Auto-detects format from file extension or magic bytes.
· All paths validated against allowedPaths from rules/tools.ts (see flow-2 #19).
· Extraction creates a folder with the archive name; compression creates a single archive file.
· Files are processed within agents/.agent-fs/workspace/ and uploads/ (see flow-13 #2-4).

---

5. Archive Format Support Matrix

```mermaid
graph TB
    subgraph ExtractFormats["Extract Support"]
        E_ZIP["ZIP: ✅ jszip/fflate"]
        E_TAR["TAR: ✅ tar-stream"]
        E_GZ["GZ: ✅ gunzip (single file)"]
        E_7Z["7Z: ✅ 7z-wasm (limited)"]
        E_RAR["RAR: ⚠️ unrar.wasm (read-only)"]
    end

    subgraph CompressFormats["Compress Support"]
        C_ZIP["ZIP: ✅ jszip"]
        C_TAR["TAR: ✅ tar-stream"]
        C_GZ["GZ: ✅ gzip-js"]
        C_7Z["7Z: ❌ (not in browser)"]
        C_RAR["RAR: ❌ (proprietary)"]
    end

    ExtractFormats --> Rules["Rules enforced by rules/tools.ts (flow-2 #19)"]
    CompressFormats --> Rules
    Rules --> MaxSize["maxArchiveSize: 100MB"]
    Rules --> AllowedPaths["allowedPaths: workspace/, uploads/"]
    Rules --> AllowedFormats["allowedFormats: zip, tar, gz"]
```

Explanation:

· Browser-based libraries provide extraction and compression without server-side dependencies.
· 7Z support is limited (read-only via WASM); RAR is read-only.
· Compression supports ZIP, TAR, GZ natively in the browser.
· All archive operations are constrained by rules/tools.ts (size limits, path restrictions).
· Archive tool is registered in agents/tools/index.ts barrel (see flow-3 #24).

---

6. Archive Processing Flow

```mermaid
flowchart TD
    Request["User requests archive operation"] --> TypeOperation{"Operation type?"}
    TypeOperation -->|"Extract"| DownloadSource["Download source archive to workspace/"]
    TypeOperation -->|"Compress"| CollectFiles["Collect files from workspace/ or uploads/"]

    DownloadSource --> ValidateArchive["Validate: archive not corrupted, format supported"]
    ValidateArchive --> CreateDest["Create destination folder in workspace/"]
    CreateDest --> ExtractAll["Extract all entries to destination"]
    ExtractAll --> ListFiles["List extracted files with sizes"]
    ListFiles --> CleanupSource["Remove source archive (optional)"]
    CleanupSource --> InjectContext["Inject file paths into LLM context"]
    
    CollectFiles --> BuildManifest["Build file manifest: paths, sizes"]
    BuildManifest --> ValidateFiles["Validate: all files exist, total size < limit"]
    ValidateFiles --> CreateArchive["Create archive with selected format"]
    CreateArchive --> StorePath["Store at destination path in workspace/"]
    StorePath --> InjectContext

    InjectContext --> LLMAccess["LLM can now reference extracted/compressed files"]
```

Explanation:

· Extracted files are placed in workspace/ with paths logged to LLM context.
· Compression collects multiple files into a single archive at the destination path.
· All operations respect maxArchiveSize and allowedPaths from rules.
· LLM is notified of resulting file paths for subsequent tool calls.

---

7. Rules Update for Archive Tools

```mermaid
graph TB
    ToolsRuleUpdate["tools.ts update (add to flow-2 #19)"] --> ArchiveRule["archive: { allowedFormats: ['zip','tar','gz','7z','rar'], maxArchiveSize: 104857600, allowedPaths: ['./workspace/','./uploads/'], cacheTTL: 0 }"]
    ArchiveRule --> FormatLimits["formatLimits: { zip: 100MB, tar: 500MB, gz: 100MB, 7z: 100MB, rar: 50MB }"]
    ArchiveRule --> ExtractRestrictions["extractRestrictions: { maxEntries: 1000, maxDepth: 5, maxTotalSize: 500MB }"]
    ArchiveRule --> CompressRestrictions["compressRestrictions: { maxSourceFiles: 100, maxTotalSize: 100MB }"]
```

Explanation:

· Archive tool rules are added to the existing tools.ts rule set (see flow-2 #19).
· Format-specific size limits protect against decompression bombs.
· Extraction limits prevent malicious archives with excessive nesting.
· Compression limits prevent resource exhaustion from too many files.

---

End of flow-16.md. This covers parallel task execution architecture, worker pool, task decomposition, archive extraction/compression tools, and their integration with the existing rules engine and storage system. Continued in flow-17.md (Statistics Dashboard).