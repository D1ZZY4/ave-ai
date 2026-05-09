flow-15.md — Multi-Modal & Model Management

---

1. Visual Input Pipeline (Image Understanding)

```mermaid
flowchart TD
    Upload["User uploads image via QuestionForm (flow-11 #4)"] --> ValidateImg["Validate: format PNG/JPEG/WEBP, max size 20MB"]
    ValidateImg -->|"Invalid"| RejectImg["Show error toast"]
    ValidateImg -->|"Valid"| ToBase64["Convert image to base64"]
    ToBase64 --> AttachToMessage["Attach to message.images[]"]
    AttachToMessage --> BuildMultimodalPrompt["Build Ollama multimodal payload"]

    BuildMultimodalPrompt --> Payload["{ model, prompt, images: [base64String], stream: true }"]
    Payload --> SendToOllama["POST to Ollama /api/generate"]
    SendToOllama --> LLMProcess["Qwen3.5-opus processes text + image"]
    LLMProcess --> StreamResponse["Stream response: text description, analysis, etc."]
    StreamResponse --> ParseStream["parse-response-to-ui.ts (flow-6 #9)"]
    ParseStream --> RenderMarkdown["Render Markdown response with image analysis"]

    DetectModel["Model capability detection (flow-7 #19)"] -->|"Vision supported"| EnableVision["Enable image upload button in UI"]
    DetectModel -->|"Vision not supported"| HideVision["Hide image upload, show tooltip"]
```

Explanation:

· Visual input leverages Qwen3.5-opus multimodal capabilities (see flow-7 #19 for model detection).
· Image is base64-encoded and included in Ollama's images field per the multimodal API format.
· The LLM processes both text and image together, streaming the analysis response.
· Model capability detection automatically enables/disables the image upload button in QuestionForm (flow-11 #4).
· Supported formats: PNG, JPEG, WEBP; max 20MB size.

---

2. Voice Input Pipeline (Speech-to-Text)

```mermaid
flowchart TD
    Record["User taps mic in QuestionForm (flow-11 #4)"] --> StartRecording["MediaRecorder API starts"]
    StartRecording --> CaptureAudio["Capture audio chunks as blob"]
    CaptureAudio --> StopRecording["User taps stop or auto-silence detection"]
    StopRecording --> GetBlob["Get final audio blob (webm/opus)"]

    GetBlob --> TranscMethod{"Transcription method?"}
    TranscMethod -->|"Browser SpeechRecognition"| BrowserSTT["window.SpeechRecognition API"]
    BrowserSTT -->|"Result"| InsertTextBrowser["Insert transcript into textarea"]
    BrowserSTT -->|"Not supported"| FallbackWhisper

    TranscMethod -->|"Whisper API"| FallbackWhisper["Send audio to Whisper endpoint"]
    FallbackWhisper --> WhisperResponse["Receive transcribed text"]
    WhisperResponse --> InsertTextWhisper["Insert transcript into textarea"]

    InsertTextBrowser --> UserEdit["User can edit transcribed text before sending"]
    InsertTextWhisper --> UserEdit
```

Explanation:

· Voice input uses browser's MediaRecorder API to capture audio.
· Primary transcription via built-in SpeechRecognition API (no network cost).
· Fallback to Whisper API if browser API is unsupported or user configured a Whisper endpoint.
· Transcribed text is inserted into the textarea for user review/editing before sending.
· Audio is NOT stored after transcription (privacy-preserving).

---

3. Multi-Modal Output Rendering

```mermaid
flowchart TD
    LLMResponse["LLM response received"] --> ParseContent["parse-response-to-ui.ts (flow-6 #9)"]
    ParseContent --> DetectOutputTypes{"Detect output types in response"}

    DetectOutputTypes -->|"Plain text"| RenderText["Render as Markdown in MessageBubble (flow-9 #9)"]
    DetectOutputTypes -->|"Code blocks"| RenderCode["Syntax highlight via rehype-highlight"]
    DetectOutputTypes -->|"Mermaid diagram"| ExtractDiagram["extractDiagramCode() (flow-6 #8)"]
    ExtractDiagram --> RenderMermaid["Render Mermaid diagram inline"]
    DetectOutputTypes -->|"Base64 image"| RenderImage["Display image inline in chat"]
    DetectOutputTypes -->|"Table data"| RenderTable["Render as Markdown table"]
    DetectOutputTypes -->|"JSON data"| RenderJSON["Render collapsible JSON viewer"]

    RenderText --> MessageBubble["MessageBubble.tsx renders final output"]
    RenderCode --> MessageBubble
    RenderMermaid --> MessageBubble
    RenderImage --> MessageBubble
    RenderTable --> MessageBubble
    RenderJSON --> MessageBubble
```

Explanation:

· Single LLM response can contain multiple output types (text, code, diagrams, tables, JSON).
· parse-response-to-ui.ts (flow-6 #9) detects and routes each content type.
· Mermaid diagrams extracted via extractDiagramCode() (flow-6 #8) and rendered inline.
· Code blocks get syntax highlighting via rehype-highlight.
· JSON data rendered as collapsible viewer for readability.

---

4. Model Switching & Warm-up

```mermaid
flowchart TD
    UserSwitch["User selects different model in Settings (flow-7 #14)"] --> SaveSetting["dispatch updateSetting('model', newModel)"]
    SaveSetting --> PersistLocalStorage["Persist to localStorage (flow-9 #2)"]
    PersistLocalStorage --> CheckAvailability{"Model already pulled?"}
    CheckAvailability -->|"Yes"| InvalidateCache["Set modelReady = false (flow-9 #2)"]
    InvalidateCache --> NextRequest["On next request: warm-up triggers (flow-8 #1)"]
    CheckAvailability -->|"No"| OfferPull["Show dialog: 'Model not downloaded. Pull now?'"]

    OfferPull -->|"Yes"| PullModel["call pullModel() in helpers/ollama.ts (flow-6 #6)"]
    PullModel --> StreamProgress["Stream download progress to UI"]
    StreamProgress --> PullComplete["Pull complete, set modelReady = true"]
    OfferPull -->|"No"| RevertModel["Revert to previous model selection"]

    NextRequest --> WarmUpRequest["Send minimal warm-up prompt"]
    WarmUpRequest --> ModelLoaded["Model loaded into GPU/RAM"]
    ModelLoaded --> SetReady["Set modelReady = true, process real input"]
```

Explanation:

· Model switching flows through Settings store (flow-9 #2) with automatic persistence.
· Availability check determines if model needs to be pulled from Ollama registry.
· Pull progress is streamed to UI via pullModel() helper (flow-6 #6).
· After switching, modelReady is reset, triggering warm-up on next request (flow-8 #1).
· Warm-up ensures model is loaded into GPU/RAM before processing real user input.

---

5. Model Download & Pull Progress

```mermaid
sequenceDiagram
    participant U as User (Settings)
    participant S as Settings Store
    participant H as helpers/ollama.ts
    participant O as Ollama Server
    participant UI as UI (Progress Bar)

    U->>S: Click "Pull Model" or model not found
    S->>H: pullModel(baseUrl, modelName)
    H->>O: POST /api/pull { name: modelName }
    O-->>H: NDJSON stream: { status, digest, total, completed }

    loop Pull Progress
        H-->>S: Yield progress update
        S->>UI: Update progress bar (completed/total)
        Note over UI: "Downloading model: 45% (2.1GB / 4.7GB)"
    end

    H-->>S: Final: { status: 'success' }
    S->>UI: "Model pulled successfully"
    S->>S: set modelReady = true, add to availableModels
    S->>S: Persist to localStorage
```

Explanation:

· Model pulling uses Ollama's /api/pull endpoint, streaming NDJSON progress updates.
· Progress includes status messages, layer digests, and byte counts (total/completed).
· UI renders a progress bar showing percentage and size downloaded.
· On success, model is added to availableModels and modelReady is set.
· If download fails mid-stream, retry uses exponential backoff (flow-6 #6, flow-7 #6).

---

6. Model Capability Detection

```mermaid
flowchart TD
    AppStart["App startup or model switch (flow-7 #2)"] --> DetectModel["Read settings.model from store (flow-9 #2)"]
    DetectModel --> CheckName{"Model name contains?"}
    CheckName -->|"qwen"| SetQwen["Set: thinkingFormat='qwen3', supportsVision=true, supportsTools=true"]
    CheckName -->|"llama"| SetLlama["Set: thinkingFormat='default', supportsVision=false, supportsTools=true"]
    CheckName -->|"mistral"| SetMistral["Set: thinkingFormat='default', supportsVision=false, supportsTools=true"]
    CheckName -->|"deepseek"| SetDeepseek["Set: thinkingFormat='deepseek', supportsVision=false, supportsTools=true"]
    CheckName -->|"other"| SetDefault["Set: thinkingFormat='default', supportsVision=false, supportsTools=true"]

    SetQwen --> UpdateStore["Update settingsStore with capability flags"]
    SetLlama --> UpdateStore
    SetMistral --> UpdateStore
    SetDeepseek --> UpdateStore
    SetDefault --> UpdateStore

    UpdateStore --> AdjustUI["UI adjusts: show/hide upload, adjust thinking format"]
    AdjustUI --> AdjustPrompt["Prompt assembly adjusts ModelSpecific block (flow-7 #4)"]
```

Explanation:

· Model capabilities are detected from the model name at startup and on model switch.
· Detection is name-based (model family matching) since Ollama doesn't have a direct capabilities API.
· Capability flags stored in settings store (flow-9 #2).
· UI adapts: vision-capable models show image upload; thinking models show thinking box by default.
· Prompt assembly injects model-specific instructions (flow-7 #4) based on detected family.

---

7. Multi-Modal Integration Summary

```mermaid
graph TB
    subgraph Input["Input Channels"]
        TextInput["Text (always available)"]
        ImageInput["Image (vision models only)"]
        VoiceInput["Voice (browser-dependent)"]
    end

    subgraph Processing["Processing"]
        PromptAssembly["Prompt Assembler (flow-7 #4)"]
        OllamaClient["helpers/ollama.ts (flow-6 #6)"]
        StreamParser["parse-response-to-ui.ts (flow-6 #9)"]
    end

    subgraph Output["Output Channels"]
        TextOutput["Markdown text with syntax highlighting"]
        DiagramOutput["Mermaid diagram rendering"]
        ImageOutput["Inline base64 image display"]
        TableOutput["Formatted tables"]
    end

    TextInput --> PromptAssembly
    ImageInput -->|base64 in images[]| PromptAssembly
    VoiceInput -->|Transcribed text| PromptAssembly
    PromptAssembly --> OllamaClient
    OllamaClient --> StreamParser
    StreamParser --> TextOutput
    StreamParser --> DiagramOutput
    StreamParser --> ImageOutput
    StreamParser --> TableOutput

    CapabilityDetection["Model Capability Detection (flow-15 #6)"] -.->|Enables/disables| ImageInput
    CapabilityDetection -.->|Enables/disables| ImageOutput
```

Explanation:

· Three input channels (text, image, voice) feed into a unified prompt assembler.
· Image is base64-encoded and passed in Ollama's images field.
· Voice is transcribed to text before entering the prompt pipeline.
· Four output channels render different content types from a single LLM response.
· Model capability detection gates which channels are available based on the active model.

---

End of flow-15.md. This covers multi-modal input/output pipelines, model switching workflow, model pull/download with progress, model capability detection, and the full multi-modal integration architecture.