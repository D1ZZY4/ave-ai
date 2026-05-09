flow-11.md — UI Components Detail

This file provides detailed diagrams and explanations for key UI components not yet individually diagrammed: ActivityLog, ChoiceCards, Header, QuestionForm, HistoryModal, SkillsModal, ToolsModal, and WebModal. These components are part of the frontend; their overall placement is shown in flow‑9 diagram 7 (Component Tree).

---

1. ActivityLog.tsx

```mermaid
flowchart TD
    Render["ActivityLog renders"] --> CheckToggle{"showProcessLog setting?"}
    CheckToggle -->|"false"| Empty["Render nothing (hidden)"]
    CheckToggle -->|"true"| Container["<div> with max‑height, overflow‑y scroll"]
    Container --> Logs["Map over conversation.processLog[] (Zustand selector)"]
    Logs --> Entry["Each log entry: { timestamp, type, message, data? }"]
    Entry --> TypeIcon["Icon by type: 'success' (green check), 'error' (red x), 'warning' (yellow !), 'info' (blue i)"]
    Entry --> TimeBadge["Relative timestamp (e.g., '2s ago')"]
    Entry --> Message["Message text (e.g., 'Tool read‑file executed')"]
    Entry --> DetailToggle["Click to expand/collapse detail (parameters, result snippet)"]
    DetailToggle --> JSONView["JSON.stringify(data, null, 2) inside <pre>"]
    Logs --> AutoScroll["useEffect: scroll to bottom when new log added"]
```

Explanation: The ActivityLog panel shows a real‑time feed of all process events (tool calls, rule evaluations, errors). Its visibility is gated by the showProcessLog setting. Each entry displays an icon, timestamp, message, and expandable detail view. Auto‑scroll keeps the latest entry visible. Data is sourced from conversation.processLog[] via a Zustand selector.

---

2. ChoiceCards.tsx

```mermaid
flowchart TD
    Receive["Receives options[] from parent (Chat.tsx)"] --> Render["If options.length > 0, render container"]
    Render --> Grid["Render flex-wrap grid of <button> elements"]
    Grid --> Card["Each button: { icon?, label, value }"]
    Card --> Hover["Hover: background highlight, cursor pointer"]
    Card --> Click["onClick: call handleSelection(value) from helpers/parse-selection-to-ui.ts"]
    Click --> Disappear["After click: fade‑out animation, then remove all ChoiceCards"]
    Appear["When new options arrive: fade‑in animation"] --> Render
```

Explanation: ChoiceCards presents clickable option buttons generated from the LLM's structured responses. Options are passed as a prop from the parent Chat component. Clicking a card calls the selection handler which dispatches a new user message with the selected value. The cards animate in when options appear and fade out after a selection is made.

---

3. Header.tsx

```mermaid
graph TB
    Header["Header.tsx"] --> LeftSection["Left: Logo / App Name (clickable → Home)"]
    Header --> CenterSection["Center: Mode Toggle + Token Bar"]
    Header --> RightSection["Right: PersonaSelector + ModelSelector + Settings Button"]

    CenterSection --> ModeToggle["Mode Toggle: two buttons 'Fast' / 'Expert'; active highlighted"]
    ModeToggle --> DispatchMode["onClick: dispatch updateSetting('mode', value)"]
    CenterSection --> TokenBar["Token Bar: progress bar showing used/total tokens"]
    TokenBar --> TokenTooltip["Tooltip on hover: '12,340 / 65,536 tokens used'"]
    TokenBar --> ColorChange["Color: green (<50%), yellow (50‑80%), red (>80%)"]

    RightSection --> PersonaSelector["PersonaSelector: dropdown of persona displayNames"]
    RightSection --> ModelSelector["ModelSelector: dropdown of available models (from useModels)"]
    RightSection --> SettingsBtn["Settings gear icon: opens SettingsModal"]
```

Explanation: The header provides global navigation and status. The left shows the app name (link to home). The center contains the Fast/Expert mode toggle and a token usage progress bar with color thresholds. The right side includes dropdowns for persona and model selection, plus a button to open the Settings modal. State is managed via Zustand selectors and actions.

---

4. QuestionForm.tsx

```mermaid
flowchart TD
    Render["QuestionForm renders"] --> Structure["Container: flex-col, gap"]
    Structure --> TextArea["Textarea for main question input (auto‑resize)"]
    Structure --> AttachmentsRow["Attachments row: thumbnail previews"]
    Structure --> ActionRow["Action row: Attach button + Submit button"]

    AttachButton["Attach button: paperclip icon"] --> Menu["Dropdown: 'Camera', 'Gallery', 'Record Voice'"]
    Menu --> Camera["Camera: <input type='file' capture='environment'> → base64"]
    Menu --> Gallery["Gallery: <input type='file' accept='image/*'> → base64"]
    Menu --> Voice["Voice: start MediaRecorder → stop → blob → Whisper STT"]
    Camera --> Preview["Add to attachments[] state, show thumbnail"]
    Gallery --> Preview
    Voice --> InsertText["Insert transcript into textarea (do not attach)"]

    SubmitButton["Submit button: arrow icon"] --> Validate["Check: textarea not empty OR attachments.length > 0"]
    Validate -->|"Valid"| BuildMessage["Build message object: { content: textarea.value, images?: base64[] }"]
    BuildMessage --> Dispatch["dispatch(sendMessage({ input: message, conversationId }))"]
    Dispatch --> Clear["Clear textarea and attachments, reset form"]
```

