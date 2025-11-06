'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';

export default function ChatKitPage() {
  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        // TODO: implement refresh using existing if needed
        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to create ChatKit session');
        const { client_secret } = await res.json();
        return client_secret as string;
      },
    },
  });

  return (
    <div className="min-h-dvh px-4 pb-12">
      <div className="max-w-[800px] mx-auto mt-8 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-4">
        <h1 className="text-xl font-semibold text-neutral-900 mb-4">ChatKit</h1>
        <ChatKit control={control} className="h-[600px] w-full" />
      </div>
    </div>
  );
}
