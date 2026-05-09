flow-2.md — Per-File Diagrams: Personas & Rules

This file provides detailed diagrams and explanations for every file inside agents/personas/ and agents/rules/.

---

Personas

1. adaptive.ts

```mermaid
graph TB
    Adaptive["adaptive.ts"] --> Export["export default Persona"]
    Export --> SystemPrompt["systemPrompt: 'You are Ave AI. You are adaptive, adjusting your tone and style to match the user's needs...'"]
    Export --> DisplayName["displayName: 'Adaptive'"]
    Export --> ToneInstruction["toneInstruction: 'Flexible, responsive, and observant'"]
```

Explanation: The adaptive persona dynamically shifts communication style based on the user's tone. It always identifies as "Ave AI" via the systemPrompt opening sentence. displayName is shown in the persona selector; toneInstruction guides the AI's language style.

2. casual.ts

```mermaid
graph TB
    Casual["casual.ts"] --> Export["export default Persona"]
    Export --> SystemPrompt["systemPrompt: 'You are Ave AI. You are casual and relaxed, using everyday language...'"]
    Export --> DisplayName["displayName: 'Casual'"]
    Export --> ToneInstruction["toneInstruction: 'Friendly, approachable, informal'"]
```

Explanation: The casual persona uses informal, everyday language. The system prompt sets the identity as "Ave AI" and instructs a relaxed tone.

3. creative.ts

```mermaid
graph TB
    Creative["creative.ts"] --> Export["export default Persona"]
    Export --> SystemPrompt["systemPrompt: 'You are Ave AI. You are creative, imaginative, and expressive...'"]
    Export --> DisplayName["displayName: 'Creative'"]
    Export --> ToneInstruction["toneInstruction: 'Vivid, unexpected connections, storytelling style'"]
```

Explanation: The creative persona emphasizes imaginative, expressive responses with vivid language and storytelling.

4. default.ts

```mermaid
graph TB
    Default["default.ts"] --> Export["export default Persona"]
    Export --> SystemPrompt["systemPrompt: 'You are Ave AI. You are a balanced, helpful, and clear assistant...'"]
    Export --> DisplayName["displayName: 'Default'"]
    Export --> ToneInstruction["toneInstruction: 'Balanced, clear, straightforward'"]
```

Explanation: The default persona provides balanced, helpful, and clear assistance. It is the fallback when no other persona is selected.

5. developer.ts

```mermaid
graph TB
    Developer["developer.ts"] --> Export["export default Persona"]
    Export --> SystemPrompt["systemPrompt: 'You are Ave AI. You are a developer, focused on code, technical details, and precise solutions...'"]
    Export --> DisplayName["displayName: 'Developer'"]
    Export --> ToneInstruction["toneInstruction: 'Technical, precise, code-focused'"]
```

Explanation: The developer persona uses technical language, focuses on code, and provides detailed technical explanations.

6. planner.ts

```mermaid
graph TB
    Planner["planner.ts"] --> Export["export default Persona"]
    Export --> SystemPrompt["systemPrompt: 'You are Ave AI. You are a strategic planner, breaking tasks into organized steps...'"]
    Export --> DisplayName["displayName: 'Planner'"]
    Export --> ToneInstruction["toneInstruction: 'Strategic, organized, step-by-step'"]
```

Explanation: The planner persona uses strategic thinking, breaks tasks into steps, and provides organized action plans.

7. wise.ts

```mermaid
graph TB
    Wise["wise.ts"] --> Export["export default Persona"]
    Export --> SystemPrompt["systemPrompt: 'You are Ave AI. You are wise, insightful, and philosophical...'"]
    Export --> DisplayName["displayName: 'Wise'"]
    Export --> ToneInstruction["toneInstruction: 'Insightful, reflective, profound'"]
```

Explanation: The wise persona provides deep insights, philosophical perspectives, and reflective guidance.

8. index.ts (personas barrel)

```mermaid
graph TB
    Index["index.ts"] --> ReExport["export { adaptive, casual, creative, default, developer, planner, wise }"]
    ReExport --> ImportAdaptive["import adaptive from './adaptive'"]
    ReExport --> ImportCasual["import casual from './casual'"]
    ReExport --> ImportCreative["import creative from './creative'"]
    ReExport --> ImportDefault["import default from './default'"]
    ReExport --> ImportDeveloper["import developer from './developer'"]
    ReExport --> ImportPlanner["import planner from './planner'"]
    ReExport --> ImportWise["import wise from './wise'"]
```

Explanation: The barrel file aggregates all 8 persona modules and re‑exports them as a single object. The Orchestrator dynamically imports this file via import.meta.glob to load all personas at startup.

