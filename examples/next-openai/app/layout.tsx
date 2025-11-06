import './globals.css';
import { Inter } from 'next/font/google';

export const metadata = {
  title: 'AI Chat • Next.js + AI SDK',
  description: 'A clean, minimal chat UI powered by the AI SDK and Next.js.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const inter = Inter({ subsets: ['latin'] });
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-dvh bg-gradient-radial from-white to-zinc-50 text-foreground antialiased dark:from-zinc-950 dark:to-black`}>
        <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 sm:px-6">
          <header className="sticky top-0 z-10 -mx-4 mb-4 border-b bg-white/70 px-4 py-4 backdrop-blur dark:bg-zinc-950/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-black text-xs font-bold text-white dark:bg-white dark:text-black">AI</span>
                <h1 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Chat
                </h1>
              </div>
              <div className="text-xs text-zinc-500">Next.js + AI SDK</div>
            </div>
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="mt-6 pb-6 text-center text-xs text-zinc-500">
            Built with AI SDK. Example app.
          </footer>
        </div>
      </body>
    </html>
  );
}
