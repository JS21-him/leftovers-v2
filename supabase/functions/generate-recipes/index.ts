import Anthropic from 'npm:@anthropic-ai/sdk';

const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
if (!apiKey) throw new Error('ANTHROPIC_API_KEY secret is not set');

const anthropic = new Anthropic({ apiKey });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const { fridgeItems, preferences } = body ?? {};

    if (!Array.isArray(fridgeItems) || fridgeItems.length === 0) {
      return new Response(JSON.stringify({ error: 'fridgeItems array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prefStr = Array.isArray(preferences) && preferences.length > 0
      ? `Dietary preferences: ${preferences.join(', ')}.`
      : '';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `I have these items in my fridge: ${fridgeItems.join(', ')}. ${prefStr}
Suggest 10 recipes I can make, prioritizing items that should be used soon.
Return a JSON array of recipe objects with these fields:
- title: string
- emoji: string (one emoji representing the dish)
- ingredients: array of { name: string, have: boolean } (have=true if in my fridge list)
- instructions: string[] (step by step, each step a complete sentence)
- cook_time_minutes: number
- difficulty: "Easy" | "Medium" | "Hard"
Return only the JSON array, nothing else.`,
      }],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      throw new Error(`Unexpected Claude response type: ${block.type}`);
    }

    let recipes = [];
    try {
      recipes = JSON.parse(block.text.replace(/```json?|```/g, '').trim());
    } catch {
      throw new Error('Claude returned malformed JSON');
    }

    return new Response(JSON.stringify({ recipes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
