/**
 * flow-9 diagram 12: Settings → Skills tab.
 * List installed skills with enable/disable toggles.
 */
import { cn } from "@/lib/utils";
import { useSettings } from "../../store/settings";
import { ALL_SKILLS } from "../../../../agents/skills/index";
import { Switch } from "@/components/ui/switch";

export function Skills() {
  const { settings, updateSettings } = useSettings();
  const enabledSkills = settings.enabledSkills ?? [];

  const toggleSkill = (skillId: string) => {
    const isEnabled = enabledSkills.includes(skillId);
    if (isEnabled) {
      updateSettings({ enabledSkills: enabledSkills.filter((id) => id !== skillId) });
    } else {
      updateSettings({ enabledSkills: [...enabledSkills, skillId] });
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-[hsl(265_15%_38%)] leading-snug">
        Enable or disable installed skills. Disabled skills won't appear in the skill picker.
      </p>
      <div className="rounded-xl border border-[hsl(260_18%_16%)] divide-y divide-[hsl(260_18%_13%)] overflow-hidden">
        {ALL_SKILLS.map((skill) => {
          const isEnabled = enabledSkills.includes(skill.id);
          return (
            <div
              key={skill.id}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 transition-colors",
                isEnabled ? "" : "opacity-50"
              )}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                <span className="text-base leading-none flex-shrink-0">{skill.icon}</span>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[hsl(270_20%_85%)] truncate">
                    {skill.name}
                  </div>
                  <div className="text-[10px] text-[hsl(265_15%_38%)] leading-snug line-clamp-1">
                    {skill.description}
                  </div>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={() => toggleSkill(skill.id)}
                className="data-[state=checked]:bg-purple-600 flex-shrink-0 scale-90"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
