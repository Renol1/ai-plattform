import './globals.css';
import ToastHost from '@/components/toast-host';
import Script from 'next/script';

export const metadata = {
  title: 'Renstrom Chat',
  description: 'En ren och modern chattupplevelse.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
  <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-[#f8f9fa] text-neutral-900" style={{ fontFamily: 'Inter, Roboto, Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji' }}>
        {children}
        {/* Global toast notifications */}
        <ToastHost />
        {/* ChatKit SDK script - load after interactive and notify when ready */}
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('chatkit:loaded'));
            }
          }}
        />
      </body>
    </html>
  );
}
