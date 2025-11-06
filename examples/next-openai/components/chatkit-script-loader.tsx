'use client';

import Script from 'next/script';

export default function ChatKitScriptLoader() {
  return (
    <Script
      src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('chatkit:loaded'));
        }
      }}
    />
  );
}
