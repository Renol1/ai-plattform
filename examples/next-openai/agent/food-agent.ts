/**
 * food-agent.ts
 *
 * Server-side helper that queries our `/api/foods` route (which proxies SLV)
 * and then asks OpenAI to produce a short Swedish summary of the nutrition
 * (energy, protein, fat, carbohydrates) for the top match.
 *
 * Notes / assumptions:
 * - The code expects `process.env.NEXT_PUBLIC_BASE_URL` to be set to the
 *   deployed app origin (e.g. https://your-app.vercel.app). If missing, it
 *   falls back to http://localhost:3000.
 * - OPENAI_API_KEY must be present in the environment for the OpenAI call.
 */

export async function foodAgent(question: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    // 1) Query our internal API which proxies SLV
    const foodRes = await fetch(new URL('/api/foods', baseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question }),
    });

    if (!foodRes.ok) {
      const body = await foodRes.text();
      return `Kunde inte hämta livsmedelsdata: ${foodRes.status} — ${body}`;
    }

    const foodData = await foodRes.json();

    // 2) Try to locate a reasonable first item in the returned payload.
    // The SLV response shape can vary; try a few common places.
    const firstItem =
      (foodData && (foodData.results || foodData.items || foodData.data || foodData.searchResults))?.[0] ||
      (Array.isArray(foodData) && foodData[0]) ||
      undefined;

    if (!firstItem) {
      return 'Jag hittade tyvärr inget livsmedel som matchar det du skrev.';
    }

    // 3) Prepare a prompt for OpenAI to summarise the nutrition in Swedish.
    const system = `Du är en hjälpsam nutritionsexpert. Svara kort och tydligt på svenska. ` +
      `Fokusera på energi (kcal eller kJ per 100 g), protein (g/100 g), fett (g/100 g) och kolhydrater (g/100 g).`;

    const user = `Här är rådata från Livsmedelsverkets API för en träff (${firstItem.name || firstItem.food || firstItem.title || 'okänt'}). ` +
      `Ge en kort sammanfattning (1-2 meningar) på svenska om energi, protein, fett och kolhydrater per 100 g. Rådfråga endast följande data: ${JSON.stringify(firstItem)} ` +
      `Om något fält saknas, ange det du kan och låt övrigt vara öppet.`;

    // 4) Call OpenAI Chat Completions REST API directly (simple, predictable)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      // As a fallback, attempt to craft a lightweight summary from available numeric fields
      const fallback = tryLocalSummary(firstItem);
      return fallback || 'Jag hittade data men OpenAI-nyckel saknas för att formatera svaret.';
    }

    const completionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 250,
        temperature: 0.2,
      }),
    });

    if (!completionRes.ok) {
      const body = await completionRes.text();
      return `OpenAI error: ${completionRes.status} — ${body}`;
    }

    const completionJson = await completionRes.json();
    const content =
      completionJson?.choices?.[0]?.message?.content || completionJson?.choices?.[0]?.text || null;

    if (!content) {
      // Final fallback: attempt a local summary again
      const fallback = tryLocalSummary(firstItem);
      return fallback || 'Kunde inte generera ett svar från OpenAI.';
    }

    return content.trim();
  } catch (err) {
    const msg = (err && typeof err === 'object' && 'message' in err)
      ? (err as any).message
      : String(err);
    return `Ett fel uppstod: ${msg}`;
  }
}

function tryLocalSummary(item: any): string | null {
  // Try to extract common nutritional fields from the item.
  // SLV names may vary; try many possibilities.
  const name = item.name || item.food || item.title || 'Livsmedel';
  const kcal =
    item.energy_kcal || item.kcal || item['Energi (kcal)'] || item['energi'] || item.energy;
  const protein = item.protein_g || item.protein || item['Protein (g)'] || item.protein_content;
  const fat = item.fat_g || item.fett || item['Fett (g)'] || item.fat;
  const carbs = item.carbs_g || item.carbohydrates || item['Kolhydrater (g)'] || item.carbs;

  const parts: string[] = [];
  if (kcal) parts.push(`energi cirka ${kcal} kcal/100 g`);
  if (protein) parts.push(`protein cirka ${protein} g/100 g`);
  if (fat) parts.push(`fett cirka ${fat} g/100 g`);
  if (carbs) parts.push(`kolhydrater cirka ${carbs} g/100 g`);

  if (parts.length === 0) return null;

  return `${name} innehåller ${parts.join(', ')}.`;
}
