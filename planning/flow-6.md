flow-6.md — Per-File Diagrams: Helpers

This file provides detailed diagrams and explanations for every file inside frontend/src/helpers/.

---

Helpers Overview

1. helpers/ Folder Structure (All 16 Files)

```mermaid
graph TB
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

Explanation: Sixteen pure utility modules consumed by the Orchestrator, tools, skills, and web tools. These helpers provide caching, compression, health checking, safety detection, Ollama API communication, response parsing, rate limiting, HTML sanitization, IndexedDB storage, thinking step management, and token counting.

---

2. cache.ts

```mermaid
graph TB
    Cache["cache.ts"] --> Export["export { getCache, setCache, clearCache, clearExpired }"]
    Export --> Store["Internal: Map<string, { data: any, timestamp: number, ttl: number }>"]
    Export --> GetCache["getCache(key): check if key exists AND (now - timestamp) < ttl → return data or null"]
    Export --> SetCache["setCache(key, data, ttlMs): store { data, timestamp: Date.now(), ttl: ttlMs }"]
    Export --> ClearCache["clearCache(): delete all entries from Map"]
    Export --> ClearExpired["clearExpired(): iterate all entries, delete expired"]
    SetCache --> Overwrite["If key exists: overwrite with new data and reset timestamp"]
    GetCache --> ExpiredCheck["Check: (Date.now() - entry.timestamp) > entry.ttl → delete entry, return null"]
```

Explanation: In-memory TTL (Time-To-Live) cache using a JavaScript Map. Each entry stores data, a timestamp of when it was cached, and a TTL in milliseconds. getCache checks expiry before returning data. setCache overwrites existing keys. Used by tools (read-file, web-fetcher, etc.) to avoid redundant operations. Cache is cleared when conversations end or the page reloads.

---

3. compression.ts

```mermaid
graph TB
    Compression["compression.ts"] --> Export["export async function compressHistory(messages: ChatMessage[], tokenBudget: number, currentTokens: number)"]
    Export --> Select["Select: identify oldest 30% of messages by message count"]
    Select --> BuildPrompt["Build: summarization prompt = 'Summarize the following conversation into 3-5 key points preserving important context:' + selectedMessages.map(m => m.content).join('\n')"]
    BuildPrompt --> BuildSystem["Build system: 'You are a summarizer. Output only 3-5 bullet points.'"]
    BuildSystem --> CallLLM["Call: ollama.generate() with minimal model, short prompt, stream: false"]
    CallLLM --> Parse["Parse: take LLM response, split into bullet points"]
    Parse --> Replace["Replace: remove selected messages from array, insert single summary message with role='system' and content=bullets"]
    Replace --> Recalculate["Recalculate: token count after compression"]
    Recalculate --> Return["Return: { messages: updatedMessages[], newTokenCount: number, compressed: true }"]
```

Explanation: Conversation history compression utility. Triggered when token usage exceeds 70% of the budget (from rules/context.ts). Selects the oldest 30% of messages, sends them to the LLM with a summarization prompt, receives bullet-point summary, and replaces the original messages with the condensed version. Returns the updated message array and new token count.

---

4. healthCheck.ts

```mermaid
graph TB
    HealthCheck["healthCheck.ts"] --> Export["export async function pingOllama(baseUrl: string): Promise<{ ok: boolean, error?: string, models?: string[] }>"]
    Export --> BuildURL["Build: url = baseUrl + '/api/tags'"]
    BuildURL --> CreateAbort["Create: AbortController with 5000ms timeout"]
    CreateAbort --> Fetch["Fetch: fetch(url, { method: 'HEAD', signal: controller.signal })"]
    Fetch -->|"OK (status 200)"| ParseSuccess["If method was GET (fallback): parse JSON body, extract model names"]
    Fetch -->|"Error / Timeout"| ReturnFail["Return: { ok: false, error: 'Connection failed: {message}' }"]
    ParseSuccess --> ReturnOK["Return: { ok: true, models: string[] }"]
    Fetch -->|"HEAD not allowed"| FallbackGET["Fallback: GET request to same URL"]
    FallbackGET --> ParseSuccess
