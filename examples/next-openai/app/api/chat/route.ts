import { openai } from '@ai-sdk/openai';
import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model: modelName,
    instructions,
    effort,
    workflowId,
  }: {
    messages: UIMessage[];
    model?: string;
    instructions?: string;
    effort?: 'low' | 'medium' | 'high';
    workflowId?: string;
  } = await req.json();

  const prompt = convertToModelMessages(messages);

  const system = instructions
    ? `Agent instructions:\n${instructions}\n\n${
        effort ? `Reasoning effort: ${effort} (summary: auto)` : ''
      }${workflowId ? `\nWorkflow ID: ${workflowId}` : ''}`
    : undefined;

  const result = streamText({
    model: openai(modelName ?? 'gpt-5'),
    system,
    prompt,
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log('Aborted');
      }
    },
    consumeSseStream: consumeStream, // needed for correct abort handling
  });
}
