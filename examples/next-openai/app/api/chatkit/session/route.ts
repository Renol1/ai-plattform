export const maxDuration = 30;

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  const workflowId = process.env.OPENAI_CHATKIT_WORKFLOW_ID;
  if (!apiKey || !workflowId) {
    return new Response(
      JSON.stringify({ error: 'Missing OPENAI_API_KEY or OPENAI_CHATKIT_WORKFLOW_ID' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const userId = `device_${Math.random().toString(36).slice(2)}`;

  const res = await fetch('https://api.openai.com/v1/chatkit/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'chatkit_beta=v1',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      workflow: { id: workflowId },
      user: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  }

  const json = await res.json();
  return new Response(JSON.stringify({ client_secret: json.client_secret }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