```

Explanation: Ollama server health check. Sends a HEAD request to Ollama's /api/tags endpoint with a 5-second timeout. If HEAD is not allowed, falls back to GET and parses the model list from the response body. Used by the Settings "Test Connection" button and as a pre-flight check before the first LLM call in a session.

---

5. injectionDetector.ts

```mermaid
graph TB
    Injection["injectionDetector.ts"] --> Export["export function detectInjection(text: string): { found: boolean, matchedPattern?: string, severity: 'low'|'medium'|'high' }"]
    Export --> Normalize["Normalize: text = text.toLowerCase().trim()"]
    Normalize --> Patterns["Patterns array: { pattern: string, severity: 'low'|'medium'|'high' }"]
    Patterns --> P1["'ignore previous instructions' → high"]
    Patterns --> P2["'pretend you are' → high"]
    Patterns --> P3["'system prompt:' → high"]
    Patterns --> P4["'override safety' → high"]
    Patterns --> P5["'jailbreak' → high"]
    Patterns --> P6["'developer note:' → medium"]
    Patterns --> P7["'you are now' → medium"]
    Patterns --> P8["'new instructions:' → medium"]
    Patterns --> P9["'forget all' → high"]
    Normalize --> Loop["For each pattern: check if text.includes(pattern)"]
    Loop -->|"Match found"| ReturnMatch["Return: { found: true, matchedPattern, severity }"]
    Loop -->|"No matches"| ReturnClean["Return: { found: false }"]
```

Explanation: Prompt injection detector using a keyword blacklist. Normalizes input to lowercase, then checks against an array of known injection patterns with assigned severity levels (high/medium/low). Returns early on the first match to minimize processing. Used in Gate 1 (input safety check) before any user input reaches the LLM.

---

6. ollama.ts

```mermaid
graph TB
    Ollama["ollama.ts"] --> Export["export { generate, getTags, pullModel, ping }"]
    Export --> Generate["generate(baseUrl: string, model: string, prompt: string, options?: { stream, temperature, num_predict }): AsyncGenerator<string>"]
    Export --> GetTags["getTags(baseUrl: string): Promise<Model[]>"]
    Export --> PullModel["pullModel(baseUrl: string, model: string): AsyncGenerator<PullProgress>"]
    Export --> Ping["ping(baseUrl: string): Promise<boolean>"]

    Generate --> BuildPayload["Build payload: { model, prompt, stream: options.stream ?? true, options: { temperature, num_predict } }"]
    BuildPayload --> CreateAbort["Create: AbortSignal from options.signal"]
    CreateAbort --> Fetch["Fetch: POST {baseUrl}/api/generate, body: JSON.stringify(payload), signal"]
    Fetch --> CheckStream{"stream mode?"}
    CheckStream -->|"Yes"| StreamParse["Stream: response.body.getReader(), read NDJSON lines, yield each chunk"]
    CheckStream -->|"No"| SingleResponse["Single: await response.json(), yield response.response"]
    StreamParse --> ErrorHandler["On error: throw with context about request"]
    SingleResponse --> ErrorHandler

    GetTags --> FetchTags["Fetch: GET {baseUrl}/api/tags"]
    FetchTags --> ParseModels["Parse: response.json() → models[]"]

    PullModel --> FetchPull["Fetch: POST {baseUrl}/api/pull, body: { name: model }"]
    FetchPull --> StreamProgress["Stream: read NDJSON progress updates, yield { status, digest, total, completed }"]

    Ping --> HeadRequest["Fetch: HEAD {baseUrl}/"]
    HeadRequest --> ReturnBoolean["Return: response.ok"]
