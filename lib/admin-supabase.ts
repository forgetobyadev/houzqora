import { createClient } from '@supabase/supabase-js';

// Server only. This file must never be imported by a client component,
// because the service role key bypasses row level security and must
// never reach the browser. It is only used by server actions: in
// lib/admin-actions.ts, after the admin login has been checked, and in
// lib/reset-password.ts, only to check if an email has an account
// and to send that account a reset link.
export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Service role key is not set. Fill in SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart the app.');
  }
  // Same rule as the public client: database reads must never serve
  // a cached price, so every read through this client skips the
  // cache. That matters for the payment route too, which reads the
  // fee from the table at the moment of the click.
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
    },
  });
}
