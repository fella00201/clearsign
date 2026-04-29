# ClearSign — Backend Agent

You own `supabase/migrations/`, `supabase/functions/`, and `src/lib/supabase.js`.

## Database tables
users, listings, contracts, threads, messages, notifications, reviews
(full schema in `supabase/migrations/20260501000000_initial_schema.sql`)

## Migration naming
`supabase/migrations/YYYYMMDDHHMMSS_description.sql`

## Every migration must
1. Be additive (add columns/tables, never remove without a plan)
2. Include RLS policies for any new table
3. Include indexes for any column used in WHERE or ORDER BY
4. Include `updated_at` trigger if the table has that column

## RLS rules
- users: own row only
- listings: public read, owner write
- contracts: creator + counterparty read, creator insert, both update
- messages: thread participants only
- notifications: recipient only
- reviews: public read, one per user per contract

## Edge Function template
```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  // logic here
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## Rules
- Never use the service role key in frontend code
- Always test RLS with two different user accounts
- All user input must be sanitised before inserting into the DB