```

Explanation: Complete Ollama API client wrapper. generate is the core function: it builds the request payload (model, prompt, options like temperature and num_predict), sends a POST to Ollama's /api/generate endpoint, and returns an async generator that yields NDJSON chunks for streaming or the full response for non-streaming mode. getTags fetches available models. pullModel streams download progress for model pulling. ping does a lightweight HEAD request to check server availability. All functions read baseUrl from parameters (passed from Zustand settings store).

---

7. parse-choose-option-to-ui.ts

```mermaid
graph TB
    ParseChoose["parse-choose-option-to-ui.ts"] --> Export["export function parseChooseOption(responseText: string): { options: { label: string, value: string }[] } | null"]
    Export --> TryJSON["Attempt 1: extract JSON array from text using regex match /\[.*\]/s"]
    TryJSON -->|"Found"| JSONParse["JSON.parse() the matched string"]
    JSONParse -->|"Success"| ValidateArray["Validate: is array of objects with label/value keys?"]
    ValidateArray -->|"Valid"| ReturnArray["Return: { options: [{ label, value }] }"]
    ValidateArray -->|"Invalid"| Fallback
    JSONParse -->|"Parse error"| Fallback["Attempt 2: fallback — split text by newlines"]
    TryJSON -->|"Not found"| Fallback
    Fallback --> Split["Split: text.split('\\n'), filter empty lines"]
    Split --> Dedupe["Deduplicate: unique lines only"]
    Dedupe --> BuildOpts["Build: each line becomes { label: line.trim(), value: line.trim() }"]
    BuildOpts --> CheckMin{"options.length >= 2?"}
    CheckMin -->|"Yes"| ReturnFallback["Return: { options: [...] }"]
    CheckMin -->|"No"| ReturnNull["Return: null (not enough options to show)"]
```

Explanation: Choice card parser for LLM responses. When the LLM returns structured options (e.g., for file selection, mode switching, or suggestions), this helper extracts them. First attempts to find and parse a JSON array with label/value objects. If JSON parsing fails, falls back to line-by-line parsing, treating each non-empty line as an option. Returns null if fewer than 2 options are found (not meaningful as choices). The parsed options are rendered as clickable ChoiceCards in the UI.

---

8. parse-diagram-to-ui.ts

```mermaid
graph TB
    ParseDiagram["parse-diagram-to-ui.ts"] --> Export["export function extractDiagramCode(text: string): { type: 'mermaid' | 'unknown', code: string } | null"]
    Export --> MermaidRegex["Regex 1: match ```mermaid ... ``` blocks, capture code inside"]
    MermaidRegex -->|"Match"| ExtractMermaid["Extract: code between backticks, trim whitespace"]
    ExtractMermaid --> ValidateMermaid["Validate: does code start with known Mermaid keywords? (graph, flowchart, sequenceDiagram, stateDiagram, classDiagram, etc.)"]
    ValidateMermaid -->|"Valid"| ReturnMermaid["Return: { type: 'mermaid', code }"]
    ValidateMermaid -->|"Invalid"| TryGeneric["Try generic code block"]
    MermaidRegex -->|"No match"| TryGeneric["Regex 2: match ``` ... ``` blocks (any language)"]
    TryGeneric -->|"Match"| ReturnGeneric["Return: { type: 'unknown', code }"]
    TryGeneric -->|"No match"| ReturnNull["Return: null"]
