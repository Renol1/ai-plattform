import { createUIMessageStreamResponse, UIMessage } from 'ai';
import { publish } from '../../../util/agent-events';

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function computeChain(text: string) {
  const t = (text || '').toLowerCase();
  const wantsFood = /(protein|kalori|kalor|näring|naring|livsmed|mat|frukost|lunch|middag|ris|gröt|kyckling|kött|bönor|lök)/.test(
    t,
  );
  const chain = ['SystemAgent'];
  if (wantsFood) chain.push('FoodAgent');
  chain.push('TrainerAgent', 'LouAgent');
  // unique preserve order
  return chain.filter((v, i, a) => a.indexOf(v) === i);
}

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model = 'gpt-5',
    instructions = '',
    effort = 'medium',
    workflowId,
    name = 'Renstrom Agent',
    agentEventRunId,
  }: {
    messages: UIMessage[];
    model?: string;
    instructions?: string;
    effort?: 'low' | 'medium' | 'high';
    workflowId?: string;
    name?: string;
    agentEventRunId?: string;
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
        });

        const runner = new Runner({
          traceMetadata: workflowId
            ? { __trace_source__: 'renstrom-chat', workflow_id: workflowId }
            : { __trace_source__: 'renstrom-chat' },
        });

        // kick off agent activity SSE simulation if runId provided
        let finished = false;
        const runId = agentEventRunId?.trim();
        if (runId) {
          const chain = computeChain(userText);
          (async () => {
            while (!finished) {
              for (const key of chain) {
                if (finished) break;
                // publish in-memory events only
                publish(runId, { type: 'agent', name: key, state: 'start' });
                await sleep(850);
                publish(runId, { type: 'agent', name: key, state: 'end' });
                await sleep(120);
              }
            }
          })();
        }

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
        if (agentEventRunId) publish(agentEventRunId, { type: 'finish' });
        // mark finished
        finished = true;
        controller.close();
      } catch (err: any) {
        write({ type: 'error', errorText: err?.message ?? 'Agent error' });
        if (agentEventRunId) publish(agentEventRunId, { type: 'finish' });
        controller.close();
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
