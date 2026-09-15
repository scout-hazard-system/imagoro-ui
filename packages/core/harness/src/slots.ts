export interface SlotConfig {
  id: string;
  config?: Record<string, unknown>;
}

export const SLOTS: SlotConfig[] = [
  { id: "a", config: { label: "Slot A — ETA / traffic / hazard" } },
  { id: "b", config: { label: "Slot B — jurisdiction / geofence telemetry" } },
  { id: "c", config: { label: "Slot C — user controls / plugins" } },
];