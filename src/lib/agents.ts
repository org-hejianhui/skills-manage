import type { AgentWithStatus } from "@/types";

export const CENTRAL_AGENT_ID = "central";
export const OBSIDIAN_AGENT_ID = "obsidian";

export const VISIBLE_LOBSTER_AGENT_IDS = new Set(["qoderwork"]);

const NON_INSTALL_TARGET_AGENT_IDS = new Set([
  CENTRAL_AGENT_ID,
  OBSIDIAN_AGENT_ID,
]);

export function isInstallTargetAgent(agent: Pick<AgentWithStatus, "id">): boolean {
  return !NON_INSTALL_TARGET_AGENT_IDS.has(agent.id);
}

export function isEnabledInstallTargetAgent(
  agent: Pick<AgentWithStatus, "id" | "is_enabled">
): boolean {
  return isInstallTargetAgent(agent) && agent.is_enabled;
}

export function isVisibleLobsterAgent(agent: Pick<AgentWithStatus, "id" | "category">): boolean {
  return agent.category !== "lobster" || VISIBLE_LOBSTER_AGENT_IDS.has(agent.id);
}
