flow-3.md — Per-File Diagrams: Skills & Tools

This file provides detailed diagrams and explanations for every file inside agents/skills/ and agents/tools/.

---

Skills

1. skills/ Folder Overview

```mermaid
graph TB
    SkillsDir["agents/skills/"] --> AutoSkills["auto-skills.ts"]
    SkillsDir --> Codex["codex.ts"]
    SkillsDir --> Mermaid["mermaid-diagram.ts"]
    SkillsDir --> PRD["prd.ts"]
    SkillsDir --> PythonStyle["python-code-style.ts"]
    SkillsDir --> SEO["seo.ts"]
    SkillsDir --> Summarize["summarize.ts"]
    SkillsDir --> TDD["tdd.ts"]
    SkillsDir --> Telegram["telegram-bot-builder.ts"]
    SkillsDir --> UIUX["ui-ux-designer.ts"]
    SkillsDir --> WebAppTest["web-app-testing.ts"]
    SkillsDir --> WebPerf["web-performance.ts"]
    SkillsDir --> WebQuality["web-quality.ts"]
    SkillsDir --> Index["index.ts (barrel)"]
```

Explanation: 14 skill files plus barrel export. Each skill is a composite workflow that orchestrates multiple tools or sub-skills sequentially. Skills are the building blocks for complex AI agent capabilities.

2. auto-skills.ts

```mermaid
graph TB
    AutoSkills["auto-skills.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'auto-skills'"]
    Export --> Desc["description: 'Automatically selects the most appropriate skill based on user input'"]
    Export --> Steps["steps: ['analyze-input', 'select-skill', 'execute-selected-skill']"]
    Steps --> Step1["Step 1: analyze-input — parses user intent"]
    Steps --> Step2["Step 2: select-skill — matches intent to available skills"]
    Steps --> Step3["Step 3: execute-selected-skill — runs the chosen skill"]
```

Explanation: Meta-skill that analyzes user input, identifies the most appropriate skill from the registry, and delegates execution. Acts as an intelligent router for skill selection.

3. codex.ts

```mermaid
graph TB
    Codex["codex.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'codex'"]
    Export --> Desc["description: 'Complete code generation, review, and improvement workflow'"]
    Export --> Steps["steps: ['read-file', 'analyze-code', 'suggest-improvements', 'write-file']"]
    Steps --> Step1["Step 1: read-file — reads existing code"]
    Steps --> Step2["Step 2: analyze-code — evaluates code quality"]
    Steps --> Step3["Step 3: suggest-improvements — generates refactoring suggestions"]
    Steps --> Step4["Step 4: write-file — writes improved code back"]
```

Explanation: Code generation and review pipeline. Reads existing code files, analyzes for improvements, generates suggestions, and writes the optimized code back to disk.

4. mermaid-diagram.ts

```mermaid
graph TB
    Mermaid["mermaid-diagram.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'mermaid-diagram'"]
    Export --> Desc["description: 'Generate Mermaid diagrams from natural language descriptions'"]
    Export --> Steps["steps: ['parse-description', 'generate-mermaid-syntax', 'render-diagram']"]
    Steps --> Step1["Step 1: parse-description — extracts diagram intent"]
    Steps --> Step2["Step 2: generate-mermaid-syntax — creates valid Mermaid code"]
    Steps --> Step3["Step 3: render-diagram — outputs rendered diagram"]
```

Explanation: Converts natural language descriptions into Mermaid diagram code. Parses user intent, generates valid Mermaid syntax, and renders the output via the diagram parser helper.

5. prd.ts

```mermaid
graph TB
    PRD["prd.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'prd'"]
    Export --> Desc["description: 'Generate a complete Product Requirement Document'"]
    Export --> Steps["steps: ['gather-requirements', 'define-scope', 'generate-prd-template', 'web-search', 'compile-prd']"]
    Steps --> S1["Step 1: gather-requirements — collects user needs"]
    Steps --> S2["Step 2: define-scope — scopes the project boundaries"]
    Steps --> S3["Step 3: generate-prd-template — creates document structure"]
    Steps --> S4["Step 4: web-search — finds relevant context"]
    Steps --> S5["Step 5: compile-prd — assembles final document"]
```

Explanation: Product Requirement Document generator. Gathers requirements from user input, scopes the project, searches the web for market context, and compiles a complete, structured PRD.

6. python-code-style.ts

