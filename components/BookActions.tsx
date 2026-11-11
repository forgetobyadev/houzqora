'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchBookings, getCurrentUser, setPendingPath, setPendingSlug, upsertBooking } from '@/lib/queries';
import Spinner from '@/components/Spinner';

export default function BookActions({ slug, title, city }: { slug: string; title: string; city: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'form' | 'book' | 'agent' | null>(null);

  const ensureBooking = async () => {
    const user = await getCurrentUser();
    if (!user) {
      setPendingSlug(slug);
      router.push('/signup');
      return false;
    }
    const bookings = await fetchBookings(user.id);
    await upsertBooking(user.id, slug, bookings[slug] || { paid: false, slot: '' });
    return true;
  };

  const book = async () => {
    setBusy('book');
    try {
      if (await ensureBooking()) router.push('/bookings');
    } finally {
      setBusy(null);
    }
  };

  const form = async () => {
    setBusy('form');
    try {
      if (await ensureBooking()) router.push(`/checkout/${slug}`);
    } finally {
      setBusy(null);
    }
  };

  // The agents page builds the WhatsApp draft itself, so this
  // button only needs to carry the home along with it. Auth door:
  // a visitor who is not signed in goes to login first, then
  // comes back to the agents page with the home still carried.
  const agentsHref = `/agents?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}&city=${encodeURIComponent(city)}`;

  const contactAgent = async () => {
    setBusy('agent');
    try {
      const user = await getCurrentUser();
      if (!user) {
        setPendingPath(agentsHref);
        router.push('/login');
        return;
      }
      router.push(agentsHref);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={form} disabled={busy !== null} className="btn-press flex items-center gap-2 rounded-full bg-strawberry px-5 py-3 font-bold text-white shadow-[0_2px_0_rgba(230,59,78,0.3)] disabled:opacity-60">
        {busy === 'form' && <Spinner />}Make payment
      </button>
      <button onClick={book} disabled={busy !== null} className="btn-press flex items-center gap-2 rounded-full bg-velvet px-5 py-3 font-bold text-white disabled:opacity-60">
        {busy === 'book' && <Spinner />}Book inspection
      </button>
      <button onClick={contactAgent} disabled={busy !== null} className="btn-press flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 font-bold text-white disabled:opacity-60">
        {busy === 'agent' && <Spinner />}Contact agent
      </button>
    </div>
  );
}