Explanation: QuestionForm is the primary input component that supports text, image, and voice input. It maintains local state for attachments and text. The submit button builds a message object with optional base64-encoded images and dispatches it via useChat.sendMessage. Voice input is transcribed and inserted into the textarea rather than attached.

---

5. HistoryModal.tsx

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Opened : "User clicks History icon"
    Opened --> Closed : "Close button / Escape"

    state Opened {
        [*] --> Listing : "Load conversations from store"
        Listing --> Search : "User types in search bar"
        Search --> Filtered : "List updates to show matches"
        Listing --> Select : "User clicks a conversation"
        Select --> Preview : "Show conversation details (title, date, message count)"
        Preview --> Export : "User clicks Export"
        Export --> FormatChoice : "Choose JSON / Markdown / PDF"
        FormatChoice --> Download : "Trigger file download"
        Listing --> DeleteSingle : "User clicks delete on an item"
        DeleteSingle --> ConfirmSingle : "Confirmation dialog"
        ConfirmSingle --> Listing : "Conversation removed"
        Listing --> DeleteAll : "User clicks 'Clear All History'"
        DeleteAll --> ConfirmAll : "Confirmation dialog"
        ConfirmAll --> Listing : "All conversations removed, store cleared"
    }
```

Explanation: The History modal provides a comprehensive view of all saved conversations. It supports searching, previewing individual conversations, exporting single conversations in multiple formats, and bulk or individual deletion. State is derived from the Zustand chat store (conversations map).

---

6. SkillsModal.tsx

```mermaid
flowchart TD
    Modal["SkillsModal opened"] --> Tabs["Tabs: 'Installed' | 'Remote (Skills.sh)'"]
    Tabs -->|"Installed"| InstalledList
    Tabs -->|"Remote"| RemotePanel

    InstalledList["Installed tab"] --> FetchLocal["Get all registered skills from global Skill Registry"]
    FetchLocal --> LocalCards["Display each skill as a card: name, description, enabled toggle"]
    LocalCards --> Toggle["Toggle: enable/disable skill in Registry"]
    Toggle --> UpdateRegistry["dispatch to update registry (add/remove from active skills)"]

    RemotePanel["Remote tab"] --> SearchBar["Search input: type skill name or keyword"]
    SearchBar --> FetchRemote["GET skills.sh/api/skills?q=term"]
    FetchRemote --> RemoteCards["Display results as cards: name, description, author, downloads"]
    RemoteCards --> InstallBtn["'Install' button on each card"]
    InstallBtn --> DownloadDef["Download skill definition JSON"]
    DownloadDef --> Convert["Convert to internal Skill format"]
    Convert --> CacheLocal["Save to localStorage + skills/remote/"]
    CacheLocal --> AddRegistry["Add to global Skill Registry"]
```

Explanation: The Skills modal manages both locally installed skills and remote skill discovery from Skills.sh. The Installed tab shows all currently registered skills with enable/disable toggles. The Remote tab allows searching Skills.sh, viewing results, and installing new skills. Installed remote skills are cached for offline use and added to the global Registry.

---

7. ToolsModal.tsx

```mermaid
flowchart TD
    Modal["ToolsModal opened"] --> LoadRegistry["Load all tools from global Tools Registry"]
    LoadRegistry --> Search["Optional: search bar to filter by name/description"]
    Search --> Cards["Display each tool as a card"]
    Cards --> CardContent["Card content: name, description, Zod schema (parameters), current rate limit status"]
    CardContent --> RateStatus["Rate limit: '10/10 calls used' or '8 remaining'"]
    CardContent --> SchemaView["Expandable: show Zod schema as formatted JSON"]
    CardContent --> CacheInfo["Show: cache TTL, fallback tool (if any)"]
    Cards --> StatusDot["Colored dot: green (active, within limits), yellow (near limit), red (rate limited)"]
```

Explanation: The Tools modal is a read‑only inspector for all registered tools. It displays each tool's metadata, Zod parameter schema, current rate limit consumption, cache settings, and fallback tool. A colored status dot gives at‑a‑glance information about the tool's availability.

---

8. WebModal.tsx

```mermaid
flowchart TD
    Modal["WebModal opened"] --> LoadWebRegistry["Load all web tools from global Web Registry"]
    LoadWebRegistry --> GlobalToggle["Global toggle: 'Web Tools Enabled' (linked to settings.webEnabled)"]
    GlobalToggle --> ToggleAll["Toggling ON/OFF enables or disables all web tools"]
    LoadWebRegistry --> Search["Search bar: filter web tools by name/description"]
    Search --> WebCards["Display each web tool as a card"]
    WebCards --> CardInfo["Card: name, description, parameters (Zod schema)"]
    CardInfo --> RateStatus["Rate limit: current usage/max per window"]
    CardInfo --> StatusDot["Colored dot: same as ToolsModal"]
    WebCards --> PerToolToggle["Per‑tool enable/disable toggle (if webEnabled is true)"]
    PerToolToggle --> UpdateRegistry["Add/remove from active web tools in Registry"]
```

Explanation: The Web modal provides an overview of all 31 web automation tools. A global toggle controls whether any web tools are available. Each web tool can be individually enabled/disabled. Rate limit status and Zod schema details are displayed, similar to the Tools modal.

---

9. Integration Note

All eight components described above subscribe to Zustand store slices (useChat, useSettings, useModels, useThinking) and dispatch actions through the useChat hook. They communicate with backend services (Skills.sh API, Ollama endpoints) via the helpers described in flow‑6. Their parent‑child relationships are shown in the Component Tree diagram (flow‑9, diagram 7).

---

End of flow-11.md. Continued in flow-12.md (Memory Folder Per‑File).