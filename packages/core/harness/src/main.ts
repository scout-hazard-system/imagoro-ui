import { EventBus, loadFixtureSet, DEFAULT_FIXTURES_URL, type FixtureSet } from "@imagoro/core";
import { EventStreamBlock } from "./eventStreamBlock.js";
import { SLOTS } from "./slots.js";

const root = document.querySelector<HTMLElement>("#slots");
const status = document.querySelector<HTMLElement>("#status");
const badge = document.querySelector<HTMLElement>("#badge");

async function main(): Promise<void> {
  status!.textContent = "loading fixtures…";
  const fixtures: FixtureSet = await loadFixtureSet(DEFAULT_FIXTURES_URL);

  status!.textContent = `fixtures: ${fixtures.stream.length} events`;
  badge!.textContent = fixtures.meta.id;

  const bus = new EventBus();
  const block = new EventStreamBlock();

  for (const slot of SLOTS) {
    const el = document.createElement("div");
    el.className = "bb-slot";
    el.dataset["slot"] = slot.id;
    el.innerHTML = `<div class="bb-slot-label">${slot.config?.label ?? slot.id}</div>`;
    root!.appendChild(el);
    block.mount(el, {
      config: slot.config ?? {},
      dispatch: (evt) => bus.publish(evt),
      subscribe: (fn) => bus.subscribe(fn),
    });
  }

  status!.textContent += " · mounted " + SLOTS.length + "× " + block.manifest.id;
  badge!.textContent = `${block.manifest.id} v${block.manifest.version}`;

  // Replay the fixture stream through the mounted blocks.
  for (const evt of fixtures.stream) {
    bus.publish(evt);
  }
  status!.textContent += ` · replayed ✓`;
}

void main().catch((err) => {
  console.error(err);
  status!.textContent = `harness failed: ${String(err)}`;
});