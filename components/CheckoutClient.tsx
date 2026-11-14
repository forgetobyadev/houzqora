'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eur, type Property } from '@/lib/properties';
import { fetchBookings, getCurrentUser, setPendingPath, upsertBooking, type AppUser } from '@/lib/queries';
import { discountedFee, fetchDiscountState, isDiscountActive } from '@/lib/discount';
import { supabase } from '@/lib/supabase';
import InspectionFee from '@/components/InspectionFee';
import AgentLink from '@/components/AgentLink';
import Spinner from '@/components/Spinner';

const SLOTS = ['Thu 10:00', 'Fri 14:30', 'Sat 11:00'];

type Receipt = {
  ref: string;
  intent: 'buy' | 'rent';
  slot: string;
  whatsapp: boolean;
  call: boolean;
  name: string;
  email: string;
  phone: string;
  fee: number;
};

// Three ways to pay for the inspection fee:
// 1. Pay by card through 1pay.cx, which settles the fee in crypto to
//    HOUZQORA's wallet. 2. Pay by iDEAL through Norpo, same settlement.
// 3. Authority to pay, offline: the visitor fills a form (buy or
//    rent, viewing slot, how the agent should reach them), generates
//    an authority to pay PDF with the house details, downloads it to
//    their phone, and sends it to an agent on WhatsApp. The card and
//    iDEAL options only show when their gateway is configured in the
//    server env vars; the authority to pay option always shows. A
//    card or iDEAL booking is marked paid by the gateway webhook,
//    never by the browser returning from checkout. The authority to
//    pay flow never marks a booking paid.
export default function CheckoutClient({ p }: { p: Property }) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [booking, setBooking] = useState({ paid: false, slot: '' });
  const [showForm, setShowForm] = useState(false);
  const [intent, setIntent] = useState<'buy' | 'rent' | ''>('');
  const [slot, setSlot] = useState('');
  const [whatsapp, setWhatsapp] = useState(false);
  const [call, setCall] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [feeToSave, setFeeToSave] = useState(p.fee);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [payConfig, setPayConfig] = useState({ onepay: false, norpo: false });
  const [payBusy, setPayBusy] = useState<'onepay' | 'norpo' | null>(null);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    fetch('/api/payments/config')
      .then((r) => r.json())
      .then((c) => setPayConfig({ onepay: !!c.onepay, norpo: !!c.norpo }))
      .catch(() => {});
    (async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (u) {
        setName(u.name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        const bookings = await fetchBookings(u.id);
        const current = bookings[p.slug] || { paid: false, slot: '' };
        setBooking(current);
        await upsertBooking(u.id, p.slug, current);
        const state = await fetchDiscountState(u.id);
        if (isDiscountActive(state, Date.now())) setFeeToSave(discountedFee(p.fee));
      }
      setChecked(true);
    })();
  }, [p.slug, p.fee]);

  if (!checked) return <p className="mt-6 flex items-center gap-2"><Spinner />Loading checkout...</p>;

  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-xl font-extrabold text-velvet">Please log in first</h2>
        <p className="mt-2 text-muted">Checkout needs a signed in account.</p>
        <button onClick={() => { setPendingPath(`/checkout/${p.slug}`); router.push('/login'); }} className="btn-press mt-4 inline-block rounded-full bg-velvet px-5 py-3 font-bold text-white">Log in</button>
      </div>
    );
  }

  const makeRef = () => {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `HQ-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  };

  const buildPdf = async (r: Receipt) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(94, 18, 32);
    doc.text('HOUZQORA', 20, y);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    y += 10;
    doc.text('Authority to pay', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y += 10;
    doc.text(`Reference: ${r.ref}`, 20, y);
    y += 7;
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, y);
    y += 7;
    doc.setDrawColor(94, 18, 32);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('House', 20, y);
    doc.setFont('helvetica', 'normal');
    [
      p.title,
      `${p.city} - ${p.neighbourhood}`,
      `${p.type} - ${p.bedrooms} bedrooms, ${p.bathrooms} bathrooms, ${p.sizeM2} m2`,
      `Monthly rent: ${eur(p.rent)}`,
      `Amount to secure: ${eur(p.securing)}`,
    ].forEach((line) => { y += 7; doc.text(line, 20, y); });
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Your choice', 20, y);
    doc.setFont('helvetica', 'normal');
    [
      r.intent === 'buy' ? 'Buy this house' : 'Rent this house',
      r.slot ? `Viewing slot: ${r.slot}` : 'Viewing slot: No preference',
      `Contact: ${[r.whatsapp ? 'WhatsApp' : '', r.call ? 'Call' : ''].filter(Boolean).join(', ') || 'No preference'}`,
    ].forEach((line) => { y += 7; doc.text(line, 20, y); });
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Inspection fee: ${eur(r.fee)}`, 20, y);
    doc.setFont('helvetica', 'normal');
    y += 7;
    doc.text('The inspection fee is the same whether you buy or rent.', 20, y);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Your details', 20, y);
    doc.setFont('helvetica', 'normal');
    [
      `Name: ${r.name}`,
      `Email: ${r.email}`,
      `Phone: ${r.phone || '-'}`,
    ].forEach((line) => { y += 7; doc.text(line, 20, y); });
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text('Send this authority to pay to your agent on WhatsApp.', 20, y);
    doc.save(`HOUZQORA-authority-to-pay-${r.ref}.pdf`);
  };

  const generate = async () => {
    setError('');
    if (!intent) { setError('Choose buy or rent.'); return; }
    if (!name.trim()) { setError('Add your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Add a valid email.'); return; }
    if (!user) return;
    setBusy(true);
    try {
      const r: Receipt = {
        ref: makeRef(),
        intent,
        slot,
        whatsapp,
        call,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        fee: feeToSave,
      };
      await buildPdf(r);
      if (slot) {
        await upsertBooking(user.id, p.slug, { paid: booking.paid, slot });
        setBooking((b) => ({ ...b, slot }));
      }
      setReceipt(r);
    } catch {
      setError('The authority to pay could not be generated. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const payWith = async (gateway: 'onepay' | 'norpo') => {
    setPayError('');
    setPayBusy(gateway);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setPayError('Log in first.'); return; }
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ slug: p.slug, gateway }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) { setPayError(data.error || 'Payment could not be started.'); return; }
      window.location.href = data.url;
    } catch {
      setPayError('Payment could not be started.');
    } finally {
      setPayBusy(null);
    }
  };

  const input = "mt-1 block w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none";
  const label = "block text-xs font-extrabold text-velvet";
  const option = (selected: boolean) =>
    `btn-press rounded-full px-4 py-2.5 text-sm font-bold ${selected ? 'bg-velvet text-white' : 'border border-line bg-white text-velvet'}`;

  // Authority to pay generated: show the instruction and the button to the
  // agents page. The agents page builds the WhatsApp draft from
  // the authority to pay, so the agent hears buy or rent plus the
  // reference.
  if (receipt) {
    const agentsHref = `/agents?title=${encodeURIComponent(p.title)}&city=${encodeURIComponent(p.city)}&intent=${receipt.intent}&ref=${encodeURIComponent(receipt.ref)}`;
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-xl font-extrabold text-velvet">Your authority to pay is downloaded.</h2>
        <p className="mt-2 text-sm text-muted">Send the authority to pay to your agent on WhatsApp. Open the chat, attach the file, and send it.</p>
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex justify-between"><span>Authority to pay</span><b>{receipt.ref}</b></p>
          <p className="flex justify-between"><span>House</span><b>{p.title}</b></p>
          <p className="flex justify-between"><span>You want to</span><b>{receipt.intent === 'buy' ? 'Buy' : 'Rent'}</b></p>
          <p className="flex justify-between"><span>Inspection fee</span><b>{eur(receipt.fee)}</b></p>
        </div>
        <AgentLink href={agentsHref} className="btn-press mt-5 flex w-full items-center justify-center rounded-full bg-velvet px-5 py-3 font-bold text-white">
          Go to agents
        </AgentLink>
        <button onClick={() => { void buildPdf(receipt); }} className="btn-press mt-3 flex w-full items-center justify-center rounded-full border border-line bg-white px-5 py-3 font-bold text-velvet">
          Download authority to pay again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="mt-4 space-y-2 text-sm">
        <p className="flex justify-between"><span>Monthly rent</span><b>{eur(p.rent)}</b></p>
        <p className="flex justify-between"><span>Inspection fee, non-refundable</span><b><InspectionFee fee={p.fee} /></b></p>
        <p className="flex justify-between"><span>Remaining to secure, first month plus deposit</span><b>{eur(p.securing)}</b></p>
      </div>
      <p className="mt-4 text-sm text-muted">Confirming the inspection does not reserve this home. It covers arranging and conducting your viewing.</p>

      {!showForm ? (
        <div className="mt-4 space-y-3">
          <p className={label}>How do you want to pay?</p>
          {payConfig.onepay && (
            <button onClick={() => payWith('onepay')} disabled={payBusy !== null} className="btn-press flex w-full items-center justify-center gap-2 rounded-full bg-velvet px-5 py-3 font-bold text-white disabled:opacity-60">
              {payBusy === 'onepay' && <Spinner />}
              {payBusy === 'onepay' ? 'Starting card payment...' : 'Pay by card'}
            </button>
          )}
          {payConfig.norpo && (
            <button onClick={() => payWith('norpo')} disabled={payBusy !== null} className="btn-press flex w-full items-center justify-center gap-2 rounded-full bg-velvet px-5 py-3 font-bold text-white disabled:opacity-60">
              {payBusy === 'norpo' && <Spinner />}
              {payBusy === 'norpo' ? 'Starting iDEAL payment...' : 'Pay by iDEAL'}
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="btn-press flex w-full items-center justify-center rounded-full bg-strawberry px-5 py-3 font-bold text-white">
            Fill form
          </button>
          {payError && <p className="text-sm font-bold text-strawberry">{payError}</p>}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <p className={label}>Buy or rent</p>
            <div className="mt-2 flex gap-3">
              <button type="button" onClick={() => setIntent('buy')} className={`${option(intent === 'buy')} flex-1`}>Buy</button>
              <button type="button" onClick={() => setIntent('rent')} className={`${option(intent === 'rent')} flex-1`}>Rent</button>
            </div>
          </div>
          <div>
            <p className={label}>Viewing slot</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {SLOTS.map((s) => (
                <button key={s} type="button" onClick={() => setSlot(slot === s ? '' : s)} className={option(slot === s)}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <p className={label}>How should the agent reach you?</p>
            <label className="mt-2 flex items-center gap-2 text-sm font-bold text-velvet">
              <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="h-5 w-5" /> WhatsApp
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm font-bold text-velvet">
              <input type="checkbox" checked={call} onChange={(e) => setCall(e.target.checked)} className="h-5 w-5" /> Call
            </label>
          </div>
          <div className="space-y-4">
            <label className={label}>Full name
              <input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} className={input} />
            </label>
            <label className={label}>Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} className={input} />
            </label>
            <label className={label}>Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} className={input} />
            </label>
          </div>
          {error && <p className="text-sm font-bold text-strawberry">{error}</p>}
          <button onClick={generate} disabled={busy} className="btn-press flex w-full items-center justify-center gap-2 rounded-full bg-strawberry px-5 py-3 font-bold text-white disabled:opacity-60">
            {busy && <Spinner />}
            {busy ? 'Generating authority to pay...' : 'Generate authority to pay'}
          </button>
        </div>
      )}
    </div>
  );
}
