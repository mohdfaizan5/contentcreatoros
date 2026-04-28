import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.PUBLIC_SUPABASE_URL ||
    'https://coaodjmfekgwiuovmugy.supabase.co'

  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    process.env.PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    'sb_publishable_lap4G65eqN1AxSo1TdQYHw_1Q6r3QTy'

  return createBrowserClient(
    supabaseUrl,
    supabasePublishableKey,
  )
}

// export function createClient() {
//   return createBrowserClient(
//     process.env.PUBLIC_SUPABASE_URL!,
//     process.env.PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
//   )
// }
