import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Missing env vars', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find all items expiring tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

  const { data: expiringItems, error } = await supabase
    .from('fridge_items')
    .select('name, household_id')
    .eq('expiry_date', tomorrowStr);

  if (error) {
    console.error('Error fetching expiring items:', error.message);
    return new Response('DB error', { status: 500 });
  }

  if (!expiringItems || expiringItems.length === 0) {
    return new Response('No expiring items today', { status: 200 });
  }

  // Group item names by household_id
  const byHousehold: Record<string, string[]> = {};
  for (const item of expiringItems) {
    if (!byHousehold[item.household_id]) byHousehold[item.household_id] = [];
    byHousehold[item.household_id].push(item.name);
  }

  // Build push messages for each household
  const messages: { to: string; title: string; body: string }[] = [];

  for (const [householdId, names] of Object.entries(byHousehold)) {
    // Get push tokens for all members of this household
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId);

    if (!members || members.length === 0) continue;

    const userIds = members.map((m: { user_id: string }) => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (!profiles || profiles.length === 0) continue;

    // Format notification body
    const MAX_NAMED = 3;
    const named = names.slice(0, MAX_NAMED).join(', ');
    const extra = names.length > MAX_NAMED ? ` and ${names.length - MAX_NAMED} more` : '';
    const body = `Heads up! ${named}${extra} expire${names.length === 1 ? 's' : ''} tomorrow.`;

    for (const profile of profiles) {
      if (!profile.push_token) continue;
      messages.push({
        to: profile.push_token,
        title: 'Leftovers',
        body,
      });
    }
  }

  if (messages.length === 0) {
    return new Response('No tokens to notify', { status: 200 });
  }

  // Send to Expo Push API
  const pushResponse = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!pushResponse.ok) {
    const text = await pushResponse.text();
    console.error('Expo push error:', text);
    return new Response('Push send failed', { status: 500 });
  }

  return new Response(`Sent ${messages.length} notification(s)`, { status: 200 });
});