```

Explanation: Diagram code extractor. When the LLM generates Mermaid diagram code inside markdown code fences (mermaid ... ), this helper extracts and validates it. Checks that the extracted code begins with recognized Mermaid syntax keywords (graph, flowchart, sequenceDiagram, etc.). If no Mermaid block is found, attempts to extract any generic code block. Returns the diagram type and cleaned code, or null if no diagram is detected. The extracted code is passed to the Mermaid.js renderer in the UI.

---

9. parse-response-to-ui.ts

```mermaid
graph TB
    ParseResponse["parse-response-to-ui.ts"] --> Export["export async function* parseResponseStream(reader: ReadableStreamDefaultReader<Uint8Array>, signal?: AbortSignal): AsyncGenerator<ParsedEvent>"]
    Export --> CreateDecoder["Create: TextDecoder('utf-8')"]
    CreateDecoder --> InitBuffer["Initialize: buffer = ''"]
    InitBuffer --> Loop["While true:"]
    Loop --> Read["Read: await reader.read()"]
    Read --> CheckSignal{"signal?.aborted?"}
    CheckSignal -->|"Yes"| AbortCleanup["Cancel: reader.cancel(), return"]
    CheckSignal -->|"No"| CheckDone{"done === true?"}
    CheckDone -->|"Yes"| ProcessRemaining["Process remaining buffer content"]
    CheckDone -->|"No"| Decode["Decode: buffer += decoder.decode(chunk.value, { stream: true })"]
    Decode --> SplitLines["Split: lines = buffer.split('\\n'), buffer = lines.pop() || ''"]
    SplitLines --> ProcessLines["For each line in lines:"]
    ProcessLines --> SkipEmpty["If line.trim() === '': continue"]
    SkipEmpty --> TryParse["Try: JSON.parse(line)"]
    TryParse -->|"Error"| SkipInvalid["Skip malformed line"]
    TryParse -->|"Success"| CheckKeys{"Check JSON keys"}
    CheckKeys -->|"Has 'message'"| ParseMessage["Parse message object"]
    ParseMessage --> HasContent{"Has 'content'?"}
    HasContent -->|"Yes"| YieldThought["Yield: { type: 'thought', data: { content }, stepNumber }"]
    HasContent -->|"No"| HasToolCalls{"Has 'tool_calls'?"}
    HasToolCalls -->|"Yes"| YieldAction["Yield: { type: 'action', data: { name, arguments }, stepNumber }"]
    HasToolCalls -->|"No"| Ignore["Ignore"]
    CheckKeys -->|"Has 'done'"| YieldFinal["Yield: { type: 'final', data: { total_duration, eval_count } }"]
    CheckKeys -->|"Other"| YieldRaw["Yield: { type: 'raw', data: json }"]
    ProcessRemaining --> FinalYield["Yield final event if needed"]
    FinalYield --> Return["Generator done"]
```

Explanation: The core NDJSON stream parser. Takes a ReadableStreamDefaultReader from a fetch response, decodes chunks as UTF-8, accumulates partial lines in a buffer, and yields structured ParsedEvent objects. Events include: thought (LLM's reasoning text), action (tool call with name and arguments), final (completion signal with token counts), and raw (unhandled JSON). Handles AbortSignal for cancellation. This parser is the bridge between Ollama's raw streaming response and the Zustand store updates that drive the UI.

---

10. parse-selection-to-ui.ts

```mermaid
graph TB
    ParseSelection["parse-selection-to-ui.ts"] --> Export["export function handleSelection(selectedOption: string, conversationId: string): void"]
    Export --> LoadStore["Import: useChat store via Zustand"]
    LoadStore --> Dispatch["Dispatch: sendMessage({ content: selectedOption, conversationId, source: 'choice-card' })"]
    Dispatch --> OptionalMeta["Optionally attach metadata: { fromChoiceCard: true, selectedAt: Date.now() }"]
    OptionalMeta --> Return["Returns: void (side effect via dispatch)"]
```

Explanation: Selection handler for choice cards. When a user clicks a choice card in the UI, this helper takes the selected option value and dispatches it as a new user message to the chat store. Adds metadata indicating the message originated from a choice card selection. This allows the conversation to continue seamlessly as if the user typed the option.

---

11. piiDetector.ts

```mermaid
graph TB
    PII["piiDetector.ts"] --> Export["export { detectPII, redactPII }"]
    Export --> Patterns["Pattern definitions: { type: string, regex: RegExp, severity: 'high'|'medium' }"]
    Patterns --> Email["email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g → high"]
    Patterns --> Phone["phone: multiple formats (ID +62, US +1, international) → medium"]
    Patterns --> CreditCard["creditCard: Luhn algorithm + regex patterns → high"]
    Patterns --> NIK["nik/ktp: /\b\d{16}\b/g → high"]
    Patterns --> NPWP["npwp: /\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}/g → high"]
    Patterns --> Passport["passport: /[A-Z]\d{7,8}/g → medium"]

    Export --> DetectFn["detectPII(text: string): { found: boolean, matches: { type, value, index, severity }[] }"]
    DetectFn --> TestAll["For each pattern: regex.test(text)"]
    TestAll -->|"Match"| Capture["Capture: pattern.exec() to get matched values"]
    Capture --> Collect["Collect: push { type, value, index, severity } to matches array"]
    Collect --> ReturnDetect["Return: { found: matches.length > 0, matches }"]

    Export --> RedactFn["redactPII(text: string): { cleaned: string, redactions: number }"]
    RedactFn --> RedactAll["For each pattern: text = text.replace(pattern, '[REDACTED]')"]
    RedactAll --> Count["Count: track number of redactions per type"]
    Count --> ReturnRedact["Return: { cleaned: text, redactions: total }"]
