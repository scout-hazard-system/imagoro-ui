// MCP JSON-RPC client for the Harness Console — L3: thin layer over the core
// Gateway (the ONE fetch chokepoint) and ToolBroker (capability/confirm/rate
// gates). The raw fetch that used to live here is gone; the console no longer
// owns any transport. Dev: vite proxies /api -> http://127.0.0.1:19001.
// Desktop (Scout Harness exe): the Rust `kao_rpc` command carries the request;
// it owns the gateway URL and the token, so neither is visible to this page.
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { BusEvent } from "@imagoro/core";
import { DEFAULT_ROLE, Gateway, gatewayErrorText, ToolBroker } from "@imagoro/core";

export const IN_DESKTOP = isTauri();

export interface StackCheck {
  name: string;
  addr: string;
  up: boolean;
}
export interface KaoConfig {
  url: string;
  token_file: string;
  token_present: boolean;
}

/** Desktop only: TCP reachability of the local engines, mesh peers, Kao and the blackboard. */
export async function stackStatus(): Promise<StackCheck[]> {
  const res = await invoke<{ checks: StackCheck[] }>("stack_status");
  return res.checks;
}

/** Desktop only: run the same start script the Windows Startup folder uses. */
export function stackStart(): Promise<string> {
  return invoke<string>("stack_start");
}

export function kaoConfig(): Promise<KaoConfig> {
  return invoke<KaoConfig>("kao_config");
}

/** fetch-shaped adapter so Gateway stays the one chokepoint in both modes. */
const desktopFetch: typeof fetch = async (_url, init) => {
  try {
    const text = await invoke<string>("kao_rpc", { body: String(init?.body ?? "") });
    return new Response(text, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    // A JSON-RPC error (not an HTTP status) so the console shows the real reason
    // (e.g. "gateway token not readable"); Gateway reduces non-2xx to a bare code.
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: String(err) } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export interface McpToolDef {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export const mcpGateway = new Gateway({
  base: "/api",
  token: IN_DESKTOP ? undefined : (import.meta.env.VITE_IMAGORO_MCP_TOKEN as string | undefined),
  ...(IN_DESKTOP ? { fetchImpl: desktopFetch } : {}),
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