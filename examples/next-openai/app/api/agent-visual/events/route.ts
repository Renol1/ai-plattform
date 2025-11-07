import { NextRequest } from 'next/server';
import { AgentEvent, subscribe } from '../../../../util/agent-events';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function sseFormat(event: string | undefined, data: any) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return `${event ? `event: ${event}\n` : ''}data: ${payload}\n\n`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId') || '';
  if (!runId) {
    return new Response('Missing runId', { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // initial open
      controller.enqueue(new TextEncoder().encode(': connected\n\n'));
      const unsubLocal = subscribe(runId, (event: AgentEvent) => {
        if (event.type === 'agent') {
          controller.enqueue(
            new TextEncoder().encode(
              sseFormat('agent', { name: (event as any).name, state: (event as any).state }),
            ),
          );
        } else if (event.type === 'finish') {
          controller.enqueue(new TextEncoder().encode(sseFormat('finish', {})));
        }
      });

      // heartbeat every 15s
      const hb = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(': ping\n\n'));
      }, 15000);

      // cleanup
      const close = async () => {
        clearInterval(hb);
        try { unsubLocal(); } catch {}
        try {
          controller.close();
        } catch {}
      };

      // close after 55s to avoid timeouts; client can reconnect if needed
      const ttl = setTimeout(close, 55000);

      // attach to underlying cancel
      (controller as any)._onCancel = close;

      // store for potential future use
      (controller as any)._meta = { runId, hb, ttl };
    },

    cancel() {},
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