```

Explanation: PII (Personally Identifiable Information) detection and redaction. Uses regex patterns for common PII types: email addresses, phone numbers (Indonesian and international formats), credit card numbers (with Luhn algorithm validation), Indonesian NIK/KTP numbers (16-digit), NPWP tax numbers, and passport numbers. Each pattern has a severity level (high/medium). detectPII returns all matches with their types and positions. redactPII replaces all detected PII with [REDACTED] and returns the cleaned text with a count of redactions.

---

12. rateLimit.ts

```mermaid
graph TB
    RateLimit["rateLimit.ts"] --> Export["export { checkRateLimit, logCall, getRateLimitStatus, resetRateLimit }"]
    Export --> Store["Internal: Map<string, { timestamps: number[], limit: number, windowMs: number }>"]
    Export --> CheckRateLimit["checkRateLimit(toolName: string, limit?: number, windowMs?: number): { allowed: boolean, retryAfterMs?: number, remaining?: number }"]
    CheckRateLimit --> GetOrDefault["Get stored config for toolName, or use limit/windowMs params or defaults (10 calls, 60000ms)"]
    GetOrDefault --> PurgeOld["Purge: timestamps = timestamps.filter(ts => Date.now() - ts < windowMs)"]
    PurgeOld --> Compare["Compare: if timestamps.length >= limit → not allowed"]
    Compare -->|"Not allowed"| CalcRetry["Calc: retryAfterMs = timestamps[0] + windowMs - Date.now()"]
    CalcRetry --> ReturnDeny["Return: { allowed: false, retryAfterMs, remaining: 0 }"]
    Compare -->|"Allowed"| ReturnAllow["Return: { allowed: true, remaining: limit - timestamps.length }"]

    Export --> LogCall["logCall(toolName: string): void — push Date.now() to timestamps array"]
    Export --> GetStatus["getRateLimitStatus(toolName: string): { used, limit, remaining, resetAt }"]
    Export --> Reset["resetRateLimit(toolName: string): clear timestamps array for tool"]
```

Explanation: Sliding-window rate limiter. Each tool (or web tool) has its own tracking entry in an internal Map. checkRateLimit purges timestamps older than the window (default 60 seconds), counts remaining timestamps, and determines if the call is allowed. If denied, calculates retryAfterMs based on when the oldest timestamp will expire. Used by web-search and other external tools to respect API rate limits. Configurable per-tool via rules/tools.ts.

---

13. sanitizer.ts

```mermaid
graph TB
    Sanitizer["sanitizer.ts"] --> Export["export { sanitizeHTML, sanitizeInput }"]
    Export --> SanitizeHTML["sanitizeHTML(text: string): string"]
    SanitizeHTML --> InitDOMPurify["Initialize: DOMPurify instance"]
    InitDOMPurify --> SanitizeCall["DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })"]
    SanitizeCall --> StripAll["Effect: strips all HTML tags, attributes, and scripts"]
    StripAll --> ReturnClean["Return: clean text string"]

    Export --> SanitizeInput["sanitizeInput(text: string): { cleaned: string, truncated: boolean }"]
    SanitizeInput --> Trim["Trim: text.trim()"]
    Trim --> LengthCheck["Check: if text.length > 10000 → truncate, truncated = true"]
    LengthCheck --> RemoveCtrl["Remove: control characters (ASCII 0-31 except \\n, \\t)"]
    RemoveCtrl --> CollapseWS["Collapse: multiple spaces into single space"]
    CollapseWS --> ReturnInput["Return: { cleaned, truncated }"]
