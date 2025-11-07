import { openai } from '@ai-sdk/openai';
import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai';
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
  chain.push('TrainerAgent', 'AnalysisAgent');
  return chain.filter((v, i, a) => a.indexOf(v) === i);
}

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model = 'gpt-4o-mini',
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

  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const userText = lastUser
    ? lastUser.parts.map(p => (p.type === 'text' ? p.text : '')).join('')
    : '';

  let finished = false;
  const runId = agentEventRunId?.trim();
  if (runId) {
    const chain = computeChain(userText);
    (async () => {
      while (!finished) {
        for (const key of chain) {
          if (finished) break;
          publish(runId, { type: 'agent', name: key, state: 'start' });
          await sleep(850);
          publish(runId, { type: 'agent', name: key, state: 'end' });
          await sleep(120);
        }
      }
    })();
  }

  const system = instructions
    ? `Agent: ${name}\n${instructions}\n${
        effort ? `Reasoning effort: ${effort} (summary: auto)` : ''
      }${workflowId ? `\nWorkflow ID: ${workflowId}` : ''}`
    : undefined;

  const result = streamText({
    model: openai(model),
    messages: convertToModelMessages(messages),
    system,
    abortSignal: (req as any).signal,
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      finished = true;
      if (runId) publish(runId, { type: 'finish' });
      if (isAborted) {
        // eslint-disable-next-line no-console
        console.log('Agent chat aborted');
      }
    },
    consumeSseStream: consumeStream,
  });
}
