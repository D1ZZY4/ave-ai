flow-18.md — Agent Feedback & Behavior Adaptation

---

1. Feedback Collection UI (MessageBubble Extension)

```mermaid
flowchart TD
    AssistantMsg["Assistant message rendered in MessageBubble (flow-9 #9)"] --> FeedbackRow["Feedback row: thumbs-up / thumbs-down icons"]
    FeedbackRow --> ThumbsUp["User clicks thumbs-up"]
    FeedbackRow --> ThumbsDown["User clicks thumbs-down"]

    ThumbsUp --> RecordPositive["Dispatch: recordFeedback({ conversationId, messageId, rating: 'positive', timestamp })"]
    ThumbsDown --> OpenReasonDialog["Open optional reason dialog"]
    OpenReasonDialog --> ReasonOptions["Options: 'Not helpful', 'Too verbose', 'Incorrect', 'Off-topic', 'Other'"]
    ReasonOptions --> UserSelects["User selects reason + optional free-text comment"]
    UserSelects --> RecordNegative["Dispatch: recordFeedback({ rating: 'negative', reason, comment })"]

    RecordPositive --> StoreFeedback["Store in conversation.feedback[] via Zustand (flow-9 #1)"]
    RecordNegative --> StoreFeedback
    StoreFeedback --> VisualConfirmation["Update icon: filled thumbs-up/down, disabled"]
    VisualConfirmation --> EnableRetry["Retry button now also uses feedback context"]
```

Explanation:

