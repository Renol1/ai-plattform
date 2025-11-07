// Simple in-memory event bus for agent activity events.
// NOTE: Works for single runtime (dev/server). For serverless/multi-instance, use a shared store (e.g. Redis, Upstash) instead.

export type AgentEvent =
  | { type: 'agent'; name: string; state: 'start' | 'end' }
  | { type: 'finish' };

type Subscriber = (event: AgentEvent) => void;

const channels = new Map<string, Set<Subscriber>>();

export function publish(runId: string, event: AgentEvent) {
  const subs = channels.get(runId);
  if (!subs || subs.size === 0) return;
  subs.forEach(cb => {
    try {
      cb(event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[agent-events] subscriber error', err);
    }
  });
}

export function subscribe(runId: string, cb: Subscriber): () => void {
  const set = channels.get(runId) ?? new Set<Subscriber>();
  set.add(cb);
  channels.set(runId, set);
  return () => {
    const s = channels.get(runId);
    if (!s) return;
    s.delete(cb);
    if (s.size === 0) channels.delete(runId);
  };
}
