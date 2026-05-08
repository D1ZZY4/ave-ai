import type { FlowTool, FlowSkill } from "../types";

/**
 * Central Registry — Map<string, FlowTool> & Map<string, FlowSkill>
 * Built once at startup via buildRegistry(), validated before use.
 * All lookups go through registry — no direct imports between tool/skill files.
 */

class Registry {
  private tools: Map<string, FlowTool> = new Map();
  private skills: Map<string, FlowSkill> = new Map();
  private initialized = false;

  registerTool(tool: FlowTool): void {
    this.tools.set(tool.id, tool);
  }

  registerSkill(skill: FlowSkill): void {
    this.skills.set(skill.id, skill);
  }

  getTool(id: string): FlowTool | undefined {
    return this.tools.get(id);
  }

  getSkill(id: string): FlowSkill | undefined {
    return this.skills.get(id);
  }

  getAllTools(): FlowTool[] {
    return Array.from(this.tools.values());
  }

  getAllSkills(): FlowSkill[] {
    return Array.from(this.skills.values());
  }

  getToolMap(): Map<string, FlowTool> {
    return this.tools;
  }

  getSkillMap(): Map<string, FlowSkill> {
    return this.skills;
  }

  isToolOrSkill(id: string): "tool" | "skill" | null {
    if (this.tools.has(id)) return "tool";
    if (this.skills.has(id)) return "skill";
    return null;
  }

  /**
   * Validate skill dependencies — each skill step must reference a known tool/skill.
   */
  validateDependencies(): string[] {
    const errors: string[] = [];
    for (const skill of this.skills.values()) {
      for (const step of skill.steps) {
        if (step.type === "tool" && !this.tools.has(step.id)) {
          errors.push(`Skill "${skill.id}" references unknown tool "${step.id}"`);
        }
        if (step.type === "skill" && !this.skills.has(step.id)) {
          errors.push(`Skill "${skill.id}" references unknown skill "${step.id}"`);
        }
      }
    }
    return errors;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  markInitialized(): void {
    this.initialized = true;
  }

  size(): { tools: number; skills: number } {
    return { tools: this.tools.size, skills: this.skills.size };
  }
}

export const registry = new Registry();

/**
 * Build the registry by importing all tool/skill modules.
 * Called once on app init (useAgent mount).
 */
export async function buildRegistry(): Promise<{ errors: string[] }> {
  if (registry.isInitialized()) return { errors: [] };

  const { allFlowTools } = await import("../tools/registry");
  const { allFlowSkills } = await import("../skills/registry");

  for (const tool of allFlowTools) {
    registry.registerTool(tool);
  }

  for (const skill of allFlowSkills) {
    registry.registerSkill(skill);
  }

  const errors = registry.validateDependencies();

  if (errors.length > 0) {
    console.warn("[Registry] Dependency validation errors:", errors);
  }

  registry.markInitialized();
  return { errors };
}
