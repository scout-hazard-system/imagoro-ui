import { useMemo } from "react";
import { normalizeBusEvent, type BusEvent, type FixtureSet, type JsonObject } from "@imagoro/core";

interface ParityRow {
  legacy: Record<string, unknown>;
  canonicalType: string;
  matches: boolean;
}

/**
 * Parity harness (read-only ref): re-emits each fixture event in the legacy protocol shape
 * (routing SSE `event_type` + top-level fields, blackboard categories) and re-reads it with
 * `normalizeBusEvent`, proving the new blocks consume the same data the legacy adapters do.
 * adapter-jvm / adapter-qt are docs-only in M2; this is the surface they extend later.
 */
export function ParityPane({ fixtures }: { fixtures: FixtureSet | null }): JSX.Element {
  const parity = useMemo<{ allMatch: boolean; rows: ParityRow[] } | null>(() => {
    if (!fixtures) return null;
    const rows: ParityRow[] = fixtures.stream.map((evt) => {
      const legacy = toLegacy(evt);
      const back = normalizeBusEvent(legacy);
      return {
        legacy,
        canonicalType: evt.type,
        matches: !!back && back.type === evt.type && back.ts === evt.ts,
      };
    });
    return { allMatch: rows.every((r) => r.matches), rows };
  }, [fixtures]);

  if (!parity) return <div className="block__empty">parity: no fixtures</div>;

  return (
    <section className="block parity" data-testid="parity">
      <header className="block__head">
        <span className="block__title">Parity — legacy adapter refs</span>
        <span className={`block__hint${parity.allMatch ? " parity__ok" : " parity__drift"}`}>
          {parity.allMatch ? "normalization parity ✓" : "drift!"}
        </span>
      </header>
      <p className="parity__note">
        Fixtures re-emitted in legacy <code>event_type</code> shape, re-read with normalizeBusEvent.
      </p>
      <div className="parity__grid">
        {parity.rows.map((r, i) => (
          <div className="parity__row" key={i}>
            <code className="parity__legacy">{JSON.stringify(r.legacy)}</code>
            <code className="parity__canonical">→ {r.canonicalType}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Canonical event → legacy flat wire shape (the routing dev_server convention). */
function toLegacy(e: BusEvent): Record<string, unknown> {
  return { event_type: e.type, ts: e.ts, ...(e.payload as JsonObject) };
}