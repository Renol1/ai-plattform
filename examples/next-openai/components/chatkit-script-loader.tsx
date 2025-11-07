'use client';

import Script from 'next/script';

export default function ChatKitScriptLoader() {
  return (
    <Script
      src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined') {
          // Simple debug log to verify the SDK script has loaded in production
          // You can remove this after verifying things work.
          // eslint-disable-next-line no-console
          console.log('[ChatKit] SDK script loaded', {
            hasGlobal: Boolean((window as any).OpenAIChatKit),
          });
          window.dispatchEvent(new Event('chatkit:loaded'));
        }
      }}
    />
  );
}
