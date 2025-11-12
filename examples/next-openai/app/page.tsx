'use client';

import { useChat } from '@ai-sdk/react';
import ChatInput from '@/components/chat-input';
import ChatBubble from '@/components/chat-bubble';

export default function Chat() {
  const { error, status, sendMessage, messages, regenerate, stop, setMessages, clearError } = useChat();

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-3xl grid-rows-[auto_1fr_auto] gap-4 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-zinc-200 backdrop-blur dark:bg-zinc-950/60 dark:ring-zinc-800 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Konversation</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearError?.();
                setMessages([]);
              }}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Rensa chat
            </button>
          </div>
        </div>

        <div className="flex min-h-[50vh] flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <div className="mx-auto mt-16 max-w-[28rem] text-center text-sm text-zinc-500">
              Börja chatta genom att skriva ett meddelande nedan.
            </div>
          )}

          {messages.map(m => (
            <ChatBubble key={m.id} role={m.role}>
              <div className="whitespace-pre-wrap">
                {m.parts.map(part => {
                  if (part.type === 'text') return part.text;
                })}
              </div>
            </ChatBubble>
          ))}

          {(status === 'submitted' || status === 'streaming') && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-1 rounded-2xl bg-white px-3 py-2 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:120ms]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:240ms]"></span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-300">
              Ett fel inträffade.
              <button
                type="button"
                className="ml-3 inline-flex items-center rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                onClick={() => regenerate()}
              >
                Försök igen
              </button>
            </div>
          )}
        </div>

        <ChatInput
          status={status}
          onSubmit={text => sendMessage({ text })}
          stop={stop}
        />
      </div>
    </div>
  );
}