```mermaid
graph TB
    Python["python-code-style.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'python-code-style'"]
    Export --> Desc["description: 'Check and enforce Python code style (PEP 8)'"]
    Export --> Steps["steps: ['read-file', 'check-pep8', 'apply-black-formatter', 'write-file']"]
    Steps --> S1["Step 1: read-file — reads the Python file"]
    Steps --> S2["Step 2: check-pep8 — validates against PEP 8"]
    Steps --> S3["Step 3: apply-black-formatter — formats with Black"]
    Steps --> S4["Step 4: write-file — writes formatted code"]
```

Explanation: Python code style checker and formatter. Reads Python files, checks against PEP 8 style guide, applies Black auto-formatting, and writes the corrected code back to the file.

7. seo.ts

```mermaid
graph TB
    SEO["seo.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'seo'"]
    Export --> Desc["description: 'SEO analysis and optimization recommendations'"]
    Export --> Steps["steps: ['web-fetcher', 'web-parser', 'analyze-meta-tags', 'generate-recommendations']"]
    Steps --> S1["Step 1: web-fetcher — fetches the webpage"]
    Steps --> S2["Step 2: web-parser — parses HTML content"]
    Steps --> S3["Step 3: analyze-meta-tags — checks meta, headings, structure"]
    Steps --> S4["Step 4: generate-recommendations — creates optimization report"]
```

Explanation: SEO analysis workflow. Fetches a webpage, parses its HTML, analyzes meta tags, headings, content structure, and generates actionable optimization recommendations.

8. summarize.ts

```mermaid
graph TB
    Summarize["summarize.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'summarize'"]
    Export --> Desc["description: 'Summarize file content or any provided text'"]
    Export --> Steps["steps: ['read-file', 'analyze-content', 'generate-summary']"]
    Steps --> S1["Step 1: read-file — reads source content"]
    Steps --> S2["Step 2: analyze-content — identifies key points"]
    Steps --> S3["Step 3: generate-summary — creates concise summary"]
```

Explanation: Text summarization pipeline. Reads file content or provided text, identifies key points and themes, and generates a concise, well-structured summary.

9. tdd.ts

```mermaid
graph TB
    TDD["tdd.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'tdd'"]
    Export --> Desc["description: 'Test-Driven Development workflow'"]
    Export --> Steps["steps: ['write-test', 'run-test', 'implement-code', 'run-test-again', 'refactor']"]
    Steps --> S1["Step 1: write-test — creates failing test"]
    Steps --> S2["Step 2: run-test — confirms test failure"]
    Steps --> S3["Step 3: implement-code — writes minimal code to pass"]
    Steps --> S4["Step 4: run-test-again — verifies test passes"]
    Steps --> S5["Step 5: refactor — cleans up code while tests pass"]
```

Explanation: Test-Driven Development workflow. Writes failing tests first, implements minimal code to pass them, runs tests again to confirm, and refactors for quality while maintaining passing tests.

10. telegram-bot-builder.ts

```mermaid
graph TB
    Telegram["telegram-bot-builder.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'telegram-bot-builder'"]
    Export --> Desc["description: 'Scaffold a complete Telegram bot project'"]
    Export --> Steps["steps: ['web-search', 'generate-bot-structure', 'write-file', 'display-setup-instructions']"]
    Steps --> S1["Step 1: web-search — finds latest API patterns"]
    Steps --> S2["Step 2: generate-bot-structure — creates project scaffold"]
    Steps --> S3["Step 3: write-file — writes boilerplate code"]
    Steps --> S4["Step 4: display-setup-instructions — shows deployment steps"]
```

Explanation: Telegram bot project scaffolding. Searches for latest Telegram Bot API patterns, generates project folder structure, writes boilerplate code with handlers, and displays setup instructions for deployment.

11. ui-ux-designer.ts

```mermaid
graph TB
    UIUX["ui-ux-designer.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'ui-ux-designer'"]
    Export --> Desc["description: 'Analyze UI/UX design and provide improvement suggestions'"]
    Export --> Steps["steps: ['web-screenshot', 'analyze-layout', 'generate-design-suggestions']"]
    Steps --> S1["Step 1: web-screenshot — captures the page visually"]
    Steps --> S2["Step 2: analyze-layout — evaluates visual hierarchy"]
    Steps --> S3["Step 3: generate-design-suggestions — creates UX report"]
```

