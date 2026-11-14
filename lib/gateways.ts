// Server only. Never import this file from a client component: it reads
// gateway API keys and the Supabase service role key, which must never
// reach the browser. It is only used by the payment API routes and the
// gateway webhook routes.
//
// How the gateways plug in:
// - 1pay.cx (card) and Norpo (iDEAL) both have a REST API with signed
//   webhooks. API keys, webhook secrets and the API docs live in each
//   gateway's merchant dashboard; there are no public docs to read.
//   Set ONEPAY_API_URL / NORPO_API_URL from the dashboard docs, and the
//   keys from the dashboard, in .env.local and in Vercel. Until a
//   gateway's key and API URL are both set, its checkout option stays
//   hidden and its create route answers 503.
// - Norpo, verified from its dashboard docs on 2026-11-14:
//   base https://api.norpo.io, POST /v1/payments, Bearer key,
//   amount is decimal euros (not cents), fields amount, currency,
//   reference, redirectUrl, callbackUrl, callbackFormat "json".
//   Success is 201 with order.url as the checkout URL. iDEAL has
//   no separate toggle; local methods only surface for EUR billing
//   under Cards.
// - 1pay, verified from its dashboard docs on 2026-11-14:
//   base https://api.1pay.cx (https://1pay.cx/api is the same),
//   POST /v1/payments, Bearer secret key (form pk_<prefix>.<secret>,
//   live, or pk_test_<prefix>.<secret>, test), amount is decimal
//   euros rounded to 2 places, fields amount, currency, reference,
//   redirectUrl, notifyUrl, productName, method "card". Success is
//   201 with url as the absolute checkout URL. Send notifyUrl so
//   webhooks for that payment go to our webhook route, signed with
//   the account notifyUrl secret. Idempotency-Key is the reference.
// - The payout wallet is set once in each gateway's dashboard, not sent
//   per payment. Norpo keeps the wallet already set there, USDC on
//   Polygon. 1pay now uses the same wallet, ETH, use for every EVM
//   network, auto-forward ON. Hold: 1pay will not use it for payouts
//   until Mon 16 Nov 2026, 16:39, 48 hours after adding.
// - The reference is "userId:slug". The webhook splits it and marks
//   that booking paid. That is the only link between a gateway payment
//   and a HOUZQORA booking.

import { getAdminSupabase } from './admin-supabase';

export type Gateway = 'onepay' | 'norpo';

export function gatewayConfig(): { onepay: boolean; norpo: boolean } {
  return {
    onepay: !!process.env.ONEPAY_API_KEY && !!process.env.ONEPAY_API_URL,
    norpo: !!process.env.NORPO_API_KEY && !!process.env.NORPO_API_URL,
  };
}

function gatewayEnv(gateway: Gateway): { apiUrl: string; apiKey: string } {
  const apiUrl = gateway === 'onepay' ? process.env.ONEPAY_API_URL : process.env.NORPO_API_URL;
  const apiKey = gateway === 'onepay' ? process.env.ONEPAY_API_KEY : process.env.NORPO_API_KEY;
  if (!apiUrl || !apiKey) {
    throw new Error(`Gateway ${gateway} is not configured. Set ${gateway === 'onepay' ? 'ONEPAY_API_URL and ONEPAY_API_KEY' : 'NORPO_API_URL and NORPO_API_KEY'} from the gateway dashboard.`);
  }
  return { apiUrl, apiKey };
}

// Server side fee, same rule as the client discount: the discount is
// active only when the account claimed it and the 7 day window has
// not ended. The fee is read from the properties table by the caller,
// never from the browser, and the discount is read from the
// user_discounts table with the service role key.
export async function getFeeToCharge(userId: string, fee: number): Promise<number> {
  try {
    const admin = getAdminSupabase();
    const { data } = await admin
      .from('user_discounts')
      .select('starts_at, claimed')
      .eq('user_id', userId)
      .single();
    if (!data || !data.claimed) return fee;
    const startsAt = new Date(data.starts_at).getTime();
    if (Date.now() >= startsAt + 7 * 24 * 60 * 60 * 1000) return fee;
    return Math.round(fee * 0.7);
  } catch {
    return fee;
  }
}

// Mark a booking paid from a webhook. The service role client is
// used because a webhook carries no user session. The existing
// viewing slot is kept; only the paid flag changes. Upsert makes
// a repeated delivery harmless.
export async function markBookingPaid(userId: string, slug: string): Promise<void> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from('bookings')
    .select('viewing_slot')
    .eq('user_id', userId)
    .eq('property_slug', slug)
    .single();
  await admin.from('bookings').upsert(
    {
      user_id: userId,
      property_slug: slug,
      fee_paid: true,
      viewing_slot: data?.viewing_slot || '',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,property_slug' },
  );
}

export function splitReference(reference: string): { userId: string; slug: string } | null {
  const idx = reference.indexOf(':');
  if (idx <= 0) return null;
  const userId = reference.slice(0, idx);
  const slug = reference.slice(idx + 1);
  if (!userId || !slug) return null;
  return { userId, slug };
}

export type GatewayPayment = { checkoutUrl: string; providerRef: string };

// Create a payment with a gateway and return its hosted checkout URL.
// Amount passed in is euro cents. Both gateways take decimal euros,
// so the amount sent is amountCents / 100.
export async function createGatewayPayment(
  gateway: Gateway,
  opts: { amountCents: number; reference: string; returnUrl: string },
): Promise<GatewayPayment> {
  const { apiUrl, apiKey } = gatewayEnv(gateway);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://houzqora.vercel.app').replace(/\/$/, '');
  const body =
    gateway === 'norpo'
      ? {
          amount: opts.amountCents / 100,
          currency: 'EUR',
          reference: opts.reference,
          redirectUrl: opts.returnUrl,
          callbackUrl: `${siteUrl}/api/webhooks/norpo`,
          callbackFormat: 'json',
        }
      : {
          amount: opts.amountCents / 100,
          currency: 'EUR',
          reference: opts.reference,
          redirectUrl: opts.returnUrl,
          notifyUrl: `${siteUrl}/api/webhooks/onepay`,
          productName: 'HOUZQORA inspection fee',
          method: 'card',
        };
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (gateway === 'onepay') headers['Idempotency-Key'] = opts.reference;
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gateway ${gateway} refused the payment (${res.status}). ${text.slice(0, 200)}`);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const order = (data.order as Record<string, unknown> | undefined) || undefined;
  let checkoutUrl =
    (order && typeof order.url === 'string' && order.url) ||
    (typeof data.url === 'string' && data.url) ||
    (order && typeof order.checkoutUrl === 'string' && order.checkoutUrl) ||
    (typeof data.checkoutUrl === 'string' && data.checkoutUrl) ||
    (typeof data.checkout_url === 'string' && data.checkout_url) ||
    (typeof data.paymentUrl === 'string' && data.paymentUrl) ||
    '';
  if (checkoutUrl.startsWith('/')) checkoutUrl = `https://1pay.cx${checkoutUrl}`;
  if (!checkoutUrl) {
    throw new Error(`Gateway ${gateway} gave no checkout URL.`);
  }
  const providerRef =
    (typeof data.paymentId === 'string' && data.paymentId) ||
    (typeof data.id === 'string' && data.id) ||
    (typeof data.orderId === 'string' && data.orderId) ||
    (typeof data.reference === 'string' && data.reference) ||
    opts.reference;
  return { checkoutUrl, providerRef };
}