· Each assistant message bubble gets a feedback row with thumbs-up/down icons (see flow-9 #9 for MessageBubble rendering).
· Positive feedback is recorded instantly; negative feedback prompts for optional reason selection.
· Feedback is stored per-message in the conversation's feedback[] array in the Zustand chat store (see flow-9 #1).
· Once feedback is given, the icon is filled and disabled to prevent duplicate votes.
· The Retry action (see flow-7 #17) can use feedback context to improve the regeneration.

---

2. Feedback Storage & Aggregation

```mermaid
graph TB
    subgraph FeedbackStore["Feedback Storage (per conversation)"]
        FeedbackArray["conversation.feedback[]"]
        FeedbackEntry["Each entry: { messageId, rating, reason?, comment?, timestamp, toolCallsUsed, personaUsed, modeUsed }"]
    end

    subgraph Aggregation["Aggregation Logic"]
        AggregateByPersona["Aggregate by persona: positive/negative ratio"]
        AggregateByTool["Aggregate by tool: feedback when tool X was used"]
        AggregateByMode["Aggregate by mode: Fast vs Expert feedback"]
        AggregateByTime["Aggregate by time: improvement over time"]
    end

    FeedbackArray --> AggregateByPersona
    FeedbackArray --> AggregateByTool
    FeedbackArray --> AggregateByMode
    FeedbackArray --> AggregateByTime

    AggregateByPersona --> PersonaScore["Persona score card: % positive"]
    AggregateByTool --> ToolEffectiveness["Tool effectiveness: % positive when tool used"]
    AggregateByMode --> ModePreference["Mode preference: which mode gets better feedback"]
    AggregateByTime --> ImprovementTrend["Improvement trend: is feedback getting better?"]

    Aggregation --> StatisticsModal["StatisticsModal (flow-17) — new Feedback tab"]
```

Explanation:

· Feedback entries store rich context: which tools were called, which persona was active, and which mode was used.
· Aggregation computes scores across four dimensions: persona, tool, mode, and time.
· Aggregated data is displayed in a new Feedback tab within the Statistics modal (see flow-17).
· No backend needed; all aggregation is client-side from Zustand + localStorage data.

---

3. Feedback-Driven Rule Adjustment

```mermaid
flowchart TD
    Trigger["Threshold triggered: >20 feedback entries with >70% negative"] --> AnalyzeReason["Analyze most common negative reasons"]
    AnalyzeReason --> ReasonType{"Dominant reason?"}
    ReasonType -->|"Too verbose"| AdjustTone["Auto-adjust tone rule: reduce verbosity"]
    ReasonType -->|"Not helpful"| AdjustTools["Suggest enabling more tools or switching persona"]
    ReasonType -->|"Incorrect"| AdjustThinking["Increase thinking iterations or enable web search"]
    ReasonType -->|"Off-topic"| AdjustContext["Suggest clearing memory facts or shortening context"]
    ReasonType -->|"Other"| ManualSuggestion["Show suggestion to user: 'Try adjusting X setting'"]

    AdjustTone --> UpdateToneRule["Modify persona tone override in localStorage"]
    AdjustTools --> SuggestToolsToggle["Show notification: 'Enable web tools for better results?'"]
    AdjustThinking --> SuggestExpertMode["Show notification: 'Switch to Expert mode for complex tasks?'"]
    AdjustContext --> SuggestMemoryClean["Show notification: 'Clear old memory facts?'"]
    
    UpdateToneRule --> ApplyNextPrompt["Applied on next LLM prompt via Prompt Assembler (flow-7 #4)"]
```

Explanation:

· When feedback crosses a configurable threshold (default: 20 entries, >70% negative), the system analyzes common reasons.
· Based on the dominant reason, the system auto-adjusts rules or suggests changes to the user.
· Tone adjustments are automatically applied to the persona override in localStorage (see flow-8 #10 for system prompt customization).
· Other adjustments show actionable notifications to the user.
· All adjustments feed into the Prompt Assembler (see flow-7 #4) on the next LLM call.

---

4. Feedback-Driven Memory Updates

```mermaid
flowchart TD
    PositiveFeedback["User gives positive feedback"] --> ExtractConfirmingFact["Extract facts from positively-rated response"]
    ExtractConfirmingFact --> BoostConfidence["Boost confidence of matching memory facts by +0.2"]
    BoostConfidence --> MarkSource["Add source: 'confirmed by user feedback'"]

    NegativeFeedback["User gives negative feedback"] --> ExtractConflictingFact["Extract facts from negatively-rated response"]
    ExtractConflictingFact --> ReduceConfidence["Reduce confidence of matching memory facts by -0.3"]
    ReduceConfidence --> CheckThreshold{"Confidence < 0.3?"}
    CheckThreshold -->|"Yes"| RemoveFact["Remove low-confidence fact from memory"]
    CheckThreshold -->|"No"| KeepWithReduction["Keep fact with reduced confidence"]

    BoostConfidence --> PersistMemory["Save updated facts to IndexedDB (flow-12 #3)"]
    RemoveFact --> PersistMemory
    KeepWithReduction --> PersistMemory
```

Explanation:

· Feedback directly affects the long-term memory system (see flow-12 for memory architecture).
· Positively-rated responses boost the confidence of related facts, reinforcing correct information.
· Negatively-rated responses reduce confidence, eventually removing incorrect facts when confidence drops below 0.3.
· This creates a self-correcting memory system that learns from user feedback.
· All changes are persisted to IndexedDB via the memory store (see flow-12 #3).

---

5. Feedback Loop — End-to-End Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as MessageBubble
    participant S as Zustand Store
    participant F as Feedback Analyzer
    participant R as Rules Engine
    participant M as Memory System

    U->>UI: Receives assistant response
    UI-->>U: Show response + feedback buttons
    U->>UI: Clicks thumbs-down + "Incorrect"
    UI->>S: dispatch recordFeedback({ rating: 'negative', reason: 'Incorrect' })
    S->>F: Feedback counter updated
    F->>F: Analyze: >70% negative, reason: Incorrect
    F->>R: Suggest: enable thinking + web search
    R->>S: dispatch updateSetting({ enableThinking: true, enableTools: true })
    S-->>U: Notification: "Switched to Expert mode with web tools for better accuracy"
    F->>M: Reduce confidence of facts from this response
    M->>M: If confidence < 0.3, remove fact

    U->>UI: Clicks Retry (flow-7 #17)
    UI->>S: dispatch retryMessage()
    S->>S: Rebuild prompt with adjusted settings + cleaned memory
    Note over U,S: Next response benefits from feedback adjustments
```

Explanation:

· End-to-end feedback loop shows the full lifecycle from user action to system adaptation.
· Negative feedback triggers immediate suggestions and optional auto-adjustments.
· Memory system is automatically cleaned based on feedback, ensuring accuracy over time.
· Retry actions (see flow-7 #17) benefit from adjusted settings and cleaned memory on the next generation.

---

6. Feedback Tab in StatisticsModal

```mermaid
graph TB
    FeedbackTab["Feedback Tab (in StatisticsModal, flow-17)"] --> FeedbackOverview["Feedback Overview Cards"]
    FeedbackOverview --> TotalFeedback["Total Feedback: {count}"]
    FeedbackOverview --> PositivePercent["Positive: {percent}%"]
    FeedbackOverview --> NegativePercent["Negative: {percent}%"]
    FeedbackOverview --> MostCommonReason["Most Common Reason: {reason}"]

    FeedbackTab --> FeedbackChart["Feedback Over Time"]
    FeedbackChart --> LineChart["Line chart: positive vs negative over time"]
    FeedbackChart --> TrendLine["Trend line: is feedback improving?"]

    FeedbackTab --> PerPersonaFeedback["Feedback by Persona"]
    PerPersonaFeedback --> PersonaBarChart["Bar chart: positive/negative per persona"]

    FeedbackTab --> PerToolFeedback["Feedback by Tool Usage"]
    PerToolFeedback --> ToolEffectivenessTable["Table: Tool | Calls | Positive Feedback %"]

    FeedbackTab --> SuggestedActions["Suggested Actions"]
    SuggestedActions --> ActionCard1["Consider switching to Expert mode (85% positive vs 60% in Fast)"]
    SuggestedActions --> ActionCard2["Enable web-search for factual queries (positive feedback +30%)"]
    SuggestedActions --> ActionCard3["Clear 5 low-confidence memory facts (conf < 0.3)"]

    ActionCard1 --> ApplyButton["'Apply' button next to each suggestion"]
```

Explanation:

· A new Feedback tab is added to the Statistics modal (see flow-17 for existing tabs).
· Provides comprehensive visualization of feedback trends over time, by persona, and by tool usage.
· Suggested actions are computed from feedback patterns and presented as actionable cards.
· Each suggestion has an "Apply" button that triggers the recommended action (e.g., switch mode, clear memory).
· All data is client-side, computed from the feedback entries stored in conversations.

---

7. Integration with Existing System

```mermaid
graph TB
    subgraph ExistingSystem["Existing Components"]
        ChatStore["chat.tsx (flow-9 #1) — stores feedback per message"]
        SettingsStore["settings.tsx (flow-9 #2) — adjusted settings"]
        MemorySystem["memory/ (flow-12) — fact confidence updates"]
        PromptAssembler["Prompt Assembler (flow-7 #4) — uses adjusted tone"]
        StatisticsModal["StatisticsModal (flow-17) — new Feedback tab"]
        RulesEngine["Rules Engine (flow-1 #7) — tone adjustments applied"]
    end

    subgraph NewComponents["New Components"]
        FeedbackCollector["Feedback Collection UI (diagram 1)"]
        FeedbackAnalyzer["Feedback Analyzer (diagram 2)"]
        RuleAdjuster["Rule Adjuster (diagram 3)"]
        MemoryUpdater["Memory Confidence Updater (diagram 4)"]
    end

    FeedbackCollector --> ChatStore
    ChatStore --> FeedbackAnalyzer
    FeedbackAnalyzer --> RuleAdjuster
    FeedbackAnalyzer --> MemoryUpdater
    RuleAdjuster --> SettingsStore
    RuleAdjuster --> RulesEngine
    MemoryUpdater --> MemorySystem
    MemorySystem --> PromptAssembler
    SettingsStore --> PromptAssembler

    FeedbackAnalyzer --> StatisticsModal
    FeedbackAnalyzer --> MemorySystem
```

Explanation:

· All new feedback components integrate seamlessly with existing architecture.
· Feedback flows from UI → store → analyzer → rule/memory adjustments → prompt assembler.
· The Statistics modal gains a new tab without modifying existing tabs.
· No backend changes required; all processing is client-side.

---

End of flow-18.md. This covers the complete feedback loop system: collection UI, storage, aggregation, rule adjustment, memory updates, end-to-end flow, statistics integration, and system architecture. The agent now learns and adapts from user feedback, improving over time like a true personal AI agent.