import { createUIMessageStreamResponse, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model = 'gpt-5',
    instructions = '',
    effort = 'medium',
    workflowId,
    name = 'Renstrom Agent',
  }: {
    messages: UIMessage[];
    model?: string;
    instructions?: string;
    effort?: 'low' | 'medium' | 'high';
    workflowId?: string;
    name?: string;
  } = await req.json();

  // extract last user input
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const userText = lastUser
    ? lastUser.parts.map(p => (p.type === 'text' ? p.text : '')).join('')
    : '';

  // Stream UIMessageChunks to the client
  const stream = new ReadableStream({
    async start(controller) {
      const write = (chunk: any) => controller.enqueue(chunk);
      try {
        write({ type: 'start' });
        const id = Math.random().toString(36).slice(2);
        write({ type: 'text-start', id });

        // Run the OpenAI Agent via Agents SDK
        const { Agent, Runner, withTrace } = await import('@openai/agents');

        const agent = new Agent({
          name,
          instructions,
          model,
          modelSettings: {
            reasoning: { effort, summary: 'auto' },
          },
          store: true,
        });

        const runner = new Runner({
          traceMetadata: workflowId
            ? { __trace_source__: 'renstrom-chat', workflow_id: workflowId }
            : { __trace_source__: 'renstrom-chat' },
        });

        const result = await withTrace('Renstrom Agent', async () =>
          runner.run(agent, [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: userText,
                },
              ],
            },
          ]),
        );

        const finalText = result?.finalOutput ?? '';
        if (finalText) {
          write({ type: 'text-delta', id, delta: finalText });
        }
        write({ type: 'text-end', id });
        write({ type: 'finish' });
        controller.close();
      } catch (err: any) {
        write({ type: 'error', errorText: err?.message ?? 'Agent error' });
        controller.close();
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
