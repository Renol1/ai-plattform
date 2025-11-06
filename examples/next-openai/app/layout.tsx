import './globals.css';
import { Inter } from 'next/font/google';
import ThemeToggle from '@/components/theme-toggle';

export const metadata = {
  title: 'AI Chat • Next.js + AI SDK',
  description: 'A clean, minimal chat UI powered by the AI SDK and Next.js.',
};

// Fonts from next/font must be initialized at module scope
const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Prevent dark-mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var e=localStorage.getItem('theme');if('dark'===e||(!e&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}}();`,
          }}
        />
      </head>
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
              <div className="flex items-center gap-2">
                <div className="hidden text-xs text-zinc-500 sm:block">Next.js + AI SDK</div>
                <ThemeToggle />
              </div>
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