Explanation: UI/UX design analysis. Takes webpage screenshots, analyzes layout patterns, spacing, color usage, typography, and generates actionable design improvement suggestions.

12. web-app-testing.ts

```mermaid
graph TB
    WebTest["web-app-testing.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'web-app-testing'"]
    Export --> Desc["description: 'Automated web application testing suite'"]
    Export --> Steps["steps: ['web-browser', 'run-test-suite', 'capture-results', 'generate-report']"]
    Steps --> S1["Step 1: web-browser — launches headless browser"]
    Steps --> S2["Step 2: run-test-suite — executes test scenarios"]
    Steps --> S3["Step 3: capture-results — records pass/fail outcomes"]
    Steps --> S4["Step 4: generate-report — creates testing report"]
```

Explanation: Automated web testing. Launches headless browser, executes defined test scenarios against a web application, captures pass/fail results with screenshots, and generates a comprehensive testing report.

13. web-performance.ts

```mermaid
graph TB
    WebPerf["web-performance.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'web-performance'"]
    Export --> Desc["description: 'Web performance audit and scoring'"]
    Export --> Steps["steps: ['web-fetcher', 'analyze-performance', 'web-screenshot', 'generate-score']"]
    Steps --> S1["Step 1: web-fetcher — loads the page"]
    Steps --> S2["Step 2: analyze-performance — measures load time, size"]
    Steps --> S3["Step 3: web-screenshot — captures visual state"]
    Steps --> S4["Step 4: generate-score — calculates performance score"]
```

Explanation: Web performance audit. Fetches a page, analyzes load times, resource sizes, render-blocking resources, takes screenshots for visual comparison, and generates a performance score with recommendations.

14. web-quality.ts

```mermaid
graph TB
    WebQuality["web-quality.ts"] --> Export["export default Skill"]
    Export --> Name["name: 'web-quality'"]
    Export --> Desc["description: 'Comprehensive web quality assurance check'"]
    Export --> Steps["steps: ['web-validator', 'web-link-extractor', 'check-broken-links', 'web-accessibility']"]
    Steps --> S1["Step 1: web-validator — validates HTML standards"]
    Steps --> S2["Step 2: web-link-extractor — extracts all links"]
    Steps --> S3["Step 3: check-broken-links — tests link validity"]
    Steps --> S4["Step 4: web-accessibility — checks accessibility compliance"]
```

Explanation: Web quality assurance. Validates HTML markup, extracts and tests all links for broken URLs, and runs accessibility compliance checks against WCAG standards.

15. skills/index.ts

```mermaid
graph TB
    Index["index.ts"] --> ReExport["export { autoSkills, codex, mermaid, prd, pythonStyle, seo, summarize, tdd, telegram, uiux, webTest, webPerf, webQuality }"]
    ReExport --> Import1["import autoSkills from './auto-skills'"]
    ReExport --> Import2["import codex from './codex'"]
    ReExport --> Import3["import mermaid from './mermaid-diagram'"]
    ReExport --> Import4["import prd from './prd'"]
    ReExport --> Import5["import pythonStyle from './python-code-style'"]
    ReExport --> Import6["import seo from './seo'"]
    ReExport --> Import7["import summarize from './summarize'"]
    ReExport --> Import8["import tdd from './tdd'"]
    ReExport --> Import9["import telegram from './telegram-bot-builder'"]
    ReExport --> Import10["import uiux from './ui-ux-designer'"]
    ReExport --> Import11["import webTest from './web-app-testing'"]
    ReExport --> Import12["import webPerf from './web-performance'"]
    ReExport --> Import13["import webQuality from './web-quality'"]
```

Explanation: Barrel file aggregates all 14 skill modules. The Orchestrator dynamically imports this file at startup and registers all skills in the global Skills Registry.

---

Tools

16. tools/ Folder Overview

```mermaid
graph TB
    ToolsDir["agents/tools/"] --> Calculator["calculator.ts"]
    ToolsDir --> Count["count.ts"]
    ToolsDir --> CurrentTime["current-time.ts"]
    ToolsDir --> IfWeb["if-web-enabled-or-disabled.ts"]
    ToolsDir --> PDF["pdf.ts"]
    ToolsDir --> ReadFile["read-file.ts"]
    ToolsDir --> WriteFile["write-file.ts"]
    ToolsDir --> Index["index.ts (barrel)"]
```

Explanation: 8 atomic tool files plus barrel export. Each tool is a self-contained module with Zod-validated parameters and a handler function that executes in a sandboxed environment.

