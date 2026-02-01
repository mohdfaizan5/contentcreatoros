import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    "https://coaodjmfekgwiuovmugy.supabase.co",
    "sb_publishable_lap4G65eqN1AxSo1TdQYHw_1Q6r3QTy"
  )
}

// export function createClient() {
//   return createBrowserClient(
//     process.env.PUBLIC_SUPABASE_URL!,
//     process.env.PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
//   )
// }
