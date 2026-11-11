'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eur, type Property } from '@/lib/properties';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, setPendingPath, type AppUser } from '@/lib/queries';
import { discountedFee, fetchDiscountState, isDiscountActive } from '@/lib/discount';
import InspectionFee from '@/components/InspectionFee';
import Spinner from '@/components/Spinner';

// HOUZQORA's own test checkout. TEST MODE only: no real payment,
// and no card details are asked for or stored here. It records a
// test submission (name, email, optional note, home, amount) in the
// test_checkouts table, viewable in the admin panel. It never marks
// a booking paid and never touches the payments table.
export default function TestCheckoutForm({ p }: { p: Property }) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [feeToSave, setFeeToSave] = useState(p.fee);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (u) {
        setName(u.name || '');
        setEmail(u.email || '');
        const state = await fetchDiscountState(u.id);
        if (isDiscountActive(state, Date.now())) setFeeToSave(discountedFee(p.fee));
      }
      setChecked(true);
    })();
  }, [p.fee]);

  if (!checked) return <p className="mt-6 flex items-center gap-2"><Spinner />Loading test checkout...</p>;

  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-xl font-extrabold text-velvet">Please log in first</h2>
        <p className="mt-2 text-muted">The test checkout needs a signed in account.</p>
        <button onClick={() => { setPendingPath(`/checkout/${p.slug}/test`); router.push('/login'); }} className="btn-press mt-4 inline-block rounded-full bg-velvet px-5 py-3 font-bold text-white">Log in</button>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-xl font-extrabold text-velvet">Test saved.</h2>
        <p className="mt-2 text-muted">No payment was made. This is a test record only.</p>
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex justify-between"><span>Name</span><b>{name}</b></p>
          <p className="flex justify-between"><span>Email</span><b>{email}</b></p>
          <p className="flex justify-between"><span>Home</span><b>{p.title}</b></p>
          <p className="flex justify-between"><span>Amount</span><b>{eur(feeToSave)}</b></p>
          {note.trim() && <p className="flex justify-between"><span>Note</span><b>{note.trim()}</b></p>}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/properties/${p.slug}`} className="btn-press rounded-full bg-velvet px-5 py-3 font-bold text-white">View this home</Link>
          <button onClick={() => router.push(`/checkout/${p.slug}`)} className="btn-press rounded-full border border-line px-5 py-3 font-bold text-velvet">Back to checkout</button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setError('');
    if (!name.trim()) { setError('Add your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Add a valid email.'); return; }
    setBusy(true);
    try {
      const { error: insertError } = await supabase.from('test_checkouts').insert({
        user_id: user.id,
        property_slug: p.slug,
        amount_cents: feeToSave * 100,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        note: note.trim(),
      });
      if (insertError) throw insertError;
      setSaved(true);
    } catch {
      setError('This test could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const input = "mt-1 block w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none";
  const label = "block text-xs font-extrabold text-velvet";

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <span className="rounded-full bg-strawberry px-3 py-1 text-xs font-extrabold text-white">TEST MODE</span>
      <h2 className="mt-3 text-xl font-extrabold text-velvet">Test checkout</h2>
      <p className="mt-1 text-sm text-muted">No real payment. No card details are asked for or stored.</p>
      <div className="mt-4 space-y-2 text-sm">
        <p className="flex justify-between"><span>Home</span><b>{p.title} · {p.city}</b></p>
        <p className="flex justify-between"><span>Inspection fee, non-refundable</span><b><InspectionFee fee={p.fee} /></b></p>
      </div>
      <div className="mt-5 space-y-4">
        <label className={label}>Full name
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} className={input} />
        </label>
        <label className={label}>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} className={input} />
        </label>
        <label className={label}>Note (optional)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} rows={3} className={input} />
        </label>
      </div>
      {error && <p className="mt-3 text-sm font-bold text-strawberry">{error}</p>}
      <button onClick={submit} disabled={busy} className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-strawberry px-5 py-3 font-bold text-white disabled:opacity-60">
        {busy && <Spinner />}
        {busy ? 'Saving test...' : 'Save test checkout'}
      </button>
    </div>
  );
}
