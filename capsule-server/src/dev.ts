import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './index.js'

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`capsule-server running at http://localhost:${info.port}`)
})
