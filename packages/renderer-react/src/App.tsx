import { useEffect, useRef, useState } from "react";
import { BlockRegistry, loadFixtureSet, DEFAULT_FIXTURES_URL, type FixtureSet } from "@imagoro/core";
import { reactBlockHost } from "./reactBlockHost.js";
import { ParityPane } from "./ParityPane.js";
import { webBlocks, webBlockManifests } from "./catalog.js";
import "./harness.css";

/** M2 harness: registers all 11 web blocks into a shared core registry and mounts them as a
 *  flat grid, then replays the fixture stream through bus dispatch (Slots A/B/C style). */
export function App(): JSX.Element {
  const registryRef = useRef<BlockRegistry | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("booting…");
  const [fixtures, setFixtures] = useState<FixtureSet | null>(null);
  const [played, setPlayed] = useState(0);

  useEffect(() => {
    const reg = new BlockRegistry();
    for (const pkg of webBlocks) {
      reg.register(pkg.manifest.id, reactBlockHost(pkg.manifest, pkg.component as Parameters<typeof reactBlockHost>[1]));
    }
    registryRef.current = reg;
    void loadFixtureSet(DEFAULT_FIXTURES_URL)
      .then((f) => {
        setFixtures(f);
        setStatus(`fixtures loaded · ${f.stream.length} events · ${webBlockManifests.length} blocks`);
        if (slotRef.current) mountAll(reg, slotRef.current);
      })
      .catch((err: unknown) => setStatus(`fixture load failed: ${String(err)}`));
  }, []);

  const mountAll = (reg: BlockRegistry, host: HTMLElement): void => {
    host.innerHTML = "";
    for (const pkg of webBlocks) {
      const slot = document.createElement("section");
      slot.className = "harness-slot";
      slot.dataset["block"] = pkg.manifest.id;
      slot.dataset["family"] = pkg.manifest.family;
      host.appendChild(slot);
      reg.mount(slot, { id: pkg.manifest.id });
    }
  };

  const replayNext = (): void => {
    const reg = registryRef.current;
    const f = fixtures;
    if (!reg || !f) return;
    const evt = f.stream[played];
    if (!evt) return;
    reg.dispatch(evt);
    setPlayed(played + 1);
  };

  const replayAll = (): void => {
    const reg = registryRef.current;
    const f = fixtures;
    if (!reg || !f) return;
    for (const evt of f.stream) reg.dispatch(evt);
    setPlayed(f.stream.length);
  };

  const replaySnapshot = (): void => {
    const reg = registryRef.current;
    if (!reg || !fixtures) return;
    reg.snapshot(fixtures.snapshot);
    setStatus("snapshot applied");
  };

  const reset = (): void => {
    const reg = registryRef.current;
    if (!reg || !slotRef.current) return;
    reg.unmountAll();
    if (slotRef.current) mountAll(reg, slotRef.current);
    setPlayed(0);
    setStatus("reset");
  };

  return (
    <div className="harness">
      <header className="harness__bar">
        <h1 className="harness__title">{webBlockManifests.length} blocks · renderer-react harness</h1>
        <span className="harness__status" data-status={status.startsWith("fixture") ? "ok" : "warn"}>{status}</span>
        <div className="harness__controls">
          <button type="button" onClick={replaySnapshot} disabled={!fixtures}>snapshot</button>
          <button type="button" onClick={replayNext} disabled={!fixtures || played >= fixtures.stream.length}>next ({played}/{fixtures?.stream.length ?? 0})</button>
          <button type="button" onClick={replayAll} disabled={!fixtures}>replay all</button>
          <button type="button" onClick={reset}>reset</button>
        </div>
      </header>
      <div className="harness__legend" aria-label="block manifest list">
        {webBlockManifests.map((m) => (
          <span key={m.id} className="harness__chip" data-family={m.family}>{m.name}</span>
        ))}
      </div>
      <main ref={slotRef} className="harness__grid" />
      <ParityPane fixtures={fixtures} />
    </div>
  );
}