```

Explanation: Dual-function sanitizer for LLM output and user input. sanitizeHTML uses DOMPurify with ALLOWED_TAGS set to empty array, effectively stripping all HTML from LLM output before rendering in React (prevents XSS). sanitizeInput cleans user input: trims whitespace, enforces 10000-character maximum, removes control characters, and collapses multiple spaces. Used in Gate 1 (input safety) and Gate 3 (output safety).

---

14. storage.ts

```mermaid
graph TB
    Storage["storage.ts"] --> Export["export { saveConversation, loadConversation, deleteConversation, loadAllConversations, saveMemoryFact, loadMemoryFacts, deleteMemoryFact }"]
    Export --> InitDB["Initialize: IndexedDB via 'idb' wrapper library"]
    InitDB --> DBName["Database name: 'flowave-db', version: 1"]
    DBName --> Stores["Object stores: 'conversations' (keyPath: id), 'memory_facts' (keyPath: key)"]

    Export --> SaveConv["saveConversation(conversation: Conversation): Promise<void>"]
    SaveConv --> Serialize["Serialize: JSON.stringify conversation object"]
    Serialize --> IDBPut["idb.put('conversations', { id, data, updatedAt })"]

    Export --> LoadConv["loadConversation(id: string): Promise<Conversation | null>"]
    LoadConv --> IDBGet["idb.get('conversations', id) → parse data field → return Conversation"]

    Export --> DeleteConv["deleteConversation(id: string): Promise<void>"]
    DeleteConv --> IDBDelete["idb.delete('conversations', id)"]

    Export --> LoadAllConv["loadAllConversations(): Promise<Record<string, Conversation>>"]
    LoadAllConv --> IDBGetAll["idb.getAll('conversations') → reduce to Record<string, Conversation>"]

    Export --> SaveFact["saveMemoryFact(fact: MemoryFact): Promise<void>"]
    SaveFact --> IDBPutFact["idb.put('memory_facts', { key: fact.key, value, timestamp, confidence })"]

    Export --> LoadFacts["loadMemoryFacts(): Promise<MemoryFact[]>"]
    LoadFacts --> IDBGetAllFacts["idb.getAll('memory_facts')"]

    Export --> DeleteFact["deleteMemoryFact(key: string): Promise<void>"]
    DeleteFact --> IDBDeleteFact["idb.delete('memory_facts', key)"]
```

Explanation: IndexedDB storage wrapper using the idb library for simplified Promises-based API. Creates a database named flowave-db with two object stores: conversations (for chat history persistence) and memory_facts (for long-term AI memory). Provides CRUD operations for both stores. Conversations are serialized as JSON before storage. Memory facts are keyed by a unique key string (e.g., 'user_name', 'user_job'). This is the persistence layer for all offline, multi-session data.

---

15. thinking.ts

```mermaid
graph TB
    Thinking["thinking.ts"] --> Export["export { createThinkingStep, updateThinkingStep, finalizeThinkingSteps, clearCurrentSteps }"]
    Export --> Create["createThinkingStep(stepNumber: number, thought: string, conversationId: string): ThinkingStep"]
    Create --> BuildStep["Build: { stepNumber, thought, timestamp: Date.now(), conversationId }"]
    BuildStep --> Return["Return: ThinkingStep object (action and observation undefined)"]

    Export --> Update["updateThinkingStep(step: ThinkingStep, update: Partial<ThinkingStep>): ThinkingStep"]
    Update --> Merge["Merge: { ...step, ...update, observationTimestamp: Date.now() if observation }"]

    Export --> Finalize["finalizeThinkingSteps(steps: ThinkingStep[]): ThinkingStep[]"]
    Finalize --> Filter["Filter: keep only steps that have both action AND observation"]
    Filter --> Sort["Sort: by stepNumber ascending"]
    Sort --> AddDurations["Add: calculate duration between step.action timestamp and step.observation timestamp"]
    AddDurations --> ReturnSteps["Return: completed and sorted steps"]

    Export --> ClearCurrent["clearCurrentSteps(conversationId: string): void"]
    ClearCurrent --> Dispatch["Dispatch to Zustand: set thinkingSteps array to empty for conversationId"]
