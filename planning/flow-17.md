flow-17.md — Statistics Dashboard & Analytics

---

1. StatisticsModal.tsx — Component Architecture

```mermaid
flowchart TD
    Open["User opens Statistics from Header or Sidebar"] --> Modal["StatisticsModal.tsx renders"]
    Modal --> Tabs["Tabs: Overview, Tokens, Tools, Skills, Conversations, Performance"]

    Tabs --> OverviewTab["Overview Tab"]
    OverviewTab --> TotalConvs["Total Conversations: count from store"]
    OverviewTab --> TotalMessages["Total Messages: sum across all conversations"]
    OverviewTab --> AvgResponseTime["Avg Response Time: total time / total responses"]
    OverviewTab --> ActiveModel["Active Model: from settings store"]
    OverviewTab --> UptimeSession["Session Uptime: time since app mount"]

    Tabs --> TokensTab["Tokens Tab"]
    TokensTab --> TokenOverview["Token Usage Overview"]
    TokenOverview --> TotalTokensUsed["Total tokens used: sum across all conversations"]
    TokenOverview --> AvgTokensPerMsg["Avg tokens per message: total / message count"]
    TokenOverview --> TokenBudgetRemaining["Budget remaining: budget - current"]
    TokenOverview --> CompressionCount["Compression events: count from store"]
    TokenOverview --> TokenChart["Token usage chart: bar chart by conversation"]

    Tabs --> ToolsTab["Tools Tab"]
    Tabs --> SkillsTab["Skills Tab"]
    Tabs --> ConversationsTab["Conversations Tab"]
    Tabs --> PerformanceTab["Performance Tab"]
```

Explanation:

