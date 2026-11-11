import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSupabase } from '@/lib/admin-supabase';
import { getFeeToCharge } from '@/lib/discount-server';

// Creates a real payment with Mollie (iDEAL) and returns the
// provider checkout page to send the customer to.
// No card or bank details ever pass through this route: Mollie
// hosts its own checkout page. The amount is always read
// from the properties table in the database, never from the browser,
// so a tampered request cannot change the fee. When the account
// discount is claimed and inside its 7 day window, the fee charged
// is the discounted fee, the same slashed price the checkout page
// shows. The booking is NOT marked paid here. Only a provider
// webhook, after confirming the payment, marks it paid.
export async function POST(request: Request) {
  try {
    const { slug, method } = (await request.json()) as { slug?: string; method?: string };
    if (!slug || method !== 'ideal') {
      return NextResponse.json({ error: 'iDEAL is the only payment method.' }, { status: 400 });
    }

    // The browser sends its Supabase session token, so this route
    // knows who is paying and can check the booking belongs to them.
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 });
    }
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    }

    const db = getAdminSupabase();
    const { data: property } = await db
      .from('properties')
      .select('slug, title, fee, available')
      .eq('slug', slug)
      .single();
    if (!property || property.available === false) {
      return NextResponse.json({ error: 'This home is not available.' }, { status: 404 });
    }
    const fee = Number(property.fee);
    if (!Number.isFinite(fee) || fee <= 0) {
      return NextResponse.json({ error: 'This home has no inspection fee set.' }, { status: 400 });
    }
    // The amount actually charged. With an active discount this is
    // the slashed fee the checkout page shows; otherwise the full fee.
    const feeToCharge = await getFeeToCharge(user.id, fee);
    const amountCents = Math.round(feeToCharge * 100);
    const origin = new URL(request.url).origin;

    if (method === 'ideal') {
      const mollieKey = process.env.MOLLIE_API_KEY;
      if (!mollieKey) {
        return NextResponse.json({ error: 'Mollie is not configured yet.' }, { status: 503 });
      }
      const res = await fetch('https://api.mollie.com/v2/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${mollieKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: { currency: 'EUR', value: feeToCharge.toFixed(2) },
          description: `HOUZQORA inspection fee - ${property.title}`,
          redirectUrl: `${origin}/bookings`,
          webhookUrl: `${origin}/api/webhooks/mollie`,
          method: 'ideal',
          metadata: { user_id: user.id, property_slug: slug },
        }),
      });
      const payment = await res.json();
      if (!res.ok || !payment?.id || !payment?._links?.checkout?.href) {
        return NextResponse.json({ error: 'Mollie could not start this payment. Please try again.' }, { status: 502 });
      }
      const { error } = await db.from('payments').insert({
        user_id: user.id,
        property_slug: slug,
        provider: 'mollie',
        method: 'ideal',
        provider_payment_id: payment.id,
        amount_cents: amountCents,
        status: 'pending',
      });
      if (error) {
        return NextResponse.json({ error: 'This payment could not be recorded. Please try again.' }, { status: 500 });
      }
      return NextResponse.json({ checkoutUrl: payment._links.checkout.href });
    }

  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
