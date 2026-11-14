import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSupabase } from '@/lib/admin-supabase';
import {
  createGatewayPayment,
  gatewayConfig,
  getFeeToCharge,
  type Gateway,
} from '@/lib/gateways';

// Create a gateway payment and return its hosted checkout URL.
// The client sends the property slug and the gateway only; the fee
// is read from the properties table and the discount is applied
// server side, so the browser can never set the price. The booking
// is marked paid by the gateway webhook, never here and never by
// the browser returning from checkout.
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Log in first.' }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Payments are not set up yet.' }, { status: 503 });
  }
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Log in first.' }, { status: 401 });
  }

  let body: { slug?: unknown; gateway?: unknown };
  try {
    body = (await req.json()) as { slug?: unknown; gateway?: unknown };
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  const slug = typeof body.slug === 'string' ? body.slug : '';
  const gateway = body.gateway as Gateway | undefined;
  if (!slug || (gateway !== 'onepay' && gateway !== 'norpo')) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  const config = gatewayConfig();
  if (!config[gateway]) {
    return NextResponse.json(
      { error: gateway === 'onepay' ? 'Card payments are not set up yet.' : 'iDEAL payments are not set up yet.' },
      { status: 503 },
    );
  }

  try {
    const admin = getAdminSupabase();
    const { data: property, error } = await admin
      .from('properties')
      .select('slug, fee')
      .eq('slug', slug)
      .single();
    if (error || !property) {
      return NextResponse.json({ error: 'House not found.' }, { status: 404 });
    }
    const fee = await getFeeToCharge(user.id, property.fee as number);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://houzqora.vercel.app').replace(/\/$/, '');
    const payment = await createGatewayPayment(gateway, {
      amountCents: fee * 100,
      reference: `${user.id}:${slug}`,
      returnUrl: `${siteUrl}/bookings`,
      email: user.email || undefined,
    });
    return NextResponse.json({ url: payment.checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment could not be started.';
    const status = message.includes('not configured') || message.includes('not set up') ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