```

Explanation: Thinking step lifecycle manager. createThinkingStep creates a partial step when the LLM starts reasoning (thought only, no action/observation yet). updateThinkingStep merges new data (action call or observation result) into the existing step. finalizeThinkingSteps filters out incomplete steps (no observation), sorts by step number, and calculates duration between action and observation. clearCurrentSteps dispatches a store update to clear steps for a conversation. These functions are called by the Orchestrator during the ReAct loop.

---

16. tokenizer.ts

```mermaid
graph TB
    Tokenizer["tokenizer.ts"] --> Export["export { countTokens, isNearLimit, estimateTokens }"]
    Export --> LazyLoad["Lazy: dynamic import of llama-tokenizer-js on first use"]
    LazyLoad --> InitTokenizer["Initialize: tokenizer for model family (Qwen3 compatible)"]
    InitTokenizer --> CacheInstance["Cache: store tokenizer instance in module-level variable"]

    Export --> CountTokens["countTokens(text: string): Promise<number>"]
    CountTokens --> EnsureInit["Ensure: tokenizer is initialized"]
    EnsureInit --> Encode["Encode: tokenizer.encode(text)"]
    Encode --> ReturnLength["Return: encoded.length (token count)"]

    Export --> EstimateTokens["estimateTokens(text: string): number (synchronous, approximate)"]
    EstimateTokens --> Approx["Approximation: text.length / 4 (rough estimate for English)"]
    Approx --> ReturnApprox["Return: estimated token count (no async needed)"]

    Export --> IsNearLimit["isNearLimit(currentTokens: number, budget: number): boolean"]
    IsNearLimit --> Calculate["Calculate: currentTokens / budget"]
    Calculate --> NearCheck["Check: ratio > 0.7 → return true"]
    NearCheck --> ReturnBool["Return: boolean indicating if near limit"]
```

Explanation: Token counter for managing context window limits. Uses llama-tokenizer-js (lazy-loaded for performance) to accurately encode text and count tokens for Qwen3-compatible models. estimateTokens provides a fast, synchronous approximation (length/4) when exact counting isn't needed. isNearLimit checks if current token usage exceeds 70% of the budget (from rules/context.ts), triggering compression. Used by the Orchestrator to monitor context window usage.

---

17. toxicityAnalyzer.ts

```mermaid
graph TB
    Toxicity["toxicityAnalyzer.ts"] --> Export["export function analyzeToxicity(text: string): { score: number, flagged: boolean, matches: { term: string, weight: number }[] }"]
    Export --> Normalize["Normalize: text = text.toLowerCase()"]
    Normalize --> TermList["Term list: array of { term: string, weight: number (1-10), category: 'hate'|'harassment'|'violence'|'self-harm'|'explicit' }"]
    TermList --> MatchLoop["For each term: check if text.includes(term)"]
    MatchLoop -->|"Match"| CaptureMatch["Capture: push { term, weight, category } to matches[]"]
    CaptureMatch --> AccumulateWeight["Accumulate: totalWeight += weight (capped at 100)"]
    MatchLoop -->|"No match"| Continue["Continue loop"]
    AccumulateWeight --> CalcScore["Calculate: score = totalWeight / 100 (normalized 0-1)"]
    CalcScore --> CalcFlagged["Flagged: score > 0.8 → true, score > 0.7 → warning"]
    CalcFlagged --> Return["Return: { score, flagged, matches }"]
```

Explanation: Lightweight toxicity analyzer using a weighted keyword list. Terms are organized by category (hate, harassment, violence, self-harm, explicit content) with weights from 1 to 10. Matches are accumulated and normalized to a 0-1 score. Scores above 0.8 are considered toxic and blocked; scores above 0.7 generate warnings. Used in Gate 1 (input safety) and Gate 3 (output safety) from rules/safety.ts.

---

End of flow-6.md. This completes the per-file documentation for all 16 helper utilities. The helpers form the foundation that tools, skills, web tools, and the orchestrator depend on for caching, safety, communication, parsing, rate limiting, storage, thinking management, and token counting.