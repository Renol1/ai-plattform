# Next OpenAI – ChatKit på Vercel

Den här appen visar hur ChatKit från OpenAI kan köras i Next.js (App Router) och hur klienten hämtar en client_secret från en egen API‑rout.

## Översikt
- API‑rout: POST `/api/chatkit/session` returnerar `{ client_secret }` (200) eller fel.
- Klient: `<ChatKit />` mountas i
	- `app/page.tsx` (inbäddad via knappen “Visa ChatKit”)
	- `app/chatkit/page.tsx` (dedikerad sida)
- SDK‑script: laddas i `components/chatkit-script-loader.tsx` och loggar när det är redo.
- Fel: visas med toasts och fångas av `ErrorBoundary` så UI inte bara försvinner.

## Förutsättningar
1) OpenAI‑konto med aktiv billing.
2) Skapa ett ChatKit Workflow i OpenAI Platform och kopiera dess ID (format `wf_...`).
3) Din OpenAI API‑nyckel (`sk-...`).

## Deploy på Vercel (rekommenderat)
1) Importera GitHub‑repon i Vercel.
2) Project Settings → Root Directory: `examples/next-openai`.
3) Environment Variables (lägg i både Preview och Production):
	 - `OPENAI_API_KEY` = din OpenAI‑nyckel
	 - `OPENAI_CHATKIT_WORKFLOW_ID` = ditt ChatKit workflow‑id (t.ex. `wf_abc123`)
4) Spara och deploya (env‑ändringar kräver redeploy).

### Verifiera backend
Kör ett POST anrop (måste vara POST):

```
curl -i -X POST https://<din-app>.vercel.app/api/chatkit/session
```

Förväntat: `HTTP/200` och JSON `{ "client_secret": "..." }`.

Vanliga svar:
- `500` med `Missing OPENAI_API_KEY or OPENAI_CHATKIT_WORKFLOW_ID` → lägg in env korrekt + redeploy.
- `401/400/404` från OpenAI → kontrollera API‑nyckel och Workflow‑ID.

## Hur klienten hämtar client_secret
- Fil: `app/page.tsx` och `app/chatkit/page.tsx` använder `useChatKit({ api: { getClientSecret } })`.
- Implementationen gör `POST /api/chatkit/session` och förväntar `{ client_secret }`.
- Vid lyckat svar visas en grön toast “ChatKit redo”. Vid fel visas röd toast med status + feltext.

## ChatKit SDK‑script
- Fil: `components/chatkit-script-loader.tsx` (client component) laddar SDK:
	- URL: `https://cdn.platform.openai.com/deployments/chatkit/chatkit.js`
	- Loggar i Console: `[ChatKit] SDK script loaded` när scriptet är redo.
- Importeras i `app/layout.tsx` och körs globalt.

## Felsökning
- Inget händer / blinkar och försvinner:
	1) Öppna DevTools → Network: se att `chatkit.js` laddas och att `POST /api/chatkit/session` ger 200 + `{ client_secret }`.
	2) DevTools → Console: leta efter
		 - `[ChatKit] SDK script loaded ...`
		 - `[ChatKit] client_secret received`
		 - eventuella fel från ChatKit eller från ErrorBoundary.
	3) Appen visar toasts vid fel – kopiera statuskod + body för snabb diagnos.
- 404/405 på `/api/chatkit/session` → fel Root Directory (måste vara `examples/next-openai`) eller du använde GET istället för POST.
- CORS/CSP/Adblock → prova inkognito utan extensions.

## Var koden finns
- API‑rout (server):
	- `app/api/chatkit/session/route.ts`
- Klientkomponenter:
	- `app/page.tsx` (inbäddad ChatKit via knapp)
	- `app/chatkit/page.tsx` (dedikerad vy)
	- `components/chatkit-script-loader.tsx` (laddar SDK)
	- `components/error-boundary.tsx` (fångar renderfel)
	- `components/toast-host.tsx` och `lib/toast.ts` (notiser)

## Snabbt testflöde efter deploy
1) Kör curl‑kommandot ovan – verifiera `{ client_secret }`.
2) Öppna appen → klicka “Visa ChatKit” eller gå till `/chatkit`.
3) Vid lyckad init: grön toast “ChatKit redo”.
4) Vid problem: röd toast med status/body + fel i Console.

Lycka till! Om något fortfarande strular, kopiera gärna felmeddelanden (statuskod, body, Console‑utdrag) så är det lätt att peka ut exakt orsak.
# AI SDK, Next.js, and OpenAI Chat Example

This example shows how to use the [AI SDK](https://ai-sdk.dev/docs) with [Next.js](https://nextjs.org/) and [OpenAI](https://openai.com) to create a ChatGPT-like AI-powered streaming chat bot.

## Deploy your own

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=ai-sdk-example):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai%2Ftree%2Fmain%2Fexamples%2Fnext-openai&env=OPENAI_API_KEY&project-name=ai-sdk-next-openai&repository-name=ai-sdk-next-openai)

## How to use

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init), [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/), or [pnpm](https://pnpm.io) to bootstrap the example:

```bash
npx create-next-app --example https://github.com/vercel/ai/tree/main/examples/next-openai next-openai-app
```

```bash
yarn create next-app --example https://github.com/vercel/ai/tree/main/examples/next-openai next-openai-app
```

```bash
pnpm create next-app --example https://github.com/vercel/ai/tree/main/examples/next-openai next-openai-app
```

To run the example locally you need to:

1. Sign up at [OpenAI's Developer Platform](https://platform.openai.com/signup).
2. Go to [OpenAI's dashboard](https://platform.openai.com/account/api-keys) and create an API KEY.
3. If you choose to use external files for attachments, then create a [Vercel Blob Store](https://vercel.com/docs/storage/vercel-blob).
4. Set the required environment variable as the token value as shown [the example env file](./.env.local.example) but in a new file called `.env.local`
5. `pnpm install` to install the required dependencies.
6. `pnpm dev` to launch the development server.

## Learn More

To learn more about OpenAI, Next.js, and the AI SDK take a look at the following resources:

- [AI SDK docs](https://ai-sdk.dev/docs)
- [Vercel AI Playground](https://ai-sdk.dev/playground)
- [OpenAI Documentation](https://platform.openai.com/docs) - learn about OpenAI features and API.
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
