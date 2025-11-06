'use client';

import { useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import ThemeToggle from '@/components/theme-toggle';

export default function RenstromChat() {
  // Change chat id to clear messages without persisting anything
  const [chatId, setChatId] = useState(() => Math.random().toString(36).slice(2));
  const { error, status, sendMessage, messages, stop } = useChat({ id: chatId });

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

  const clearChat = () => {
    setChatId(Math.random().toString(36).slice(2));
  };

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="w-full sticky top-0 z-10 bg-[#f8f9fa]/80 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-neutral-900 select-none">Renstrom</a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 pb-12">
        <div className="max-w-[800px] mx-auto mt-8 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-8">
          {/* Card header */}
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-xl font-semibold text-neutral-900">Renstrom Chat</h1>
            <button
              type="button"
              onClick={clearChat}
              aria-label="Rensa chat"
              title="Rensa chat"
              className="text-neutral-500 hover:text-neutral-700"
            >
              🗑️
            </button>
          </div>

          {/* Messages */}
          <div className="space-y-2 mb-6">
            {messages.length === 0 && (
              <p className="text-neutral-500 text-sm">Börja konversationen genom att skriva ett meddelande.</p>
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
                        : 'bg-[#f1f1f1] text-neutral-900'
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
              placeholder="Skriv ett meddelande..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={isBusy}
              className="flex-1 border border-[#dddddd] rounded-lg px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1976d2]/30"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isBusy || !input.trim()}
              className="h-[48px] px-5 rounded-lg bg-[#1976d2] text-white font-medium hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skicka
            </button>
          </div>

          {/* Busy controls */}
          {isBusy && (
            <div className="mt-3 flex items-center gap-3 text-sm text-neutral-500">
              <span>Laddar...</span>
              <button
                type="button"
                onClick={stop}
                className="text-[#1976d2] hover:underline"
              >
                Stoppa
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