· Statistics modal is accessible from the Header or Sidebar (see flow-11 #3 for Header, flow-9 #11 for Sidebar).
· Six tabs provide comprehensive analytics on AI usage.
· Data is sourced from the Zustand chat store (flow-9 #1), settings store (flow-9 #2), and the process log.
· All statistics are computed client-side from stored data; no server calls needed.

---

2. Data Sources & Tracking Architecture

```mermaid
graph TB
    subgraph DataSources["Data Sources"]
        ChatStore["chat.tsx store (flow-9 #1)"]
        SettingsStore["settings.tsx store (flow-9 #2)"]
        ProcessLog["processLog[] per conversation"]
        MemoryStore["memory/ IndexedDB (flow-12 #3)"]
    end

    subgraph TrackedMetrics["Tracked Metrics"]
        MessageMetrics["Messages: count, lengths, timestamps"]
        ToolMetrics["Tool calls: count, success rate, rate limits"]
        SkillMetrics["Skill executions: count, tool chains"]
        TokenMetrics["Tokens: per message, per conversation, total"]
        TimeMetrics["Response times, session duration"]
        ErrorMetrics["Error count, types, recovery rate"]
    end

    ChatStore --> MessageMetrics
    ChatStore --> TokenMetrics
    ChatStore --> TimeMetrics
    ProcessLog --> ToolMetrics
    ProcessLog --> SkillMetrics
    ProcessLog --> ErrorMetrics
    SettingsStore --> TokenMetrics
    MemoryStore --> MessageMetrics

    subgraph StatisticsUI["StatisticsModal.tsx"]
        ComputedStats["Computed statistics with filters"]
        Charts["Chart visualizations"]
        ExportStats["Export statistics as JSON/CSV"]
    end

    MessageMetrics --> ComputedStats
    ToolMetrics --> ComputedStats
    SkillMetrics --> ComputedStats
    TokenMetrics --> ComputedStats
    TimeMetrics --> ComputedStats
    ErrorMetrics --> ComputedStats
    ComputedStats --> Charts
    ComputedStats --> ExportStats
```

Explanation:

· Statistics are computed from four data sources: chat store, settings store, process logs, and memory store.
· Metrics are tracked automatically during normal operation (no additional overhead).
· Process logs capture tool calls, skill executions, and errors (see flow-11 #1 ActivityLog).
· Statistics are computed client-side and rendered as charts; export supports JSON and CSV formats.
· Token data is tracked per conversation and aggregated globally (see flow-8 #4 for token display).

---

3. Overview Tab — Key Metrics

```mermaid
graph TB
    Overview["Overview Tab"] --> MetricCards["Metric Cards Grid"]
    MetricCards --> Card1["Total Conversations: {count}"]
    MetricCards --> Card2["Total Messages: {count}"]
    MetricCards --> Card3["Avg Response Time: {ms}s"]
    MetricCards --> Card4["Active Model: {modelName}"]
    MetricCards --> Card5["Session Duration: {hh:mm:ss}"]
    MetricCards --> Card6["Memory Facts: {count}"]

    Overview --> RecentActivity["Recent Activity Timeline"]
    RecentActivity --> Activity1["2 min ago: Tool 'web-search' called"]
    RecentActivity --> Activity2["5 min ago: Skill 'summarize' executed"]
    RecentActivity --> Activity3["10 min ago: Conversation 'Project Planning' created"]
    RecentActivity --> Activity4["15 min ago: Memory fact 'user_name' saved"]

    Overview --> DailyUsage["Daily Usage Chart"]
    DailyUsage --> DailyMessages["Messages per day (bar chart)"]
    DailyUsage --> DailyTokens["Tokens per day (line chart)"]
    DailyUsage --> DailyTools["Tool calls per day (stacked bar)"]
```

Explanation:

· Overview tab shows at-a-glance key metrics in a card grid layout.
· Recent activity timeline shows the last 20 events from the process log.
· Daily usage charts provide trends over time (from conversation timestamps).
· Data refreshes when the modal opens (uses current store state).
· All metrics are computed from data already tracked in the Zustand stores.

---

4. Tokens Tab — Detailed Token Analytics

```mermaid
graph TB
    TokensTab["Tokens Tab"] --> TokenSummary["Token Summary Cards"]
    TokenSummary --> TotalIn["Total Input Tokens: {count}"]
    TokenSummary --> TotalOut["Total Output Tokens: {count}"]
    TokenSummary --> TotalAll["Total Tokens: {count}"]
    TokenSummary --> BudgetUsed["Budget Used: {percent}%"]
    TokenSummary --> CompressionCount["Compressions: {count}"]

    TokensTab --> PerConversation["Per Conversation Breakdown"]
    PerConversation --> ConvTable["Table: Conversation | Input | Output | Total | % Budget"]
    ConvTable --> Sortable["Sortable columns: click to sort ascending/descending"]

    TokensTab --> TokenChart["Token Usage Over Time"]
    TokenChart --> LineChart["Line chart: input tokens (blue), output tokens (green), total (black)"]
    TokenChart --> CumulativeArea["Cumulative area chart: total tokens over all conversations"]

    TokensTab --> CompressionStats["Compression Statistics"]
    CompressionStats --> TotalSaved["Total tokens saved: {count}"]
    CompressionStats --> AvgReduction["Avg reduction per compression: {percent}%"]
    CompressionStats --> LastCompression["Last compression: {timestamp}"]
```

Explanation:

· Token analytics leverage data from the tokenizer helper (see flow-6 #16) and compression helper (see flow-6 #3).
· Per-conversation breakdown with sortable columns for easy analysis.
· Charts show token consumption trends and compression savings.
· Token budget (65536 from flow-2 #10) is used to calculate percentage utilization.
· Compression events are counted and analyzed for efficiency.

---

5. Tools Tab — Tool Usage Statistics

```mermaid
graph TB
    ToolsTab["Tools Tab"] --> ToolOverview["Tool Overview Cards"]
    ToolOverview --> TotalCalls["Total Tool Calls: {count}"]
    ToolOverview --> UniqueTools["Unique Tools Used: {count}"]
    ToolOverview --> SuccessRate["Success Rate: {percent}%"]
    ToolOverview --> AvgTime["Avg Execution Time: {ms}ms"]

    ToolsTab --> ToolTable["Tool Usage Table"]
    ToolTable --> Columns["Columns: Tool Name | Calls | Success | Failed | Avg Time | Rate Limited"]
    Columns --> Sortable["Sortable by any column"]

    ToolsTab --> ToolChart["Tool Usage Chart"]
    ToolChart --> BarChart["Bar chart: calls per tool (color: success/fail/rate-limited)"]
    ToolChart --> PieChart["Pie chart: distribution of tool usage percentages"]

    ToolsTab --> RateLimitStats["Rate Limit Statistics"]
    RateLimitStats --> TotalRateLimited["Total Rate Limited Calls: {count}"]
    RateLimitStats --> AvgWaitTime["Avg Wait Time: {ms}ms"]
    RateLimitStats --> PerToolLimits["Per-tool breakdown of rate limit hits"]

    ToolsTab --> ToolTimeline["Tool Call Timeline"]
    ToolTimeline --> ScatterPlot["Scatter plot: tool call vs time (color by tool)"]
```

Explanation:

· Tool statistics are derived from the process log (see flow-11 #1) and rate limiter (see flow-6 #12).
· Success rate tracks tool calls that returned without errors.
· Rate limit statistics show how often external tools hit their configured limits.
· Timeline visualization helps identify patterns in tool usage during conversations.
· All tool rules from flow-2 #19 are referenced for rate limit configuration display.

---

6. Skills Tab — Skill Execution Statistics

```mermaid
graph TB
    SkillsTab["Skills Tab"] --> SkillOverview["Skill Overview Cards"]
    SkillOverview --> TotalExec["Total Skill Executions: {count}"]
    SkillOverview --> UniqueSkills["Unique Skills Used: {count}"]
    SkillOverview --> AvgSteps["Avg Steps per Skill: {count}"]
    SkillOverview --> CompletionRate["Completion Rate: {percent}%"]

    SkillsTab --> SkillTable["Skill Execution Table"]
    SkillTable --> Columns["Columns: Skill Name | Executions | Steps | Success | Failed | Tools Called"]
    Columns --> Expandable["Expandable rows: show step details and tool chains"]

    SkillsTab --> SkillChart["Skill Usage Chart"]
    SkillChart --> BarChart["Bar chart: executions per skill"]
    SkillChart --> StackedBar["Stacked bar: success vs failure per skill"]

    SkillsTab --> ToolChainView["Tool Chain Visualization"]
    ToolChainView --> FlowChart["Flow chart: skill → tool dependencies executed"]
    FlowChart --> Highlighted["Highlighted: most common tool chains"]

    SkillsTab --> SkillRecommendations["Skill Recommendations"]
    SkillRecommendations --> UnusedSkills["Underutilized skills that match usage patterns"]
```

Explanation:

· Skill statistics track composite workflow executions (see flow-3 #1-15 for all skills).
· Tool chain visualization shows which tools are most commonly used together.
· Expandable table rows reveal detailed step-by-step execution paths.
· Skill recommendations suggest underutilized skills based on usage patterns.
· Data sourced from process log and skill registry (see flow-3 #15 for skills index).

---

7. Conversations Tab — Conversation Analytics

```mermaid
graph TB
    ConvTab["Conversations Tab"] --> ConvOverview["Conversation Overview Cards"]
    ConvOverview --> TotalConv["Total Conversations: {count}"]
    ConvOverview --> ActiveToday["Active Today: {count}"]
    ConvOverview --> AvgLength["Avg Messages per Conv: {count}"]
    ConvOverview --> AvgDuration["Avg Conversation Duration: {mm:ss}"]

    ConvTab --> ConvTable["Conversation Table"]
    ConvTable --> Columns["Columns: Title | Messages | Tools Used | Tokens | Duration | Created"]
    Columns --> Clickable["Clickable: click row to view conversation details"]

    ConvTab --> LengthChart["Conversation Length Distribution"]
    LengthChart --> Histogram["Histogram: conversations by message count (bins: 1-5, 6-10, 11-20, 20+)"]
    
    ConvTab --> PersonaStats["Persona Usage Statistics"]
    PersonaStats --> PersonaPie["Pie chart: conversation distribution by persona"]
    PersonaStats --> PersonaTable["Table: Persona | Conversations | Avg Length | Most Used Tools"]

    ConvTab --> ModeStats["Mode Usage Statistics"]
    ModeStats --> ModePie["Pie chart: Fast vs Expert mode distribution"]
    ModeStats --> ModeComparison["Comparison: avg response time, tool usage by mode"]
```

Explanation:

· Conversation analytics provide insights into usage patterns over time.
· Persona statistics show which AI personalities are used most (see flow-2 #1-8 for personas).
· Mode comparison helps understand Fast vs Expert mode preferences (see flow-1 #6).
· Histogram shows conversation length distribution for capacity planning.
· Clickable table rows open the History modal for detailed conversation review (see flow-11 #5).

---

8. Performance Tab — System Performance

```mermaid
graph TB
    PerfTab["Performance Tab"] --> PerfOverview["Performance Overview Cards"]
    PerfOverview --> AvgRespTime["Avg Response Time: {ms}ms"]
    PerfOverview --> P95RespTime["P95 Response Time: {ms}ms"]
    PerfOverview --> SlowestTool["Slowest Tool: {toolName} ({ms}ms)"]
    PerfOverview --> FastestTool["Fastest Tool: {toolName} ({ms}ms)"]

    PerfTab --> ResponseTimeChart["Response Time Distribution"]
    ResponseTimeChart --> BoxPlot["Box plot: response times by conversation"]
    ResponseTimeChart --> PercentileChart["Percentile chart: P50, P75, P90, P95, P99"]

    PerfTab --> ToolPerfTable["Tool Performance Table"]
    ToolPerfTable --> ToolColumns["Columns: Tool | Calls | Avg | Min | Max | P95 | StdDev"]
    ToolColumns --> HighlightSlow["Highlight: red for slow tools (> 5s avg)"]

    PerfTab --> ModelPerfComparison["Model Performance Comparison"]
    ModelPerfComparison --> ModelTable["Table: Model | Responses | Avg Time | Avg Tokens | Error Rate"]

    PerfTab --> MemoryUsage["Memory & Storage Usage"]
    MemoryUsage --> LSSize["localStorage Size: {KB}"]
    MemoryUsage --> IDBSize["IndexedDB Size: {KB}"]
    MemoryUsage --> CacheEntries["Cache Entries: {count}"]
    MemoryUsage --> ClearBtn["'Clear Cache' button"]
```

Explanation:

· Performance metrics help identify bottlenecks in tool execution and LLM response times.
· Response time distribution shows overall system responsiveness.
· Tool performance table identifies slow tools that may need optimization.
· Model comparison helps choose the best model for the user's hardware.
· Memory usage monitoring shows local storage consumption and allows cache clearing.
· Data sourced from process log timestamps and browser storage APIs.

---

9. Statistics Data Collection Flow

```mermaid
flowchart TD
    Event["System event occurs"] --> DetermineType{"Event type?"}
    
    DetermineType -->|"Message sent"| TrackMessage["Increment message counter for conversation"]
    DetermineType -->|"LLM response"| TrackResponse["Record: response time, token count, model used"]
    DetermineType -->|"Tool called"| TrackTool["Record: tool name, params, execution time, success/fail"]
    DetermineType -->|"Skill executed"| TrackSkill["Record: skill name, steps, tools called, duration"]
    DetermineType -->|"Error occurred"| TrackError["Record: error type, tool, conversation, timestamp"]
    DetermineType -->|"Compression ran"| TrackCompression["Record: tokens before/after, time saved"]

    TrackMessage --> StoreMetrics["Store metric to conversation.analytics object"]
    TrackResponse --> StoreMetrics
    TrackTool --> StoreMetrics
    TrackSkill --> StoreMetrics
    TrackError --> StoreMetrics
    TrackCompression --> StoreMetrics

    StoreMetrics --> PersistToStore["Zustand store holds analytics per conversation"]
    PersistToStore --> StatisticsReads["StatisticsModal reads and aggregates"]

    StatisticsReads --> RealTimeCalc["Real-time computation on modal open"]
```

Explanation:

· Data collection happens automatically during normal operation (zero overhead).
· Each event type increments or records relevant metrics in the conversation's analytics object.
· Metrics are persisted with conversations in the Zustand store and localStorage (see flow-9 #1).
· StatisticsModal reads raw data and computes aggregates on open (real-time calculation).
· No separate telemetry or analytics service needed; all data is client-side.

---

10. Integration with Components

```mermaid
graph TB
    subgraph ParentComponents["Parent Components"]
        Header["Header.tsx (flow-11 #3)"]
        Sidebar["Sidebar.tsx (flow-9 #11)"]
    end

    subgraph ModalComponent["StatisticsModal.tsx"]
        Overview["Overview Tab"]
        Tokens["Tokens Tab"]
        ToolsStat["Tools Tab"]
        SkillsStat["Skills Tab"]
        Conversations["Conversations Tab"]
        Performance["Performance Tab"]
        Export["Export Button"]
    end

    subgraph DataDependencies["Data Dependencies"]
        ChatStore["chat.tsx (flow-9 #1)"]
        SettingsStore["settings.tsx (flow-9 #2)"]
        ProcessLogs["processLog per conversation"]
        BrowserAPIs["localStorage, IndexedDB size"]
    end

    Header -->|"Statistics button"| ModalComponent
    Sidebar -->|"Statistics button"| ModalComponent
    ModalComponent --> DataDependencies
    Export -->|"JSON"| DownloadJSON["Download statistics.json"]
    Export -->|"CSV"| DownloadCSV["Download statistics.csv"]
```

Explanation:

· Statistics modal can be opened from the Header statistics button or from the Sidebar.
· Six tabs provide comprehensive analytics views (diagrams 1-8 above).
· Export functionality allows downloading statistics as JSON or CSV for external analysis.
· All data dependencies are existing stores; no new data collection infrastructure needed.
· Modal is lazy-loaded for performance (only loads when opened).

---

End of flow-17.md. This covers the complete Statistics Dashboard with six analytical tabs, data collection architecture, visualization components, and integration with existing system components. Continued in flow-18.md (Advanced Agent Behaviors & User Preferences).