17. calculator.ts

```mermaid
graph TB
    Calc["calculator.ts"] --> Export["export default Tool"]
    Export --> Name["name: 'calculator'"]
    Export --> Desc["description: 'Perform mathematical calculations safely'"]
    Export --> Params["parameters: ZodSchema { expression: z.string() }"]
    Export --> Handler["handler: async (params) => ToolResult"]
    Handler --> Sanitize["Sanitize: strips non-math characters from expression"]
    Handler --> ValidateExpr["Validate: ensures only safe operations remain"]
    Handler --> Evaluate["Evaluate: computes the mathematical expression"]
    Handler --> Return["Return: { success: true, data: result }"]
    Handler --> ErrorReturn["Error: { success: false, error: 'Invalid expression' }"]
```

Explanation: Safe math evaluator. Strips non-math characters to prevent code injection, validates that only allowed operations remain, evaluates the expression, and returns the computed result.

18. count.ts

```mermaid
graph TB
    Count["count.ts"] --> Export["export default Tool"]
    Export --> Name["name: 'count'"]
    Export --> Desc["description: 'Count characters, words, or lines in text'"]
    Export --> Params["parameters: ZodSchema { text: z.string(), mode: z.enum(['chars','words','lines']) }"]
    Export --> Handler["handler: async (params) => ToolResult"]
    Handler --> ModeSwitch["Switch on mode: 'chars', 'words', or 'lines'"]
    Handler --> CountChars["chars: text.length"]
    Handler --> CountWords["words: text.split(/\s+/).length"]
    Handler --> CountLines["lines: text.split(/\n/).length"]
    Handler --> Return["Return: { success: true, data: { mode, count } }"]
```

Explanation: Text counting utility. Supports three modes: character count, word count (splitting on whitespace), and line count (splitting on newlines). Returns the mode used and the resulting count.

19. current-time.ts

```mermaid
graph TB
    Time["current-time.ts"] --> Export["export default Tool"]
    Export --> Name["name: 'current-time'"]
    Export --> Desc["description: 'Get current date and time in ISO format'"]
    Export --> Params["parameters: ZodSchema { timezone: z.string().optional() }"]
    Export --> Handler["handler: async (params) => ToolResult"]
    Handler --> GetDate["Get current Date object"]
    Handler --> TimezoneLogic["If timezone provided, convert using Intl.DateTimeFormat"]
    Handler --> FormatISO["Format as ISO 8601 string"]
    Handler --> Return["Return: { success: true, data: { iso, timestamp, timezone } }"]
```

Explanation: Returns current date and time. Accepts an optional timezone string (e.g., 'Asia/Jakarta'). Uses Intl.DateTimeFormat for timezone conversion. Returns ISO 8601 formatted string with Unix timestamp.

20. if-web-enabled-or-disabled.ts

```mermaid
graph TB
    IfWeb["if-web-enabled-or-disabled.ts"] --> Export["export default Tool"]
    Export --> Name["name: 'if-web-enabled-or-disabled'"]
    Export --> Desc["description: 'Check if web tools are globally enabled in settings'"]
    Export --> Params["parameters: ZodSchema { } (no parameters required)"]
    Export --> Handler["handler: async () => ToolResult"]
    Handler --> ReadStore["Read Zustand settingsStore.webEnabled"]
    Handler --> ReturnTrue["If true: { success: true, data: { webEnabled: true } }"]
    Handler --> ReturnFalse["If false: { success: true, data: { webEnabled: false } }"]
```

Explanation: Status checker that reads the webEnabled toggle from the Zustand settings store. Used by the LLM to determine if web operations are available before attempting web tool calls. Takes no parameters.

21. pdf.ts

```mermaid
graph TB
    PDF["pdf.ts"] --> Export["export default Tool"]
    Export --> Name["name: 'pdf'"]
    Export --> Desc["description: 'Read text from PDF files or generate new PDFs'"]
    Export --> Params["parameters: ZodSchema { action: z.enum(['read','generate']), content: z.string().optional(), path: z.string().optional() }"]
    Export --> Handler["handler: async (params) => ToolResult"]
    Handler --> ActionSwitch{"action type?"}
    ActionSwitch -->|"read"| ReadPDF["Read PDF: extract text from file at path"]
    ActionSwitch -->|"generate"| GenPDF["Generate PDF: create new PDF from content"]
    ReadPDF --> ValidatePath["Validate path in allowedPaths"]
    ReadPDF --> ExtractText["Use PDF parsing library to extract text"]
    GenPDF --> CreateDoc["Create PDF document with provided content"]
    GenPDF --> SaveFile["Save to specified path"]
```

