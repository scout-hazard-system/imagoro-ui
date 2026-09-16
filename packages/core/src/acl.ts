export const ROLES = ["personal", "business", "enterprise"] as const;
export type Role = (typeof ROLES)[number];

export const RC_ROLE = "role" as const;

export const ROLE_LABEL: Record<Role, string> = {
  personal: "Personal",
  business: "Business + Analytics",
  enterprise: "Enterprise + Audit"
};

export const BLACKBOARD_KINDS = ["raw", "summary", "rewrite"] as const;
export type BlackboardKind = (typeof BLACKBOARD_KINDS)[number];
export type BlackboardKindACL = Record<BlackboardKind, boolean>;

export const CATEGORIES = ["pipeline", "crew", "mesh", "route", "analytics", "audit"] as const;
export type BlackboardCategory = (typeof CATEGORIES)[number];

export interface RoleScope {
  read: Partial<Record<BlackboardCategory, BlackboardKindACL>>;
  write: Partial<Record<BlackboardCategory, BlackboardKindACL>>;
}

const noneACL = (partial: BlackboardKind[] = []): BlackboardKindACL => ({
  raw: partial.includes("raw"),
  summary: partial.includes("summary"),
  rewrite: partial.includes("rewrite")
});

function scope(
  read: Partial<Record<BlackboardCategory, BlackboardKind[]>>,
  write: Partial<Record<BlackboardCategory, BlackboardKind[]>>
): RoleScope {
  const to = (src: Partial<Record<BlackboardCategory, BlackboardKind[]>>) =>
    Object.fromEntries(
      CATEGORIES.map((c) => [c, src[c] ? noneACL(src[c]) : noneACL()])
    ) as Partial<Record<BlackboardCategory, BlackboardKindACL>>;
  return { read: to(read), write: to(write) };
}

/**
 * CRM role matrix. Hierarchy: enterprise ⊇ business ⊇ personal.
 * - personal  : read raw/summary on pipeline+crew+mesh+route; write raw/summary into crew+route.
 * - business  : personal {analytics} + pipeline/mesh writes + crew rewrite; NO audit access.
 * - enterprise: everything, including audit read/write (audit export) and cross-rewrite.
 */
export const ACL_MATRIX: Record<Role, RoleScope> = {
  personal: scope(
    { pipeline: ["raw", "summary"], crew: ["summary"], mesh: ["summary"], route: ["summary"] },
    { crew: ["raw", "summary"], route: ["raw"] }
  ),
  business: scope(
    {
      pipeline: ["raw", "summary", "rewrite"],
      crew: ["summary", "rewrite"],
      mesh: ["summary", "rewrite"],
      route: ["raw", "summary"],
      analytics: ["raw", "summary"]
    },
    { pipeline: ["raw", "summary"], crew: ["raw", "summary", "rewrite"], mesh: ["raw"], route: ["raw"], analytics: ["raw", "summary"] }
  ),
  enterprise: scope(
    {
      pipeline: ["raw", "summary", "rewrite"],
      crew: ["raw", "summary", "rewrite"],
      mesh: ["raw", "summary", "rewrite"],
      route: ["raw", "summary", "rewrite"],
      analytics: ["raw", "summary", "rewrite"],
      audit: ["raw", "summary", "rewrite"]
    },
    {
      pipeline: ["raw", "summary", "rewrite"],
      crew: ["raw", "summary", "rewrite"],
      mesh: ["raw", "summary", "rewrite"],
      route: ["raw", "summary", "rewrite"],
      analytics: ["raw", "summary", "rewrite"],
      audit: ["raw", "summary", "rewrite"]
    }
  )
};

export const DEFAULT_ROLE: Role = "business";

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function normalizeRole(value: unknown): Role {
  return isRole(value) ? value : DEFAULT_ROLE;
}

function lookup(
  table: Partial<Record<BlackboardCategory, BlackboardKindACL>>,
  category: string
): BlackboardKindACL | undefined {
  return (table as unknown as Record<string, BlackboardKindACL | undefined>)[category];
}

export function canRead(role: Role, category: string, kind: string): boolean {
  return lookup(ACL_MATRIX[role].read, category)?.[kind as BlackboardKind] ?? false;
}

export function canWrite(role: Role, category: string, kind: string): boolean {
  return lookup(ACL_MATRIX[role].write, category)?.[kind as BlackboardKind] ?? false;
}

export function readableCategories(role: Role): string[] {
  return CATEGORIES.filter((c) => {
    const acl = ACL_MATRIX[role].read[c];
    return acl ? BLACKBOARD_KINDS.some((k) => acl[k]) : false;
  });
}

export function writableKinds(role: Role, category: string): BlackboardKind[] {
  const acl = lookup(ACL_MATRIX[role].write, category);
  if (!acl) return [];
  return BLACKBOARD_KINDS.filter((k) => acl[k]);
}

/**
 * Drop blackboard categories a role may not read. `values` is a category->kv map
 * (shape of a blackboard snapshot); categories not readable are replaced with a
 * masked placeholder so callers never see the material.
 */
export function maskSnapshot(
  role: Role,
  values: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const readable = new Set(readableCategories(role));
  for (const [category, value] of Object.entries(values)) {
    out[category] = readable.has(category) ? value : { masked: true, reason: "acl:category" };
  }
  return out;
}

export function scopeFor(role: Role, category: string): { read: BlackboardKind[]; write: BlackboardKind[] } {
  const read = lookup(ACL_MATRIX[role].read, category);
  const write = lookup(ACL_MATRIX[role].write, category);
  return {
    read: read ? BLACKBOARD_KINDS.filter((k) => read[k]) : [],
    write: write ? BLACKBOARD_KINDS.filter((k) => write[k]) : []
  };
}