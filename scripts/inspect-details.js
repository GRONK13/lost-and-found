const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hmrmnvejtomdvowtmklf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtcm1udmVqdG9tZHZvd3Rta2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAyNjgyOSwiZXhwIjoyMDc3NjAyODI5fQ.3YQeowjdx78v3gEObUpyrXU4DC6uniJtBo3zogKxQHw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectDetails() {
  const { data: authData } = await supabase.auth.admin.listUsers();
  console.log('Sample Auth User:', authData?.users?.[0]);

  const { data: users } = await supabase.from('users').select('*').limit(1);
  console.log('Sample Public User:', users?.[0]);

  const { data: items } = await supabase.from('items').select('*').limit(1);
  console.log('Sample Item:', items?.[0]);

  const { data: claims } = await supabase.from('claims').select('*').limit(1);
  console.log('Sample Claim:', claims?.[0]);

  const { data: messages } = await supabase.from('messages').select('*').limit(1);
  console.log('Sample Message:', messages?.[0]);
}

inspectDetails();