---

Rules

9. agent.ts

```mermaid
graph TB
    Agent["agent.ts"] --> Export["export default RuleSet"]
    Export --> MaxIter["maxIterations: 20"]
    Export --> MaxTime["maxTimeMs: 120000"]
    Export --> SelfCorrect["selfCorrection: true"]
    Export --> CorrectPrompt["correctionPrompt: 'Your last action was denied...'"]
    Export --> MaxRetries["defaultMaxRetries: 3"]
    Export --> AbortOnMax["abortOnMaxIterations: false"]
```

Explanation: Defines agent lifecycle parameters. maxIterations limits ReAct loop cycles. selfCorrection enables the LLM to adjust when actions are denied. defaultMaxRetries applies to tools unless overridden.

10. context.ts

```mermaid
graph TB
    Context["context.ts"] --> Export["export default RuleSet"]
    Export --> TokenBudget["tokenBudget: 65536"]
    Export --> CompressThresh["compressThreshold: 0.7"]
    Export --> MaxCompressRounds["maxCompressRounds: 3"]
    Export --> SummarizePrompt["summarizePrompt: 'Summarize this conversation into 3-5 key points...'"]
    Export --> MaxMessagesBeforeCompress["maxMessagesBeforeCompress: 20"]
```

Explanation: Controls memory management. tokenBudget matches OLLAMA_NUM_CTX. Compression triggers when token usage exceeds 70% of budget.

11. expert-mode.ts

```mermaid
graph TB
    Expert["expert-mode.ts"] --> Export["export default RuleSet"]
    Export --> AllowTools["allowTools: true"]
    Export --> AllowSkills["allowSkills: true"]
    Export --> AllowWeb["allowWeb: true"]
    Export --> RequireThought["requireThought: true"]
    Export --> StreamResponse["streamResponse: true"]
    Export --> EnableSkillChain["enableSkillChaining: true"]
    Export --> MaxIter["maxIterations: 20"]
    Export --> ThoughtFormat["thoughtFormat: 'ReAct'"]
```

Explanation: Expert mode enables full ReAct loop with tools, skills, web tools, streaming, and skill chaining. Forces structured thought/action/observation format.

12. fast-mode.ts

```mermaid
graph TB
    Fast["fast-mode.ts"] --> Export["export default RuleSet"]
    Export --> AllowTools["allowTools: false"]
    Export --> AllowSkills["allowSkills: false"]
    Export --> AllowWeb["allowWeb: false"]
    Export --> SinglePass["singlePass: true"]
    Export --> StreamResponse["streamResponse: false"]
    Export --> MaxResponseLen["maxResponseLength: 500"]
    Export --> RequireThought["requireThought: false"]
```

Explanation: Fast mode disables all tools and streaming. Single-pass, direct answer only. Limits response to 500 tokens.

13. global.ts

```mermaid
graph TB
    Global["global.ts"] --> Export["export default RuleSet"]
    Export --> MaxIterAll["maxIterations: 15"]
    Export --> MaxTime["maxTimeMs: 120000"]
    Export --> TokenBudget["tokenBudget: 65536"]
    Export --> MaxOutputTokens["maxOutputTokens: 4096"]
    Export --> RequireCitation["requireCitation: false"]
    Export --> Language["language: 'en'"]
    Export --> ModelFamily["modelFamily: 'qwen3'"]
    Export --> Temperature["defaultTemperature: 0.7"]
```

Explanation: Global rules apply to all modes. Sets overall limits on iterations, time, tokens, model family, and default generation parameters.

14. greeting.ts

```mermaid
graph TB
    Greeting["greeting.ts"] --> Export["export default RuleSet"]
    Export --> RequireGreeting["requireGreeting: true"]
    Export --> GreetingPrompt["greetingPrompt: 'Introduce yourself as Ave AI in 2-3 sentences...'"]
    Export --> GreetingMode["greetingMode: 'fast'"]
    Export --> MaxTokens["greetingMaxTokens: 150"]
    Export --> GreetingPersonaOverride["greetingPersonaOverride: null"]
```

Explanation: Forces auto-generated greeting for every new conversation. Uses Fast mode with a dedicated system prompt. The greeting is saved as the first assistant message and does not count toward iteration limits.

15. language.ts

```mermaid
graph TB
    Language["language.ts"] --> Export["export default RuleSet"]
    Export --> PromptLang["promptLang: 'en'"]
    Export --> UILang["uiLang: 'en'"]
    Export --> Fallback["fallbackLang: 'en'"]
    Export --> Allowed["allowedLangs: ['en','id','zh','ja','ko']"]
    Export --> TranslateOutput["translateOutput: false"]
```

