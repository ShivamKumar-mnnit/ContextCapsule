import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { apiKeys, wikis } from './schema.js'
import { generateApiKey, generateApiKeyId, generateWikiId, getKeyPrefix } from '../lib/ids.js'
import { sha256 } from '../lib/hash.js'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function seed() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npm run db:seed -- user@example.com')
    process.exit(1)
  }

  const key = generateApiKey()
  const keyId = generateApiKeyId()
  const wikiId = generateWikiId()

  await db.insert(wikis).values({
    id: wikiId,
    ownerKeyId: keyId,
    title: 'My Wiki',
  })

  await db.insert(apiKeys).values({
    id: keyId,
    keyPrefix: getKeyPrefix(key),
    keyHash: sha256(key),
    ownerEmail: email,
    tier: 'free',
    wikiId,
    usageResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  console.log(`\nAPI key + wiki created for ${email}:`)
  console.log(`\n  ${key}`)
  console.log(`\n  Wiki ID: ${wikiId}\n`)
  console.log('Save this key now. It cannot be retrieved later.\n')
}

seed().catch(console.error)
