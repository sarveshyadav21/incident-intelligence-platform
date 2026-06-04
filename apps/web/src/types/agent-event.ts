export type AgentEventStatus = "STARTED" | "COMPLETED" | "FAILED";

export type AgentEvent = {
  agent: string;

  status: AgentEventStatus;

  timestamp: string;

  durationMs?: number;

  metadata?: Record<string, unknown>;
};