Explanation: Defines language settings for prompts and UI. Supports English, Indonesian, Chinese, Japanese, Korean. translateOutput can be enabled to automatically translate the AI's response.

16. safety.ts

```mermaid
graph TB
    Safety["safety.ts"] --> Export["export default RuleSet"]
    Export --> Input["input: { piiDetection: true, injectionCheck: true, toxicityCheck: true }"]
    Export --> Output["output: { piiRedaction: true, toxicityCheck: true, toxicityThreshold: 0.7 }"]
    Export --> PIIPatterns["piiPatterns: [email, phone, creditCard, nik, ktp]"]
    Export --> InjectionPatterns["injectionPatterns: ['ignore previous', 'pretend you are', 'system prompt:', 'override safety']"]
    Export --> ToxicityInputThresh["toxicityThresholdInput: 0.8"]
    Export --> ToxicityAction["toxicityAction: 'block'"]
```

Explanation: Three-layer safety: PII detection (email, phone, credit card, NIK/KTP), prompt injection blacklist, and toxicity scoring. Inputs that exceed thresholds are blocked; outputs with PII are redacted.

17. thinking.ts

```mermaid
graph TB
    Thinking["thinking.ts"] --> Export["export default RuleSet"]
    Export --> RequireThought["requireThoughtTag: true"]
    Export --> Format["thoughtFormat: 'ReAct'"]
    Export --> MaxThoughtChars["thoughtMaxChars: 2000"]
    Export --> MaxObsChars["observationMaxChars: 3000"]
    Export --> ShowDefault["showThinkingDefault: true"]
    Export --> ModelSpecific["modelSpecificFormats: { qwen3: 'Use 思考 tags' }"]
```

Explanation: Controls thinking/reasoning behavior. requireThoughtTag forces LLM to include reasoning in Expert mode. Sets character limits for thought and observation display. Model-specific formats are injected for Qwen3.

18. tone.ts

```mermaid
graph TB
    Tone["tone.ts"] --> Export["export default RuleSet"]
    Export --> PersonaMap["personaToneMap: { adaptive:'flexible', casual:'relaxed', creative:'imaginative', ... }"]
    Export --> DefaultTone["defaultTone: 'balanced'"]
    Export --> Formality["formalityLevel: 'adaptive'"]
    Export --> Politeness["politenessLevel: 'polite'"]
```

Explanation: Maps persona display names to tone descriptors. Provides default tone when no persona tone is specified. formalityLevel adjusts verbosity and structure.

19. tools.ts

```mermaid
graph TB
    ToolsRule["tools.ts"] --> Export["export default RuleSet"]
    Export --> ReadFile["read-file: { allowedPaths: ['./data','./public','./uploads'], maxFileSize: 10485760, cacheTTL: 30000 }"]
    Export --> Calculator["calculator: { allowedOperations: ['+','-','*','/'], maxOperand: 1000000, cacheTTL: 10000 }"]
    Export --> WebSearch["web-search: { rateLimit: 10, rateWindowMs: 60000, fallbackTool: 'offline-search', cacheTTL: 300000 }"]
    Export --> Defaults["defaultMaxRetries: 3, defaultTimeoutMs: 30000, defaultCacheTTL: 60000"]
    Export --> AllowAllTools["allowAllTools: false (individual per‑tool rules apply)"]
```

Explanation: Per-tool rate limits, allowed parameters, fallbacks, and caching TTLs. Each tool can override defaults. Web search is limited to 10 calls per minute with an offline fallback.

20. index.ts (rules barrel)

```mermaid
graph TB
    Index["index.ts"] --> ReExport["export { agent, context, expertMode, fastMode, global, greeting, language, safety, thinking, tone, tools }"]
    ReExport --> A["import agent from './agent'"]
    ReExport --> C["import context from './context'"]
    ReExport --> E["import expertMode from './expert-mode'"]
    ReExport --> F["import fastMode from './fast-mode'"]
    ReExport --> G["import global from './global'"]
    ReExport --> Gr["import greeting from './greeting'"]
    ReExport --> L["import language from './language'"]
    ReExport --> S["import safety from './safety'"]
    ReExport --> T["import thinking from './thinking'"]
    ReExport --> To["import tone from './tone'"]
    ReExport --> Tr["import tools from './tools'"]
```

Explanation: Barrel file aggregates all 12 rule modules. The Rules Engine imports this single file and loads all rule sets into the evaluation pipeline.

---

End of flow-2.md. Continued in flow-3.md (Skills), flow-4.md (Tools + Web), and flow-5.md (Helpers).