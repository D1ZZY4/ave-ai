flow-14.md — System Hardening & Edge Cases

---

1. Graceful Degradation on Connection Loss

```mermaid
flowchart TD
    Detect["Ollama connection lost mid-stream"] --> AbortFetch["AbortController.abort() triggers"]
    AbortFetch --> SavePartial["Save all completed thinking steps to store"]
    SavePartial --> MarkStatus["Set conversation status: 'interrupted'"]
    MarkStatus --> UINotification["Show banner: 'Connection to Ollama lost'"]
    UINotification --> RetryBtn["Display 'Retry' and 'Save for Later' buttons"]

    RetryBtn -->|"Retry"| HealthCheck["Run healthCheck ping (flow-6 #4)"]
    HealthCheck -->|"OK"| RebuildPrompt["Rebuild prompt with partial results, resume"]
    HealthCheck -->|"Fail"| Backoff["Exponential backoff (flow-7 #6 abort controller)"]
    Backoff -->|"Exhausted"| PersistentError["Show persistent error bar with manual retry"]

    RetryBtn -->|"Save for Later"| QueueToOffline["Save pending input to offline queue (flow-7 #8)"]
    QueueToOffline --> ReconnectEvent["Listen for 'online' event"]
    ReconnectEvent --> AutoFlush["Auto-flush queue when connection returns"]
```

Explanation:

· Connection loss mid-stream gracefully saves partial state, marks the conversation as interrupted, and offers retry or offline queue.
· Retry uses the health check ping from healthCheck.ts (flow-6 #4).
· Exponential backoff matches the abort controller pattern (flow-7 #6).
· Offline queuing leverages the PWA offline detection system (flow-7 #8).

---

2. Malicious Input Handling

```mermaid
flowchart TD
    InputArrives["User input received"] --> SanitizeInput["sanitizeInput() helper (flow-6 #13)"]
    SanitizeInput --> Truncate{"Length > 10000?"}
    Truncate -->|"Yes"| TrimToMax["Truncate to 10000 chars, set truncated flag"]
    Truncate -->|"No"| DetectInjection["detectInjection() (flow-6 #5)"]
    TrimToMax --> DetectInjection

    DetectInjection -->|"Found"| BlockInjection["Block immediately, reason: INJECTION_DETECTED"]
    BlockInjection --> ReturnBlocked["Return error to UI, do NOT call LLM"]

    DetectInjection -->|"Clean"| DetectPII["detectPII() (flow-6 #11)"]
    DetectPII -->|"Found"| OptionRedact{"User setting: redact or block?"}
    OptionRedact -->|"Block"| BlockPII["Block, reason: SAFETY_PII_DETECTED"]
    OptionRedact -->|"Redact"| RedactPII["redactPII() → pass cleaned text to LLM"]
    BlockPII --> ReturnBlocked

    DetectPII -->|"Clean"| ToxicityCheck["analyzeToxicity() (flow-6 #17)"]
    ToxicityCheck -->|"Score > 0.8"| BlockToxic["Block, reason: TOXICITY_BLOCKED"]
    BlockToxic --> ReturnBlocked
    ToxicityCheck -->|"Score <= 0.8"| ProceedToLLM["Input passes all gates → proceed to LLM"]
```

Explanation:

· Three-layer input defense: sanitization → injection detection → PII detection → toxicity analysis.
· Each layer can independently block or redact before the LLM ever sees the input (Gate 1 from flow-1 #5).
· All detection helpers documented in flow-6 (#5 injection, #11 PII, #17 toxicity).
· Input sanitization limits, trims, and cleans control characters (flow-6 #13).

---

3. LLM Response Anomaly Handling

```mermaid
flowchart TD
    LLMResponse["LLM response received"] --> ParseAttempt["parse-response-to-ui.ts (flow-6 #9)"]
    ParseAttempt -->|"Valid JSON"| ValidateSchema["Check response structure"]
    ParseAttempt -->|"Malformed JSON"| RetryParse["Accumulate buffer, retry parse"]
    RetryParse -->|"Still fails"| RequestRepair["Send correction prompt to LLM"]
    RequestRepair -->|"Repaired"| ValidateSchema
    RequestRepair -->|"Fails 3x"| FallbackAnswer["Use last known good partial response"]

    ValidateSchema -->|"Has tool_call"| PreApproval["Gate 2: Pre-approval (flow-1 #5)"]
    PreApproval -->|"Denied"| FeedbackLLM["Send denial reason → LLM re-thinks"]
    PreApproval -->|"Approved"| ExecuteTool["Execute tool handler"]

    ValidateSchema -->|"Has final_answer"| OutputSafety["Gate 3: Output safety (flow-1 #5)"]
    OutputSafety -->|"Blocked"| FilterOrRedact["Filter/redact output"]
    OutputSafety -->|"Clean"| ReturnToUI["Return to user"]

    ValidateSchema -->|"Unexpected format"| RepairRequest["Send repair prompt to LLM"]
    RepairRequest -->|"Repaired"| ValidateSchema
    RepairRequest -->|"Fails"| GracefulError["Return: 'I encountered an error, please try again'"]
```

Explanation:

· Handles malformed JSON by buffering and retrying parse, then requesting LLM repair.
· Self-correction for denied tool calls uses agent.ts correction prompt (flow-2 #9).
· Output safety (Gate 3) applies sanitization before user sees the response (flow-6 #13).
· Maximum 3 repair attempts before graceful fallback to prevent infinite loops.

---

4. Rate Limiting & Resource Protection

```mermaid
flowchart TD
    IncomingRequest["New request arrives"] --> CheckGlobalRate{"Global rate limit? (rules/global.ts)"}
    CheckGlobalRate -->|"Exceeded"| GlobalBackoff["Return 429: 'Too many requests, wait X seconds'"]
    CheckGlobalRate -->|"OK"| CheckToolRate{"Per-tool rate limit? (flow-6 #12)"}
    CheckToolRate -->|"Exceeded"| ToolQueue["Add to tool queue (OLLAMA_MAX_QUEUE=512)"]
    ToolQueue --> WaitSlot["Wait for slot, then execute"]
    CheckToolRate -->|"OK"| CheckMemory{"Memory pressure?"}
    CheckMemory -->|"High"| TriggerCompression["Force history compression (flow-6 #3)"]
    TriggerCompression --> Proceed["Proceed with request"]
    CheckMemory -->|"Normal"| Proceed

    Proceed --> CheckIterations{"Iteration count near max?"}
    CheckIterations -->|"Yes"| WarnLLM["Insert warning: 'You have 2 iterations remaining. Conclude soon.'"]
    CheckIterations -->|"No"| NormalProcessing["Normal processing"]
```

Explanation:

· Global rate limiting protects the Ollama server from overload (from global.ts, flow-2 #13).
· Per-tool rate limiting uses the sliding-window helper (flow-6 #12).
· Memory pressure triggers forced compression (flow-6 #3) when token usage exceeds 70% budget (flow-2 #10 context.ts).
· Iteration limit warnings prevent runaway loops (flow-2 #9 agent.ts maxIterations).

---

5. Token Budget Overflow Protection

```mermaid
flowchart TD
    BeforeCall["Before LLM call"] --> CountCurrent["countTokens on conversation history (flow-6 #16)"]
    CountCurrent --> CheckBudget{"currentTokens > budget * 0.9?"}
    CheckBudget -->|"Yes"| ForceCompress["Force compressHistory() (flow-6 #3)"]
    ForceCompress --> RecheckAfter["Re-count tokens after compression"]
    RecheckAfter --> StillOver{"Still > 90%?"}
    StillOver -->|"Yes"| TruncateHistory["Truncate oldest messages beyond safe threshold"]
    TruncateHistory --> WarnUser["Warn user: 'Conversation too long, older context summarized'"]
    StillOver -->|"No"| Proceed["Proceed with LLM call"]
    CheckBudget -->|"No"| Proceed

    AfterResponse["After LLM response"] --> CountResponse["Count response tokens"]
    CountResponse --> AddToTotal["Add to conversation total"]
    AddToTotal --> CheckOverBudget{"Total > budget?"}
    CheckOverBudget -->|"Yes"| ScheduleCompress["Schedule compression for next request"]
    CheckOverBudget -->|"No"| NormalState["Normal state"]
```

Explanation:

· Token budget enforced at 65536 tokens (matching OLLAMA_NUM_CTX, flow-2 #10 context.ts).
· Automatic compression triggers at 90% usage (up from normal 70% threshold).
· If compression alone isn't enough, oldest messages are truncated to stay within budget.
· User is notified when older context is summarized or truncated.

---

6. Abort Controller Cleanup on Navigation

```mermaid
flowchart TD
    Navigate["User navigates to different conversation"] --> CheckActive{"Active request in current conversation?"}
    CheckActive -->|"Yes"| SavePartialState["Save any partial thinking steps"]
    SavePartialState --> AbortOld["Abort old conversation's AbortController"]
    AbortOld --> RemoveController["Remove from controller map"]
    RemoveController --> SwitchToNew["Switch currentConversationId"]
    CheckActive -->|"No"| SwitchToNew

    TabClose["Tab closed / beforeunload"] --> IterateControllers["Iterate all AbortControllers in map"]
    IterateControllers --> AbortAll["Abort all active controllers"]
    AbortAll --> ClearMap["Clear controller map"]
    ClearMap --> PersistState["Persist all conversations to localStorage"]
    PersistState --> TabClosed["Tab closes cleanly"]
```

Explanation:

· Switching conversations properly aborts the old conversation's pending request (flow-7 #11 for conversation management).
· Tab close triggers cleanup of all controllers via beforeunload handler (flow-8 #2 for graceful shutdown).
· Partial thinking steps are saved before abort to preserve progress.

---

7. Concurrent Tool Execution Safety

```mermaid
flowchart TD
    LLMRequests["LLM requests multiple tool calls in one response"] --> ParseArray["Parse tool_calls array from response"]
    ParseArray --> CheckDependencies{"Tools have dependencies?"}
    CheckDependencies -->|"Yes"| SequentialExec["Execute sequentially: Tool A → Tool B"]
    CheckDependencies -->|"No"| ParallelExec["Execute in parallel (if allowed)"]

    SequentialExec --> CheckEachResult["Check each result for errors"]
    ParallelExec --> WaitAll["Promise.all: wait for all to complete"]
    WaitAll --> CollectResults["Collect all results"]
    CollectResults --> MergeObservations["Merge into single observation block"]
    MergeObservations --> SendToLLM["Send combined observation to LLM"]

    CheckEachResult -->|"Error in step N"| AbortChain["Abort remaining steps, report error"]
    AbortChain --> SendPartialToLLM["Send successful results + error info to LLM"]
```

Explanation:

· Handles multiple tool calls in a single LLM response (array of tool_calls).
· Sequential execution for dependent tools; parallel execution for independent tools.
· Error in a sequential chain aborts remaining steps and reports to LLM.
· Results are merged into a single observation before being sent back to LLM.

---

8. Security Headers & CSP for Backend Proxy

```mermaid
flowchart TD
    Request["HTTP request to backend proxy (flow-9 #14)"] --> ApplyCSP["Apply Content-Security-Policy header"]
    ApplyCSP --> CSPValue["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' {ollamaBaseUrl}"]
    CSPValue --> ApplyHSTS["Apply Strict-Transport-Security: max-age=31536000"]
    ApplyHSTS --> ApplyXFrame["Apply X-Frame-Options: DENY"]
    ApplyXFrame --> ApplyXContent["Apply X-Content-Type-Options: nosniff"]
    ApplyXContent --> ApplyReferrer["Apply Referrer-Policy: strict-origin-when-cross-origin"]
    ApplyReferrer --> CheckCSRF{"State-changing request?"}
    CheckCSRF -->|"Yes"| ValidateToken["Validate CSRF token from custom header"]
    ValidateToken -->|"Invalid"| Return403["Return 403 Forbidden"]
    ValidateToken -->|"Valid"| ForwardToOllama["Forward request to Ollama"]
    CheckCSRF -->|"No"| ForwardToOllama
```

Explanation:

· Security headers applied by the optional backend proxy (flow-9 #14) to harden against web attacks.
· CSP restricts script sources and connect-src to only the configured Ollama base URL.
· CSRF protection for state-changing requests when proxy is used.
· Headers complement frontend security (DOMPurify sanitization, flow-7 #7).

---

9. Error Boundary & Crash Recovery

```mermaid
flowchart TD
    ReactError["Uncaught React error"] --> ErrorBoundary["<ErrorBoundary> catches error"]
    ErrorBoundary --> LogError["Log error to console + optional telemetry"]
    LogError --> SaveState["Persist current conversation state to localStorage"]
    SaveState --> RenderFallback["Render fallback UI: 'Something went wrong'"]
    RenderFallback --> ReloadBtn["'Reload App' button + 'Restore Last Session' button"]

    ReloadBtn --> FullReload["window.location.reload()"]
    RestoreBtn["'Restore Last Session'"] --> LoadSaved["Load conversation from localStorage"]
    LoadSaved --> RestartUI["Re-initialize app with restored state (flow-7 #2)"]

    OrchestratorCrash["Orchestrator logic error"] --> CatchInTryCatch["try/catch in useChat hook"]
    CatchInTryCatch --> DispatchError["dispatch setError({ message, recoverable })"]
    DispatchError --> ErrorUI["Show inline error in chat: 'I hit an error. Try again?'"]
    ErrorUI --> RetryAction["User clicks retry → re-sends last message (flow-7 #17)"]
```

Explanation:

· React error boundary catches rendering crashes, saves state, and offers recovery options.
· Orchestrator errors caught in try/catch within useChat hook (flow-9 #3, flow-9 #17).
· Error state dispatched to Zustand store (flow-9 #1) and shown inline.
· User can recover by retrying the last message (flow-7 #17).

---

10. Sensitive Data Redaction on Export

```mermaid
flowchart TD
    ExportTrigger["User triggers export (flow-8 #6)"] --> SelectFormat{"Format?"}
    SelectFormat -->|"JSON"| PrepareJSON["JSON.stringify conversation"]
    SelectFormat -->|"Markdown"| PrepareMD["Convert to Markdown"]
    SelectFormat -->|"PDF"| PreparePDF["Generate PDF"]
    
    PrepareJSON --> ScanPII["Run detectPII on entire conversation (flow-6 #11)"]
    PrepareMD --> ScanPII
    PreparePDF --> ScanPII
    
    ScanPII -->|"PII found"| RedactAll["redactPII on all messages"]
    RedactAll --> WarningBanner["Show warning: 'PII detected and redacted from export'"]
    WarningBanner --> ProceedExport["Proceed with redacted data"]
    ScanPII -->|"Clean"| ProceedExport
    
    ProceedExport --> TriggerDownload["Trigger browser download"]
```

Explanation:

· All export formats (JSON, Markdown, PDF — flow-8 #6) undergo PII scanning before download.
· PII is automatically redacted using redactPII() helper (flow-6 #11).
· User is warned when PII was found and redacted in the export.
· Prevents accidental leakage of sensitive data through conversation exports.

---

End of flow-14.md. This covers system hardening, edge cases, graceful degradation, security headers, crash recovery, and export safety. Continued in flow-15.md (Multi-Modal & Model Management).