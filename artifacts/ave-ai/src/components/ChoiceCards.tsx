import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedChoice } from "../helpers/parse-response";

interface ChoiceCardsProps {
  choices: ParsedChoice[];
  onSelect: (label: string) => void;
  disabled?: boolean;
  type?: "choices" | "confirm";
}

export function ChoiceCards({ choices, onSelect, disabled, type = "choices" }: ChoiceCardsProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (choice: ParsedChoice) => {
    if (disabled || selected !== null) return;
    setSelected(choice.index);
    onSelect(choice.label);
  };

  if (type === "confirm") {
    return (
      <div className="flex gap-2 mt-3">
        {choices.map((choice) => {
          const isYes = choice.index === 1;
          const isSelected = selected === choice.index;
          return (
            <button
              key={choice.index}
              onClick={() => handleSelect(choice)}
              disabled={disabled || selected !== null}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl text-[12px] font-medium border transition-all",
                isSelected
                  ? isYes
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-[hsl(260_18%_16%)] border-[hsl(260_18%_22%)] text-[hsl(265_15%_55%)]"
                  : selected !== null
                  ? "opacity-30 cursor-default border-[hsl(260_18%_14%)] text-[hsl(265_15%_35%)]"
                  : isYes
                  ? "border-purple-800 text-purple-300 hover:bg-purple-700/20 hover:border-purple-600"
                  : "border-[hsl(260_18%_18%)] text-[hsl(270_20%_75%)] hover:bg-[hsl(260_18%_14%)]"
              )}
            >
              {isSelected && <CheckCircle size={12} />}
              {choice.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      {choices.map((choice) => {
        const isSelected = selected === choice.index;
        const isDimmed = selected !== null && !isSelected;

        return (
          <button
            key={choice.index}
            onClick={() => handleSelect(choice)}
            disabled={disabled || selected !== null}
            className={cn(
              "w-full flex items-start gap-3 px-3.5 py-3 rounded-2xl border text-left transition-all group",
              isSelected
                ? "bg-[hsl(268_30%_14%)] border-purple-600 shadow-[0_0_0_1px_rgba(147,51,234,0.15)]"
                : isDimmed
                ? "opacity-25 cursor-default border-[hsl(260_18%_13%)]"
                : "border-[hsl(260_18%_17%)] hover:border-[hsl(270_30%_26%)] hover:bg-[hsl(260_20%_11%)] cursor-pointer"
            )}
          >
            {/* Number badge */}
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5",
              isSelected
                ? "bg-purple-600 text-white"
                : "bg-[hsl(260_18%_14%)] text-[hsl(265_15%_45%)] group-hover:bg-[hsl(268_25%_18%)] group-hover:text-purple-400"
            )}>
              {isSelected ? <CheckCircle size={12} /> : choice.index}
            </div>

            {/* Label + description */}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-[13px] font-medium leading-snug",
                isSelected ? "text-purple-200" : "text-[hsl(270_20%_88%)]"
              )}>
                {choice.label}
              </div>
              {choice.description && (
                <div className="text-[11px] text-[hsl(265_15%_42%)] mt-0.5 leading-snug">
                  {choice.description}
                </div>
              )}
            </div>

            {/* Arrow */}
            {!isSelected && !isDimmed && (
              <ArrowRight
                size={13}
                className="text-[hsl(265_15%_35%)] flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
