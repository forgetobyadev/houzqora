import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { markBookingPaid, splitReference } from '@/lib/gateways';

// Norpo webhook, verified from the Norpo dashboard docs on 2026-11-14.
// Signature header: Norpo-Signature, sent as t=<timestamp>,v1=<hex>.
// v1 is HMAC SHA256 of "<timestamp>.<raw body>" using the endpoint
// secret. Event name travels in the Norpo-Event header, for example
// payment.settled. Paid events are payment.settled, payment.paid
// and order.paid. Only a paid settlement marks the booking paid.
// A repeated delivery is harmless because marking paid is an upsert.
function signatureMatches(raw: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return i > 0 ? [p.slice(0, i).trim(), p.slice(i + 1).trim()] : [p.trim(), ''];
    }),
  );
  const t = parts['t'];
  const v1 = parts['v1'];
  if (!t || !v1) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.NORPO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not set up.' }, { status: 503 });
  const raw = await req.text();
  const signature = req.headers.get('norpo-signature') || '';
  if (!signature || !signatureMatches(raw, signature, secret)) {
    return NextResponse.json({ error: 'Bad signature.' }, { status: 401 });
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Bad payload.' }, { status: 400 });
  }
  const reference =
    (typeof data.reference === 'string' && data.reference) ||
    (typeof data.clientReference === 'string' && data.clientReference) ||
    (typeof data.orderId === 'string' && data.orderId) ||
    '';
  const status = typeof data.status === 'string' ? data.status.toLowerCase() : '';
  const event = (req.headers.get('norpo-event') || (typeof data.event === 'string' ? data.event : '') || '').toLowerCase();
  const type = typeof data.type === 'string' ? data.type.toLowerCase() : '';
  const paid =
    ['payment.settled', 'payment.paid', 'order.paid'].includes(event) ||
    ['paid', 'settled'].includes(status) ||
    event.includes('paid') ||
    event.includes('settled') ||
    type.includes('paid') ||
    type.includes('settled');
  if (!paid) return NextResponse.json({ ok: true });
  const ref = splitReference(reference);
  if (!ref) return NextResponse.json({ error: 'Bad reference.' }, { status: 400 });
  try {
    await markBookingPaid(ref.userId, ref.slug);
  } catch {
    return NextResponse.json({ error: 'Could not save the payment.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