Explanation: PDF manipulation tool. Can read and extract text from existing PDF files (within allowed paths) or generate new PDF documents from provided text content.

22. read-file.ts

```mermaid
graph TB
    ReadFile["read-file.ts"] --> Export["export default Tool"]
    Export --> Name["name: 'read-file'"]
    Export --> Desc["description: 'Read file contents from the filesystem'"]
    Export --> Params["parameters: ZodSchema { path: z.string().min(1) }"]
    Export --> Handler["handler: async (params) => ToolResult"]
    Handler --> CheckCache["Check cache: cache.get(toolName + hash(path))"]
    CheckCache -->|"Hit"| ReturnCached["Return cached content"]
    CheckCache -->|"Miss"| ValidatePath["Validate: is path in allowedPaths from rules/tools.ts?"]
    ValidatePath -->|"Invalid"| ReturnError["Return: { success: false, error: 'Path not allowed' }"]
    ValidatePath -->|"Valid"| CheckExist["Check: does file exist?"]
    CheckExist -->|"No"| FileNotFound["Return: { success: false, error: 'File not found' }"]
    CheckExist -->|"Yes"| CheckSize["Check: file size < maxFileSizeBytes?"]
    CheckSize -->|"No"| TooLarge["Return: { success: false, error: 'File too large' }"]
    CheckSize -->|"Yes"| ReadContent["Read file: fs.readFile(path, 'utf-8')"]
    ReadContent --> CacheResult["Cache: cache.set(key, content, cacheTTL)"]
    CacheResult --> Return["Return: { success: true, data: content }"]
```

Explanation: File reader with layered security. Checks cache first, then validates the path against allowedPaths in rules/tools.ts, verifies file existence, checks file size limits, reads with UTF-8 encoding, caches the result, and returns the content.

23. write-file.ts

```mermaid
graph TB
    WriteFile["write-file.ts"] --> Export["export default Tool"]
    Export --> Name["name: 'write-file'"]
    Export --> Desc["description: 'Write content to a file on the filesystem'"]
    Export --> Params["parameters: ZodSchema { path: z.string().min(1), content: z.string() }"]
    Export --> Handler["handler: async (params) => ToolResult"]
    Handler --> ValidatePath["Validate: is path in allowedPaths from rules/tools.ts?"]
    ValidatePath -->|"Invalid"| ReturnError["Return: { success: false, error: 'Path not allowed' }"]
    ValidatePath -->|"Valid"| CheckOverwrite["Check: does file already exist?"]
    CheckOverwrite --> Backup["If exists: create .bak backup"]
    CheckOverwrite --> Write["Write: fs.writeFile(path, content, 'utf-8')"]
    Write --> ClearCache["Cache: clear related cache entries"]
    ClearCache --> Verify["Verify: read back file to confirm write"]
    Verify -->|"OK"| ReturnSuccess["Return: { success: true, data: { path, size } }"]
    Verify -->|"Fail"| ReturnFail["Return: { success: false, error: 'Write verification failed' }"]
```

Explanation: File writer with safety measures. Validates the path against allowedPaths, creates a .bak backup if the file exists, writes the new content, clears related cache entries, and verifies the write by reading the file back.

24. tools/index.ts

```mermaid
graph TB
    Index["index.ts"] --> ReExport["export { calculator, count, currentTime, ifWebEnabled, pdf, readFile, writeFile }"]
    ReExport --> Import1["import calculator from './calculator'"]
    ReExport --> Import2["import count from './count'"]
    ReExport --> Import3["import currentTime from './current-time'"]
    ReExport --> Import4["import ifWebEnabled from './if-web-enabled-or-disabled'"]
    ReExport --> Import5["import pdf from './pdf'"]
    ReExport --> Import6["import readFile from './read-file'"]
    ReExport --> Import7["import writeFile from './write-file'"]
```

Explanation: Barrel file aggregates all 8 tool modules. The Orchestrator dynamically imports this file at startup and registers all tools in the global Tools Registry.

---

End of flow-3.md. Continued in flow-4.md (Web Tools) and flow-5.md (Helpers + Stores + Hooks).