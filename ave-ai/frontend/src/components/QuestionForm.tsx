import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedQuestion } from "../helpers/parse-response";

interface QuestionFormProps {
  prose: string;
  questions: ParsedQuestion[];
  onSubmit: (answers: string) => void;
  disabled?: boolean;
}

export function QuestionForm({ questions, onSubmit, disabled }: QuestionFormProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (submitted || disabled) return;

    // Build a natural-language answer string
    const parts = questions.map((q) => {
      const answer = answers[q.index]?.trim();
      if (!answer) return null;
      return `${q.index}. ${q.question}\n→ ${answer}`;
    }).filter(Boolean);

    if (parts.length === 0) return;

    setSubmitted(true);
    onSubmit(parts.join("\n\n"));
  };

  const filledCount = Object.values(answers).filter((a) => a.trim()).length;

  if (submitted) {
    return (
      <div className="mt-3 px-3 py-2.5 rounded-2xl bg-[hsl(268_25%_10%)] border border-[hsl(268_25%_16%)]">
        <p className="text-[11px] text-[hsl(265_15%_45%)]">Answers sent. Generating your PRD…</p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2.5">
      {questions.map((q) => (
        <div key={q.index} className="space-y-1">
          <label className="flex items-start gap-2 text-[12px] font-medium text-[hsl(270_20%_82%)] leading-snug">
            <span className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5",
              answers[q.index]?.trim()
                ? "bg-purple-600 text-white"
                : "bg-[hsl(260_18%_14%)] text-[hsl(265_15%_42%)]"
            )}>
              {q.index}
            </span>
            <span>{q.question}</span>
          </label>
          <input
            value={answers[q.index] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.index]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // Move to next field
                const nextInput = document.getElementById(`q-${q.index + 1}`);
                if (nextInput) (nextInput as HTMLInputElement).focus();
              }
            }}
            id={`q-${q.index}`}
            placeholder="Your answer…"
            disabled={disabled}
            className="w-full ml-7 pl-3 pr-3 py-2 rounded-xl bg-[hsl(258_25%_6%)] border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(270_20%_88%)] placeholder:text-[hsl(265_15%_30%)] outline-none focus:border-[hsl(270_40%_38%)] transition-colors"
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={filledCount === 0 || disabled}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-medium transition-all border",
          filledCount > 0
            ? "bg-purple-700 hover:bg-purple-600 border-purple-600 text-white"
            : "bg-transparent border-[hsl(260_18%_16%)] text-[hsl(265_15%_35%)] cursor-not-allowed"
        )}
      >
        <Send size={12} />
        {filledCount === 0
          ? "Fill in at least one field"
          : filledCount === questions.length
          ? "Submit all answers"
          : `Submit ${filledCount} / ${questions.length} answers`}
      </button>
    </div>
  );
}
