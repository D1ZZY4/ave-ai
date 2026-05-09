flow-12.md — Memory Folder Per-File

This file provides detailed per‑file diagrams for the agents/memory/ folder. The overall memory system architecture is described in flow‑7 diagram 3 and flow‑8 diagrams 15‑17. These details complement those diagrams with file‑level specifics.

---

1. memory/index.ts (barrel)

```mermaid
graph TB
    Index["index.ts"] --> ReExport["export { MemoryFact, extractFacts, loadFacts, saveFact, deleteFact, clearAllFacts }"]
    ReExport --> ImportTypes["import { MemoryFact } from './types'"]
    ReExport --> ImportExtractor["import { extractFacts } from './extractor'"]
    ReExport --> ImportRetriever["import { loadFacts } from './retriever'"]
    ReExport --> ImportStore["import { saveFact, deleteFact, clearAllFacts } from './store'"]
```

Explanation: The barrel file aggregates all public APIs of the memory subsystem. It re‑exports the MemoryFact type, the extraction function, the retrieval function, and the CRUD operations from the IndexedDB store. The Orchestrator imports from this barrel.

---

2. memory/types.ts

```mermaid
graph TB
    Types["types.ts"] --> MemoryFact["export interface MemoryFact { key: string, value: string, timestamp: number, confidence: number }"]
    MemoryFact --> KeyDesc["key: unique identifier (e.g., 'user_name')"]
    MemoryFact --> ValueDesc["value: the fact string"]
    MemoryFact --> TimestampDesc["timestamp: Date.now() when created/updated"]
    MemoryFact --> ConfidenceDesc["confidence: 0‑1 score from extraction prompt"]
    Types --> FactExtractResult["export interface FactExtractResult { facts: MemoryFact[], error?: string }"]
```

Explanation: Defines the MemoryFact interface used throughout the system. The confidence field indicates how certain the extraction LLM was about the fact. FactExtractResult is the return type from the extraction helper.

---

3. memory/store.ts

```mermaid
flowchart TD
    Store["store.ts"] --> InitDB["Init IndexedDB: openDB('flowave-memory', 1, { upgrade(db) { db.createObjectStore('facts', { keyPath: 'key' }) } })"]
    InitDB --> DBInstance["Store db instance as module‑level variable"]
    DBInstance --> SaveFact["saveFact(fact: MemoryFact): Promise<void>"]
    SaveFact --> Put["db.put('facts', { ...fact, timestamp: Date.now() })"]
    DBInstance --> LoadFact["loadFact(key: string): Promise<MemoryFact | undefined>"]
    LoadFact --> Get["db.get('facts', key)"]
    DBInstance --> LoadAllFacts["loadAllFacts(): Promise<MemoryFact[]>"]
    LoadAllFacts --> GetAll["db.getAll('facts')"]
    DBInstance --> DeleteFact["deleteFact(key: string): Promise<void>"]
    DeleteFact --> Delete["db.delete('facts', key)"]
    DBInstance --> ClearAllFacts["clearAllFacts(): Promise<void>"]
    ClearAllFacts --> Clear["db.clear('facts')"]
```

Explanation: IndexedDB wrapper using the idb library (loaded via dynamic import). The database is initialised lazily on first use. All CRUD operations are simple key‑based stores on the facts object store with key as keyPath.

---

4. memory/extractor.ts

```mermaid
flowchart TD
    ExtractFunc["extractFacts(assistantMessage: string, existingFacts: MemoryFact[]): Promise<FactExtractResult>"] --> BuildPrompt["Build extraction prompt"]
    BuildPrompt --> PromptContent["Prompt: 'Given the following assistant response, extract any new facts about the user. Return a JSON array: [{ key, value, confidence }]. Existing facts: {JSON.stringify(existingFacts)}. Assistant message: {assistantMessage}'"]
    PromptContent --> CallLLM["Call helpers/ollama.ts generate with minimal model, stream: false, temperature: 0.1"]
    CallLLM --> ParseJSON["Attempt: JSON.parse(response)"]
    ParseJSON -->|"Success"| ValidateArray["Validate: array of { key, value, confidence } objects"]
    ValidateArray --> MergeFacts["Merge: for each new fact, upsert into existingFacts by key"]
    MergeFacts --> ReturnResult["Return: { facts: updatedFacts[] }"]
    ParseJSON -->|"Failed"| ReturnError["Return: { facts: existingFacts, error: 'Extraction failed' }"]
```

Explanation: Uses the LLM with a small, cheap prompt to extract structured facts from the assistant's message. It receives existing facts to avoid duplicates and to provide context. The result is merged with existing facts (upserting by key) before being returned.

---

5. memory/retriever.ts

```mermaid
flowchart TD
    RetrieveFunc["loadFacts(): Promise<MemoryFact[]>"] --> CallStore["Call: store.loadAllFacts()"]
    CallStore --> FilterStale["Filter: remove facts with confidence < 0.3 (optional pruning)"]
    FilterStale --> FormatFacts["Format: 'Known user info:\n- key: value\n- key: value'"]
    FormatFacts --> ReturnString["Return: formatted string for prompt injection"]
```

Explanation: Loads all stored facts from IndexedDB, optionally prunes those with very low confidence, and formats them as a bullet list to be prepended to the system prompt. This is called by the Orchestrator before every LLM request.

---

End of flow-12.md. This covers the five files inside agents/memory/. Continued in flow-13.md (Comprehensive Diagram Index & Cross‑Reference).