import { useState } from 'react';

export default function ChatInput({
  status,
  onSubmit,
  stop,
}: {
  status: string;
  onSubmit: (text: string) => void;
  stop?: () => void;
}) {
  const [text, setText] = useState('');

  return (
    <form
      className="flex w-full items-end gap-2"
      onSubmit={e => {
        e.preventDefault();
        if (text.trim() === '') return;
        onSubmit(text);
        setText('');
      }}
    >
      <div className="relative w-full">
        <textarea
          rows={1}
          className="block w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-12 text-sm shadow-sm outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder={status === 'ready' ? 'Skriv ett meddelande…' : 'Bearbetar…'}
          disabled={status !== 'ready'}
          value={text}
          onChange={e => setText(e.target.value)}
        />

        <button
          type="submit"
          disabled={status !== 'ready' || text.trim() === ''}
          className="absolute bottom-1.5 right-1.5 inline-flex h-8 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          aria-label="Skicka"
        >
          Skicka
        </button>
      </div>

      {stop && (status === 'streaming' || status === 'submitted') && (
        <button
          type="button"
          onClick={stop}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Stoppa
        </button>
      )}
    </form>
  );
}
