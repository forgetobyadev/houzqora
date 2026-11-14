import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { markBookingPaid, splitReference } from '@/lib/gateways';

// 1pay.cx webhook, verified from the 1pay docs on 2026-11-14.
// We send notifyUrl on every create call, so deliveries for our
// payments come to this route signed with the account notifyUrl
// secret (ONEPAY_WEBHOOK_SECRET, whsec_ live / whsec_test_ test).
// Signature header: X-1pay-Signature-V2, sent as t=<unix seconds>,
// v1=<hex HMAC-SHA256 over "<t>.<raw body>">, 5 minute tolerance,
// several v1 values for 24h after a secret roll. Legacy header
// X-1pay-Signature is HMAC-SHA256 of the raw body alone.
// Event name travels in the X-1pay-Event header. The body is an
// envelope { id, event, data: { paymentId, reference, status } }.
// Only payment.paid marks the booking paid. A repeated delivery
// is harmless because marking paid is an upsert.
function hmacHex(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

function matches(expected: string, got: string): boolean {
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function signatureMatches(raw: string, v2: string, legacy: string, secret: string): boolean {
  if (v2) {
    const parts: Record<string, string[]> = {};
    for (const p of v2.split(',')) {
      const i = p.indexOf('=');
      if (i <= 0) continue;
      const k = p.slice(0, i).trim();
      const v = p.slice(i + 1).trim();
      (parts[k] = parts[k] || []).push(v);
    }
    const t = (parts['t'] || [])[0];
    const v1s = parts['v1'] || [];
    if (t && v1s.length) {
      const secs = Number(t);
      if (Number.isFinite(secs) && Math.abs(Date.now() / 1000 - secs) <= 300) {
        const expected = hmacHex(`${t}.${raw}`, secret);
        if (v1s.some((v1) => matches(expected, v1))) return true;
      }
    }
  }
  if (legacy) return matches(hmacHex(raw, secret), legacy);
  return false;
}

export async function POST(req: Request) {
  const secret = process.env.ONEPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not set up.' }, { status: 503 });
  const raw = await req.text();
  const v2 = req.headers.get('x-1pay-signature-v2') || '';
  const legacy = req.headers.get('x-1pay-signature') || '';
  if (!signatureMatches(raw, v2, legacy, secret)) {
    return NextResponse.json({ error: 'Bad signature.' }, { status: 401 });
  }
  let envelope: Record<string, unknown>;
  try {
    envelope = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Bad payload.' }, { status: 400 });
  }
  const data = (envelope.data as Record<string, unknown> | undefined) || envelope;
  const event = (
    req.headers.get('x-1pay-event') ||
    (typeof envelope.event === 'string' ? envelope.event : '') ||
    (typeof envelope.type === 'string' ? envelope.type : '') ||
    ''
  ).toLowerCase();
  if (event !== 'payment.paid') return NextResponse.json({ ok: true });
  const reference =
    (typeof data.reference === 'string' && data.reference) ||
    (typeof envelope.reference === 'string' && envelope.reference) ||
    '';
  const ref = splitReference(reference);
  if (!ref) return NextResponse.json({ error: 'Bad reference.' }, { status: 400 });
  try {
    await markBookingPaid(ref.userId, ref.slug);
  } catch {
    return NextResponse.json({ error: 'Could not save the payment.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
