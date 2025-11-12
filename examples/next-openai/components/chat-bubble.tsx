import clsx from 'clsx';
import { ReactNode } from 'react';

export default function ChatBubble({
  role,
  children,
}: {
  role: 'user' | 'assistant' | 'system' | string;
  children: ReactNode;
}) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <div
      className={clsx('flex w-full', {
        'justify-end': isUser,
        'justify-start': !isUser,
      })}
    >
      <div
        className={clsx(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          isUser &&
            'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
          !isUser && !isSystem &&
            'bg-white text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800',
          isSystem &&
            'bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-700'
        )}
      >
        {children}
      </div>
    </div>
  );
}
