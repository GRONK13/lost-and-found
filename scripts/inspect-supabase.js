const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hmrmnvejtomdvowtmklf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtcm1udmVqdG9tZHZvd3Rta2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAyNjgyOSwiZXhwIjoyMDc3NjAyODI5fQ.3YQeowjdx78v3gEObUpyrXU4DC6uniJtBo3zogKxQHw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  console.log('--- Inspecting Supabase Data ---');

  // 1. Auth Users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  console.log(`Auth Users Count: ${authData?.users?.length || 0}`);
  if (authError) console.error('Auth error:', authError);

  // 2. Public Users
  const { data: users, error: usersError } = await supabase.from('users').select('*');
  console.log(`Public Users Count: ${users?.length || 0}`);
  if (usersError) console.error('Users error:', usersError);

  // 3. Items
  const { data: items, error: itemsError } = await supabase.from('items').select('*');
  console.log(`Items Count: ${items?.length || 0}`);
  if (itemsError) console.error('Items error:', itemsError);

  // 4. Claims
  const { data: claims, error: claimsError } = await supabase.from('claims').select('*');
  console.log(`Claims Count: ${claims?.length || 0}`);
  if (claimsError) console.error('Claims error:', claimsError);

  // 5. Messages
  const { data: messages, error: messagesError } = await supabase.from('messages').select('*');
  console.log(`Messages Count: ${messages?.length || 0}`);
  if (messagesError) console.error('Messages error:', messagesError);

  // 6. Flags
  const { data: flags, error: flagsError } = await supabase.from('flags').select('*');
  console.log(`Flags Count: ${flags?.length || 0}`);
  if (flagsError) console.error('Flags error:', flagsError);
}

inspect();
