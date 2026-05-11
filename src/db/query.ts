import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const keys = await sql`SELECT id, key_prefix, owner_email, tier, usage_count FROM api_keys`
  console.log('=== API KEYS ===')
  for (const k of keys) {
    console.log(`  ${k.key_prefix}...  ${k.owner_email}  tier=${k.tier}  usage=${k.usage_count}`)
  }

  const caps = await sql`SELECT id, summary, created_at, expires_at FROM capsules ORDER BY created_at DESC`
  console.log(`\n=== CAPSULES (${caps.length}) ===`)
  for (const c of caps) {
    console.log(`  ${c.id}  "${c.summary}"`)
    console.log(`    created: ${c.created_at}  expires: ${c.expires_at}`)
  }
}

main().catch(console.error)
