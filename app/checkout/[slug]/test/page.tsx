import { notFound } from 'next/navigation';
import TestCheckoutForm from '@/components/TestCheckoutForm';
import BackButton from '@/components/BackButton';
import { fetchProperty } from '@/lib/queries';

export default async function TestCheckoutPage({ params }: { params: { slug: string } }) {
  const p = await fetchProperty(params.slug);
  if (!p) notFound();
  return (
    <div className="mx-auto mt-4 max-w-2xl">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-velvet">Test checkout: {p.title}</h1>
      <p className="mt-2 text-muted">{p.city} · HOUZQORA test checkout. No real payment.</p>
      <div className="mt-5"><TestCheckoutForm p={p} /></div>
    </div>
  );
}
