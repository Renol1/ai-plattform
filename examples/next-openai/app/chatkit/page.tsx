'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { toast } from '@/lib/toast';

// Avoid spamming success notifications on refreshes
let chatKitSuccessShown = false;

export default function ChatKitPage() {
  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        // TODO: implement refresh using existing if needed
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
    <div className="min-h-dvh px-4 pb-12">
      <div className="max-w-[800px] mx-auto mt-8 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-4">
        <h1 className="text-xl font-semibold text-neutral-900 mb-4">ChatKit</h1>
        <ChatKit control={control} className="h-[600px] w-full" />
      </div>
    </div>
  );
}
