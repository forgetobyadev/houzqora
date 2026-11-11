'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eur, type Property } from '@/lib/properties';
import { supabase } from '@/lib/supabase';
import { fetchBookings, getCurrentUser, setPendingPath, upsertBooking, type AppUser } from '@/lib/queries';
import InspectionFee from '@/components/InspectionFee';
import Spinner from '@/components/Spinner';

export default function CheckoutClient({ p }: { p: Property }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<AppUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (u) {
        const bookings = await fetchBookings(u.id);
        await upsertBooking(u.id, p.slug, bookings[p.slug] || { paid: false, slot: '' });
      }
      setChecked(true);
    })();
  }, [p.slug]);

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

  // Pay, not just record. This creates a real payment with Mollie
  // for iDEAL, then sends the customer to the provider to pay
  // there. No card or bank details pass through this page. The
  // booking is only marked paid later, by the provider webhook,
  // after the provider confirms the money.
  const pay = async () => {
    setError('');
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // The session ran out mid-checkout: remember this page so
        // logging in brings the visitor straight back here.
        setPendingPath(`/checkout/${p.slug}`);
        router.push('/login');
        return;
      }
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ slug: p.slug, method: 'ideal' }),
      });
      const data = await res.json();
      if (!res.ok || !data?.checkoutUrl) {
        setError(data?.error || 'This payment could not be started. Please try again.');
        setProcessing(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError('This payment could not be started. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="mt-4 space-y-2 text-sm">
        <p className="flex justify-between"><span>Monthly rent</span><b>{eur(p.rent)}</b></p>
        <p className="flex justify-between"><span>Inspection fee, non-refundable</span><b><InspectionFee fee={p.fee} /></b></p>
        <p className="flex justify-between"><span>Remaining to secure, first month plus deposit</span><b>{eur(p.securing)}</b></p>
      </div>
      <p className="mt-4 text-sm text-muted">Confirming the inspection does not reserve this home. It covers arranging and conducting your viewing.</p>
      <p className="mt-4 text-sm text-muted">You pay by iDEAL through Mollie.</p>
      {error && <p className="mt-3 text-sm font-bold text-strawberry">{error}</p>}
      <button onClick={pay} disabled={processing} className="btn-press mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-strawberry px-5 py-3 font-bold text-white disabled:opacity-60">
        {processing && <Spinner />}
        {processing ? 'Starting payment...' : (<>Pay inspection fee <InspectionFee fee={p.fee} /></>)}
      </button>
    </div>
  );
}
