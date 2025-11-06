'use client';

import { useState } from 'react';
import ThemeToggle from '@/components/theme-toggle';
import CodeLogo from '@/components/code-logo';
import {
  deleteAgent,
  generateId,
  listAgents,
  RenstromAgent,
  saveAgent,
} from '@/lib/agents-store';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { toast } from '@/lib/toast';
import ErrorBoundary from '@/components/error-boundary';

// Avoid spamming success notifications on refreshes
let chatKitSuccessShown = false;

function EmbeddedChatKit() {
  const chatKit = useChatKit({
    api: {
      async getClientSecret(currentClientSecret: string | null) {
        try {
          const res = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) {
            let body = '';
            try {
              body = await res.text();
            } catch {}
            console.error('Failed to create ChatKit session', {
              status: res.status,
              body,
            });
            toast(`Kunde inte skapa ChatKit-session (HTTP ${res.status}). ${body || ''}`.trim(), 'error');
            throw new Error(`Failed to create ChatKit session: ${res.status}`);
          }
          const data = await res.json();
          const client_secret = (data as any)?.client_secret as string | undefined;
          if (!client_secret) {
            console.error('Svar saknar client_secret', data);
            toast('Kunde inte skapa ChatKit-session: svar saknar client_secret', 'error');
            throw new Error('No client_secret in response');
          }
          // eslint-disable-next-line no-console
          console.log('[ChatKit] client_secret received');
          if (!chatKitSuccessShown) {
            toast('ChatKit redo', 'success');
            chatKitSuccessShown = true;
          }
          return client_secret as string;
        } catch (err) {
          console.error('getClientSecret threw', err);
          toast(`Fel vid hämtning av ChatKit client_secret: ${String(err)}`, 'error');
          throw err;
        }
      },
    },
  });

  return (
    <div className="mt-6">
      <h2 className="text-base font-semibold text-neutral-900 mb-2">Inbäddad ChatKit</h2>
      <div className="rounded-xl border border-[#e5e7eb] p-2">
        <ErrorBoundary>
          <ChatKit control={chatKit.control} className="h-[600px] w-full" />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [agents, setAgents] = useState<RenstromAgent[]>(() => listAgents());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [model, setModel] = useState('gpt-5');
  const [workflowId, setWorkflowId] = useState('');
  const [effort, setEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const [showChatKit, setShowChatKit] = useState(false);

  // ChatKit is mounted via <EmbeddedChatKit /> when showChatKit is true

  const resetForm = () => {
    setName('');
    setInstructions('');
    setModel('gpt-5');
    setWorkflowId('');
    setEffort('medium');
  };

  const onCreate = () => {
    if (!name.trim()) return;
    const agent: RenstromAgent = {
      id: generateId(),
      name: name.trim(),
      instructions: instructions.trim(),
      model: model || 'gpt-5',
      workflowId: workflowId || undefined,
      effort,
      store: true,
      createdAt: Date.now(),
    };
    saveAgent(agent);
    setAgents(listAgents());
    setShowForm(false);
    resetForm();
  };

  const onDelete = (id: string) => {
    deleteAgent(id);
    setAgents(listAgents());
  };

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
        <div className="max-w-[800px] mx-auto mt-8 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-8">
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-xl font-semibold text-neutral-900">Välj en agent</h1>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="h-10 px-4 rounded-lg bg-[#1560A8] text-white font-medium hover:bg-[#104F86]"
            >
              Ny agent
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowChatKit(v => !v)}
              className="h-9 px-3 rounded-md border border-neutral-300 text-neutral-700 text-sm hover:bg-neutral-50"
            >
              {showChatKit ? 'Dölj ChatKit' : 'Visa ChatKit'}
            </button>
          </div>

          {agents.length === 0 ? (
            <p className="text-neutral-600">Du har inga agenter ännu. Skapa din första för att komma igång.</p>
          ) : (
            <ul className="space-y-3">
              {agents.map(a => (
                <li key={a.id} className="border border-[#e5e7eb] rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-neutral-900">{a.name}</div>
                    <div className="text-sm text-neutral-500 line-clamp-1">{(a.instructions || '').split('\n')[0] || '—'}</div>
                    <div className="text-xs text-neutral-400 mt-1">{a.model.toUpperCase()} · effort: {a.effort}{a.workflowId ? ` · wf: ${a.workflowId}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/chat/${a.id}`} className="px-3 h-9 inline-flex items-center rounded-md bg-[#1560A8] text-white text-sm hover:bg-[#104F86]">Öppna</a>
                    <button onClick={() => onDelete(a.id)} className="px-3 h-9 inline-flex items-center rounded-md border border-neutral-300 text-neutral-700 text-sm hover:bg-neutral-50">Ta bort</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showChatKit && <EmbeddedChatKit />}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-[640px] bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Ny agent</h2>
                <button onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-neutral-700">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Namn</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-[#ddd] rounded-md px-3 py-2" placeholder="t.ex. Mina mejl" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1">Instruktioner</label>
                  <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full border border-[#ddd] rounded-md px-3 py-2 min-h-28" placeholder="Beskriv agentens uppgift..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Modell</label>
                    <input value={model} onChange={e => setModel(e.target.value)} className="w-full border border-[#ddd] rounded-md px-3 py-2" placeholder="gpt-5" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Workflow ID (valfritt)</label>
                    <input value={workflowId} onChange={e => setWorkflowId(e.target.value)} className="w-full border border-[#ddd] rounded-md px-3 py-2" placeholder="ex. my-workflow" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Effort-level</label>
                    <select value={effort} onChange={e => setEffort(e.target.value as any)} className="w-full border border-[#ddd] rounded-md px-3 py-2">
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="px-4 h-10 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50">Avbryt</button>
                <button onClick={onCreate} className="px-4 h-10 rounded-md bg-[#1560A8] text-white hover:bg-[#104F86]">Skapa</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
