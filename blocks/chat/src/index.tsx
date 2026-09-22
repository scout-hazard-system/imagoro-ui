import type { BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export { manifest } from "./manifest.js";

interface ChatMessage {
  role: string;
  text: string;
  model?: string;
}

interface ChatState {
  messages: ChatMessage[];
}

const initial: ChatState = { messages: [] };

function onChat(state: ChatState, evt: BusEvent): ChatState {
  if (evt.type === "chat/message") {
    const p = payload(evt);
    const msg: ChatMessage = {
      role: String(p.role ?? "system"),
      text: String(p.text ?? ""),
      model: p.model !== undefined ? String(p.model) : undefined
    };
    return { messages: [...state.messages.slice(-200), msg] };
  }
  return state;
}

export default function ChatBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onChat);
  return (
    <section className="block">
      <h3>Chat</h3>
      <div className="chat-log" aria-live="polite">
        {state.messages.map((m, i) => (
          <div className="chat-msg" key={i}>
            <span className="who">{m.role}</span>
            <span>{m.text}</span>
            {m.model ? <span className="muted"> · {m.model}</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}