import { useState, useRef, useCallback } from "react";
import {
  Send, Square, Plus, Brain, Globe, Zap, ChevronDown,
  Sparkles, Code2, List, Mic, MicOff, ImagePlus, X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { ALL_SKILLS } from "../../../agents/skills/index";

const SKILL_ICONS: Record<string, React.ReactNode> = {
  general: <Zap size={12} />,
  developer: <Code2 size={12} />,
  summary: <List size={12} />,
  prd: <Sparkles size={12} />,
};

interface ChatInputProps {
  onSend: (content: string, images?: string[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  selectedSkill: string;
  onSkillChange: (id: string) => void;
  placeholder?: string;
}

export function ChatInput({
  onSend, onStop, isStreaming, selectedSkill, onSkillChange,
  placeholder = "Describe your vision...",
}: ChatInputProps) {
  const { settings, updateSettings } = useSettings();
  const [value, setValue] = useState("");
  const [showSkills, setShowSkills] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && attachedImages.length === 0) || isStreaming) return;
    onSend(trimmed || "[Image]", attachedImages.length > 0 ? attachedImages : undefined);
    setValue("");
    setAttachedImages([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, attachedImages, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 140) + "px";
    }
  };

  // ─── Diagram 45: Voice input via SpeechRecognition ──────────────────────
  const handleVoiceToggle = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording && recognitionRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).stop();
      setIsRecording(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SpeechRecognitionAPI();
    recognition.lang = "id-ID,en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setValue((prev) => prev ? prev + " " + transcript : transcript);
      if (textareaRef.current) {
        textareaRef.current.focus();
        const el = textareaRef.current;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 140) + "px";
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  // ─── Diagram 45: Image input via file picker ────────────────────────────
  const handleImagePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const bases = await Promise.all(files.map(toBase64));
    setAttachedImages((prev) => [...prev, ...bases].slice(0, 3));
    e.target.value = "";
  };

  const removeImage = (idx: number) =>
    setAttachedImages((prev) => prev.filter((_, i) => i !== idx));

  const currentSkill = ALL_SKILLS.find((s) => s.id === selectedSkill) || ALL_SKILLS[0];
  const canSend = (value.trim().length > 0 || attachedImages.length > 0) && !isStreaming;

  return (
    <div className="relative px-3 pb-3 pt-1.5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Skills dropdown */}
      {showSkills && (
        <div className="absolute bottom-full left-4 mb-1.5 w-44 rounded-2xl border border-[hsl(260_18%_18%)] bg-[hsl(258_28%_9%)] shadow-xl overflow-hidden z-50 slide-up">
          {ALL_SKILLS.map((skill) => (
            <button
              key={skill.id}
              onClick={() => { onSkillChange(skill.id); setShowSkills(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                skill.id === selectedSkill
                  ? "bg-[hsl(270_60%_20%/0.5)] text-purple-300"
                  : "text-[hsl(270_20%_80%)] hover:bg-[hsl(260_20%_13%)]"
              )}
            >
              <span className={cn("flex-shrink-0", skill.id === selectedSkill ? "text-purple-400" : "text-[hsl(265_15%_48%)]")}>
                {SKILL_ICONS[skill.id]}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">{skill.name}</span>
              {skill.id === selectedSkill && (
                <svg className="ml-auto text-purple-400 flex-shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[hsl(260_18%_20%)] bg-[hsl(258_25%_10%)] overflow-hidden">
        {/* Toggle row */}
        <div className="flex items-center gap-1.5 px-3 pt-2 pb-0.5">
          <button
            onClick={() => updateSettings({ enableThinking: !settings.enableThinking })}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
              settings.enableThinking
                ? "bg-[hsl(270_60%_20%/0.6)] text-purple-300 border border-[hsl(270_50%_38%/0.4)]"
                : "text-[hsl(265_15%_45%)] hover:text-[hsl(265_15%_65%)]"
            )}
          >
            <Brain size={11} />
            Think
          </button>
          <button
            onClick={() => updateSettings({ enableTools: !settings.enableTools })}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
              settings.enableTools
                ? "bg-[hsl(270_60%_20%/0.6)] text-purple-300 border border-[hsl(270_50%_38%/0.4)]"
                : "text-[hsl(265_15%_45%)] hover:text-[hsl(265_15%_65%)]"
            )}
          >
            <Globe size={11} />
            Tools
          </button>
        </div>

        {/* Image previews (D45) */}
        {attachedImages.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 flex-wrap">
            {attachedImages.map((b64, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={`data:image/png;base64,${b64}`}
                  alt="attachment"
                  className="w-12 h-12 rounded-lg object-cover border border-[hsl(260_18%_22%)]"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XIcon size={9} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-transparent px-3.5 py-2 text-[13px] text-[hsl(270_20%_88%)] placeholder:text-[hsl(265_15%_35%)] resize-none outline-none scrollbar-hide"
          style={{ minHeight: "36px", maxHeight: "140px" }}
        />

        {/* Bottom row */}
        <div className="flex items-center justify-between px-3 pb-2 pt-0.5">
          <div className="flex items-center gap-1">
            {/* Image picker (D45) */}
            <button
              onClick={handleImagePick}
              className="p-1.5 rounded-lg text-[hsl(265_15%_40%)] hover:text-purple-300 transition-colors"
              title="Attach image"
            >
              <ImagePlus size={14} />
            </button>
            {/* Voice input (D45) */}
            <button
              onClick={handleVoiceToggle}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isRecording
                  ? "text-red-400 bg-red-900/20 animate-pulse"
                  : "text-[hsl(265_15%_40%)] hover:text-purple-300"
              )}
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button
              onClick={() => setShowSkills((p) => !p)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
                showSkills
                  ? "bg-[hsl(270_60%_20%/0.5)] text-purple-300"
                  : "text-[hsl(265_15%_45%)] hover:text-[hsl(265_15%_65%)]"
              )}
            >
              {SKILL_ICONS[currentSkill.id]}
              <span className="ml-0.5">{currentSkill.name}</span>
              <ChevronDown size={10} />
            </button>
          </div>

          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-7 h-7 rounded-full bg-[hsl(260_20%_16%)] border border-[hsl(260_18%_22%)] flex items-center justify-center text-[hsl(265_15%_55%)] hover:text-white transition-colors"
            >
              <Square size={12} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                canSend
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-[hsl(260_20%_13%)] text-[hsl(265_15%_30%)] cursor-not-allowed"
              )}
            >
              <Send size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
