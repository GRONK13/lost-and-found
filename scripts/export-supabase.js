const { createClient } = require('@supabase/supabase-js')
const fs = require('fs/promises')
const path = require('path')

const supabaseUrl = 'https://hmrmnvejtomdvowtmklf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtcm1udmVqdG9tZHZvd3Rta2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAyNjgyOSwiZXhwIjoyMDc3NjAyODI5fQ.3YQeowjdx78v3gEObUpyrXU4DC6uniJtBo3zogKxQHw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function exportSupabase() {
  console.log('📦 Starting full Supabase data export...')

  const backupDir = path.join(__dirname, 'backups')
  await fs.mkdir(backupDir, { recursive: true })

  // 1. Auth Users
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) console.error('Auth Users Error:', authErr)
  const authUsers = authData?.users || []

  // 2. Public Users
  const { data: publicUsers, error: pubErr } = await supabase.from('users').select('*')
  if (pubErr) console.error('Public Users Error:', pubErr)

  // 3. Items
  const { data: items, error: itemsErr } = await supabase.from('items').select('*')
  if (itemsErr) console.error('Items Error:', itemsErr)

  // 4. Claims
  const { data: claims, error: claimsErr } = await supabase.from('claims').select('*')
  if (claimsErr) console.error('Claims Error:', claimsErr)

  // 5. Messages
  const { data: messages, error: msgsErr } = await supabase.from('messages').select('*')
  if (msgsErr) console.error('Messages Error:', msgsErr)

  // 6. Flags
  const { data: flags, error: flagsErr } = await supabase.from('flags').select('*')
  if (flagsErr) console.error('Flags Error:', flagsErr)

  const payload = {
    exportedAt: new Date().toISOString(),
    counts: {
      authUsers: authUsers.length,
      publicUsers: (publicUsers || []).length,
      items: (items || []).length,
      claims: (claims || []).length,
      messages: (messages || []).length,
      flags: (flags || []).length,
    },
    authUsers,
    publicUsers: publicUsers || [],
    items: items || [],
    claims: claims || [],
    messages: messages || [],
    flags: flags || [],
  }

  const exportPath = path.join(backupDir, 'supabase-export.json')
  await fs.writeFile(exportPath, JSON.stringify(payload, null, 2))

  console.log(`✅ Supabase Export Complete! Saved to ${exportPath}`)
  console.log('Summary:', payload.counts)
}

exportSupabase().catch((err) => {
  console.error('Export failed:', err)
  process.exit(1)
})
