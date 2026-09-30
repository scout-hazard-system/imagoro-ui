// MCP JSON-RPC client for the Harness Console — L3: thin layer over the core
// Gateway (the ONE fetch chokepoint) and ToolBroker (capability/confirm/rate
// gates). The raw fetch that used to live here is gone; the console no longer
// owns any transport. Dev: vite proxies /api -> http://127.0.0.1:19001.
import type { BusEvent } from "@imagoro/core";
import { DEFAULT_ROLE, Gateway, gatewayErrorText, ToolBroker } from "@imagoro/core";

export interface McpToolDef {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export const mcpGateway = new Gateway({
  base: "/api",
  token: import.meta.env.VITE_IMAGORO_MCP_TOKEN as string | undefined,
  timeoutMs: 20_000,
  maxBodyBytes: 2 * 1024 * 1024
});

/** Shared broker: quick-run pills route here; intent/execute routes here too. */
export const broker = new ToolBroker(mcpGateway, { perMinute: 20, maxConcurrent: 2 });

let mcpRole: unknown = DEFAULT_ROLE;
export function setMcpRole(role: unknown): void {
  mcpRole = role;
}
export function getMcpRole(): unknown {
  return mcpRole;
}

export interface McpResponse {
  jsonrpc: "2.0";
  id: number;
  result?: {
    content?: { type: string; text?: string }[];
    isError?: boolean;
    tools?: unknown[];
  };
  error?: { code: number; message: string };
}

export async function listTools(): Promise<McpToolDef[]> {
  const reply = await mcpGateway.rpc<McpResponse>("tools/list");
  if (reply.error) throw new Error(reply.error.message);
  return (reply.result?.tools ?? []) as unknown as McpToolDef[];
}

/**
 * Dispatch through the broker, not the gateway: quick-run pills are unconfirmed
 * by definition, so dangerous tools are DENIED (confirm-required) here — the
 * confirmed path is the intent flow. Fail-closed, no throw.
 */
export async function callTool(
  name: string,
  args: Record<string, unknown> = {},
  opts: { confirmed?: boolean } = {}
): Promise<string> {
  const res = await broker.dispatch({ tool: name, args }, { role: mcpRole, confirmed: opts.confirmed ?? false });
  if (!res.ok) throw new Error(res.denial);
  return res.data;
}

export function toolResultEvent(tool: string, text: string): BusEvent {
  return { type: "console/log", ts: Date.now(), payload: { line: `[mcp] ${tool} -> ${text.slice(0, 2000)}` } };
}

export function mcpErrorEvent(tool: string, err: unknown): BusEvent {
  return { type: "console/log", ts: Date.now(), payload: { line: `[mcp] ${tool} FAILED: ${gatewayErrorText(err)}` } };
}