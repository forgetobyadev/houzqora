import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local');
}

// Database reads must never serve a cached price: the detail and
// checkout pages render per request, but Next still caches the
// underlying fetch unless it is explicitly no-store. That stale
// cache is what kept showing the old prices after the database
// changed, so every read through this client skips the cache.
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  global: {
    fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
  },
});
