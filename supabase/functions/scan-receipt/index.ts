import Anthropic from 'npm:@anthropic-ai/sdk';

const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
if (!apiKey) throw new Error('ANTHROPIC_API_KEY secret is not set');

const anthropic = new Anthropic({ apiKey });

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => null);
    const { imageBase64 } = body ?? {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
          },
          {
            type: 'text',
            text: 'This is a grocery receipt. Extract all food items purchased. Return a JSON array with objects containing: name (string), quantity (number), unit (string or ""). Return only the JSON array.',
          },
        ],
      }],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      throw new Error(`Unexpected Claude response type: ${block.type}`);
    }

    let items = [];
    try {
      items = JSON.parse(block.text.replace(/```json?|```/g, '').trim());
    } catch {
      items = [];
    }

    return new Response(JSON.stringify({ items }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
