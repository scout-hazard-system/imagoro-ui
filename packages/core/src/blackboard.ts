import type { JsonObject } from "./types.js";

export interface BlackboardEntry {
  id: number | string;
  category: string;
  kind: string;
  role: string;
  author: string;
  title?: string;
  body?: string;
  tags?: string[];
  ts: number;
  meta?: JsonObject;
}

export interface BlackboardWriteOpts {
  category: string;
  role: string;
  kind: string;
  title?: string;
  body?: string;
  tags?: string[];
  meta?: JsonObject;
  author?: string;
  supersede?: boolean;
}

export interface BlackboardReadOpts {
  category: string;
  role?: string;
  kind?: string;
  limit?: number;
  activeOnly?: boolean;
  tags?: string[];
}

export interface BlackboardSnapshot {
  [category: string]: BlackboardEntry[];
}

function toQuery(opts: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(opts)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * Blackboard HTTP client for `:8765` (scout_crew `blackboard/server.py` contract).
 *
 * Wire contract:
 *   GET  /v1/read?{category,role,kind,limit,active_only}
 *   GET  /v1/snapshot?{role,limit_per_category}
 *   POST /v1/write       {category, role, kind, title, body, tags, meta, supersede}
 *   GET  /v1/stats
 *   GET  /v1/audit?limit=N        (manager bearer token)
 *
 * Auth: optional `Authorization: Bearer <token>` when `token` is set (SCOUT_BLACKBOARD_TOKEN).
 */
export class BlackboardClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token = "",
  ) {}

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/json", ...extra };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    if (extra["Content-Type"]) h["Content-Type"] = extra["Content-Type"];
    return h;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: this.headers(init?.headers as Record<string, string> | undefined),
    });
    if (!res.ok) throw new Error(`blackboard ${init?.method ?? "GET"} ${path}: ${res.status}`);
    return (await res.json()) as T;
  }

  async read(opts: BlackboardReadOpts): Promise<BlackboardEntry[]> {
    return this.request<BlackboardEntry[]>(`/v1/read${toQuery({ ...opts })}`);
  }

  async snapshot(role = "hermes", limitPerCategory = 15): Promise<BlackboardSnapshot> {
    return this.request<BlackboardSnapshot>(
      `/v1/snapshot${toQuery({ role, limit_per_category: limitPerCategory })}`,
    );
  }

  async write(opts: BlackboardWriteOpts): Promise<BlackboardEntry> {
    return this.request<BlackboardEntry>("/v1/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
  }

  async stats(): Promise<JsonObject> {
    return this.request<JsonObject>("/v1/stats");
  }
}