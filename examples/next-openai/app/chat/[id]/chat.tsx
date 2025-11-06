'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ThemeToggle from '@/components/theme-toggle';
import CodeLogo from '@/components/code-logo';
import { getAgent, RenstromAgent } from '@/lib/agents-store';

export default function Chat({ id }: { id: string }) {
  const [agent, setAgent] = useState<RenstromAgent | undefined>(undefined);

  useEffect(() => {
    setAgent(getAgent(id));
  }, [id]);

  const transport = useMemo(() => {
    if (!agent) return undefined;
    return new DefaultChatTransport({
      api: '/api/chat-agents',
      body: {
        agentId: agent.id,
        model: agent.model,
        instructions: agent.instructions,
        workflowId: agent.workflowId,
        effort: agent.effort,
        store: agent.store,
        name: agent.name,
      },
    });
  }, [agent]);

  const { status, sendMessage, messages, stop, error } = useChat({
    id: `agent-${id}`,
    transport: transport,
  });

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSend = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput('');
    inputRef.current?.focus();
  };

  if (!agent) {
    return (
      <div className="min-h-dvh">
        <header className="w-full sticky top-0 z-10 bg-[#f8f9fa]/80 backdrop-blur-sm">
          <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="select-none" aria-label="Hem">
              <CodeLogo compact />
            </a>
            <ThemeToggle />
          </div>
        </header>
        <main className="px-4 pb-12">
          {/* Hero logo */}
          <div className="max-w-[900px] mx-auto mt-8 mb-6 flex items-center justify-center">
            <CodeLogo />
          </div>
          <div className="max-w-[800px] mx-auto mt-8 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-8">
            <h1 className="text-xl font-semibold text-neutral-900 mb-2">Kunde inte hitta agenten</h1>
            <p className="text-neutral-600">Agenten finns inte längre. Gå tillbaka till startsidan och välj en annan.</p>
            <a href="/" className="inline-block mt-6 text-white bg-[#1560A8] hover:bg-[#104F86] rounded-lg px-4 py-2">Till startsidan</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="w-full sticky top-0 z-10 bg-[#f8f9fa]/80 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="select-none" aria-label="Hem">
            <CodeLogo compact />
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 pb-12">
        {/* Hero logo */}
        <div className="max-w-[900px] mx-auto mt-8 mb-6 flex items-center justify-center">
          <CodeLogo />
        </div>
        <div className="max-w-[800px] mx-auto mt-8 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-8">
          {/* Card header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Konversation</h1>
              <p className="text-sm text-neutral-500">{agent.name} · {agent.model.toUpperCase()} · effort: {agent.effort}</p>
            </div>
            <a
              href="/"
              aria-label="Till dashboard"
              title="Till dashboard"
              className="text-neutral-500 hover:text-neutral-700"
            >
              ⟵
            </a>
          </div>

          {/* Messages */}
          <div className="space-y-2 mb-6">
            {messages.length === 0 && (
              <p className="text-neutral-500 text-sm">Börja konversationen med {agent.name} genom att skriva ett meddelande.</p>
            )}
            {messages.map(m => {
              const text = m.parts
                .map(part => (part.type === 'text' ? part.text : ''))
                .join('');
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-0`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-[12px] px-4 py-2 ${
                      isUser
                        ? 'bg-[#e3f2fd] text-neutral-900'
                        : 'bg-[#e9ecef] text-neutral-900'
                    }`}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
            {error && (
              <div className="text-red-600 text-sm">Ett fel inträffade. Försök igen.</div>
            )}
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={`Skriv till ${agent.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={isBusy}
              className="flex-1 border border-[#dddddd] rounded-lg px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1560A8]/30"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isBusy || !input.trim()}
              className="h-[48px] px-5 rounded-lg bg-[#1560A8] text-white font-medium hover:bg-[#104F86] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skicka
            </button>
          </div>

          {isBusy && (
            <div className="mt-3 flex items-center gap-3 text-sm text-neutral-500">
              <span>Laddar...</span>
              <button type="button" onClick={stop} className="text-[#1560A8] hover:underline">Stoppa</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
