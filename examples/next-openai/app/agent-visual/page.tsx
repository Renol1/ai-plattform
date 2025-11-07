'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import CodeLogo from '@/components/code-logo';
import ThemeToggle from '@/components/theme-toggle';
import AgentShader from '@/components/agent-shader';

type AgentKey = 'SystemAgent' | 'FoodAgent' | 'TrainerAgent' | 'LouAgent';

const ALL_AGENTS: AgentKey[] = ['SystemAgent', 'FoodAgent', 'TrainerAgent', 'LouAgent'];

export default function VisualAgentPage() {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // RunId used to correlate an SSE stream with a chat request
  const runIdRef = useRef<string | null>(null);

  // Basic chat using existing agent API endpoint. Inject runId per send via prepareSendMessagesRequest
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat-agents',
        prepareSendMessagesRequest: ({ body }) => {
          return {
            body: {
              ...body,
              agentEventRunId: runIdRef.current ?? undefined,
            },
          };
        },
      }),
    [],
  );

  const { status, sendMessage, messages, stop, error } = useChat({ id: 'visual-agent', transport });
  const isBusy = status === 'submitted' || status === 'streaming';

  // Visual agent activity state
  const [active, setActive] = useState<Record<AgentKey, boolean>>({
    SystemAgent: false,
    FoodAgent: false,
    TrainerAgent: false,
    LouAgent: false,
  });
  const activeArray = [active.SystemAgent, active.FoodAgent, active.TrainerAgent, active.LouAgent];

  // Determine likely agent chain based on the user prompt
  const computeChain = (text: string): AgentKey[] => {
    const t = text.toLowerCase();
    const wantsFood = /(protein|kalori|kalor|näring|naring|livsmed|mat|frukost|lunch|middag|ris|gröt|kyckling|kött|bönor|lök)/.test(t);
    const chain: AgentKey[] = ['SystemAgent'];
    if (wantsFood) chain.push('FoodAgent');
    chain.push('TrainerAgent', 'LouAgent');
    return chain.filter((v, i, a) => a.indexOf(v) === i);
  };

  // SSE hookup for real-time agent activity
  useEffect(() => {
    if (!isBusy && runIdRef.current) {
      // ensure reset when run finishes
      setActive({ SystemAgent: false, FoodAgent: false, TrainerAgent: false, LouAgent: false });
    }
  }, [isBusy]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    const runId = Math.random().toString(36).slice(2);
    runIdRef.current = runId;

    // Open SSE stream tied to this run
    try {
      const es = new EventSource(`/api/agent-visual/events?runId=${encodeURIComponent(runId)}`);
      const stopAll = () => {
        setActive({ SystemAgent: false, FoodAgent: false, TrainerAgent: false, LouAgent: false });
        es.close();
      };
      es.addEventListener('agent', (evt: MessageEvent) => {
        try {
          const data = JSON.parse(evt.data) as { name: AgentKey; state: 'start' | 'end' };
          setActive(prev => ({
            SystemAgent: false,
            FoodAgent: false,
            TrainerAgent: false,
            LouAgent: false,
            [data.name]: data.state === 'start',
          }) as Record<AgentKey, boolean>);
        } catch {}
      });
      es.addEventListener('finish', () => {
        stopAll();
        runIdRef.current = null;
      });

      // in case of error, close the stream to avoid leaks
      es.onerror = () => {
        stopAll();
      };
    } catch {}

    // now send the message; transport will include agentEventRunId
    sendMessage({ text });
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-dvh bg-[#0b0b10] text-neutral-100">
      {/* Top nav with back link and theme toggle */}
      <header className="w-full sticky top-0 z-10 bg-[#0b0b10]/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-sm text-neutral-300 hover:text-white">← Tillbaka till startsidan</a>
          <ThemeToggle />
        </div>
      </header>

      {/* Logo */}
      <div className="max-w-[1100px] mx-auto px-4 pt-10 pb-4 flex justify-center">
        <CodeLogo />
      </div>

      <main className="max-w-[1100px] mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chat card */}
          <section className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] p-6">
            <h2 className="text-lg font-semibold tracking-wide mb-4 text-white">Chatt</h2>
            {/* Messages */}
            <div className="min-h-[220px] max-h-[420px] overflow-y-auto pr-1 space-y-2 mb-4">
              {messages.length === 0 && (
                <p className="text-neutral-400 text-sm">Börja med en fråga, t.ex. "Hur mycket protein i kokt ris?"</p>
              )}
              {messages.map(m => {
                const text = m.parts.map(p => (p.type === 'text' ? p.text : '')).join('');
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-0`}>
                    <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-[12px] px-4 py-2 text-[15px] ${
                      isUser
                        ? 'bg-[#6a2bb8] text-white shadow-[0_0_20px_rgba(122,64,200,0.35)]'
                        : 'bg-white/8 text-neutral-100 border border-white/10'
                    }`}>
                      {text}
                    </div>
                  </div>
                );
              })}
              {error && <div className="text-red-400 text-sm">Ett fel inträffade. Försök igen.</div>}
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Skriv din fråga..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend();
                }}
                disabled={isBusy}
                className="flex-1 rounded-lg px-4 py-3 text-[15px] bg-[#0e0e14] text-neutral-100 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#7d3fc3]/40"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isBusy || !input.trim()}
                className="h-[48px] px-5 rounded-lg bg-[#7d3fc3] text-white font-medium hover:bg-[#6a2bb8] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(125,63,195,0.45)]"
              >
                Skicka
              </button>
            </div>
            {isBusy && (
              <div className="mt-3 flex items-center gap-3 text-sm text-neutral-400">
                <span>Arbetar...</span>
                <button type="button" onClick={stop} className="text-[#b385ff] hover:underline">Stoppa</button>
              </div>
            )}
          </section>

          {/* Agents visualizer */}
          <section className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] p-6">
            <h2 className="text-lg font-semibold tracking-wide mb-4 text-white">Agentaktivitet</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ALL_AGENTS.map(key => (
                <AgentBox key={key} name={key} active={!!active[key]} />
              ))}
            </div>
            <div className="mt-4">
              <AgentShader active={activeArray} />
            </div>
            <p className="mt-4 text-xs text-neutral-400">
              Visualisering sker i realtid via SSE (Server-Sent Events). När en agent aktiveras pulserar dess nod och slocknar när steget är klart.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function AgentBox({ name, active }: { name: string; active: boolean }) {
  return (
    <div
      className={`relative rounded-xl p-4 text-center border transition-all duration-300 select-none ${
        active
          ? 'border-[#b385ff] bg-[#1a1226] shadow-[0_0_24px_rgba(179,133,255,0.35),inset_0_0_30px_rgba(125,63,195,0.15)]'
          : 'border-white/10 bg-white/3'
      }`}
    >
      <div
        className={`mx-auto mb-2 h-3 w-3 rounded-full ${active ? 'bg-[#b385ff] animate-pulse' : 'bg-neutral-600'}`}
      />
      <div className="text-sm font-medium text-white tracking-wide">{name}</div>
      {active && (
        <div className="absolute -inset-0.5 rounded-xl blur-md pointer-events-none bg-gradient-to-br from-[#7d3fc3]/30 to-transparent" />
      )}
    </div>
  );
}
