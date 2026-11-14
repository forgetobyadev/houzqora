import { notFound } from 'next/navigation';
import Gallery from '@/components/Gallery';
import BackButton from '@/components/BackButton';
import BookActions from '@/components/BookActions';
import InspectionFee from '@/components/InspectionFee';
import { eur, properties } from '@/lib/properties';
import { fetchProperty } from '@/lib/queries';

export function generateStaticParams() {
  return properties.map((p) => ({ slug: p.slug }));
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const p = await fetchProperty(params.slug);
  if (!p) notFound();
  return (
    <div className="min-w-0">
      <BackButton />
      <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0">
          <Gallery images={p.images} title={p.title} />
          <h1 className="mt-5 break-words text-3xl font-extrabold text-velvet">{p.title}</h1>
          <p className="mt-1 break-words text-muted">{p.neighbourhood}, {p.city}</p>
          <p className="mt-4 break-words text-muted">{p.description}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-white p-3"><p className="text-muted">Type</p><p className="font-bold">{p.type}</p></div>
            <div className="rounded-xl border border-line bg-white p-3"><p className="text-muted">Bedrooms</p><p className="font-bold">{p.bedrooms}</p></div>
            <div className="rounded-xl border border-line bg-white p-3"><p className="text-muted">Bathrooms</p><p className="font-bold">{p.bathrooms}</p></div>
            <div className="rounded-xl border border-line bg-white p-3"><p className="text-muted">Toilets</p><p className="font-bold">{p.toilets}</p></div>
            <div className="rounded-xl border border-line bg-white p-3"><p className="text-muted">Size</p><p className="font-bold">{p.sizeM2} m2</p></div>
            <div className="rounded-xl border border-line bg-white p-3"><p className="text-muted">Furnishing</p><p className="font-bold">{p.furnished}</p></div>
            <div className="rounded-xl border border-line bg-white p-3"><p className="text-muted">Parking</p><p className="font-bold">{p.parking}</p></div>
            <div className="rounded-xl border border-line bg-white p-3"><p className="text-muted">City</p><p className="font-bold">{p.city}</p></div>
          </div>
          <h2 className="mt-6 text-xl font-extrabold text-velvet">Amenities</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {p.amenities.map((a) => <li key={a} className="rounded-full border border-line bg-white px-3 py-1 text-sm">{a}</li>)}
          </ul>
        </div>
        <aside className="h-fit min-w-0 self-start rounded-2xl bg-velvet p-5 text-white lg:sticky lg:top-6">
          <p className="text-2xl font-extrabold">{eur(p.rent)} <span className="text-sm font-semibold text-white/70">/ month</span></p>
          <div className="mt-4 space-y-2 rounded-xl bg-white p-4 text-sm text-ink">
            <p className="flex justify-between"><span>Monthly rent</span><b>{eur(p.rent)}</b></p>
            <p className="flex justify-between"><span>Inspection fee</span><b><InspectionFee fee={p.fee} /></b></p>
            <p className="flex justify-between border-t border-line pt-2"><span>Remaining to secure for a year</span><b>{eur(p.securing)}</b></p>
            <p className="text-xs text-muted">The securing amount is set per property. 9 months' rent secures the home for a full year, 3 months come as a bonus.</p>
          </div>
          <p className="mt-4 rounded-xl border border-white/25 p-3 text-sm text-white/80">
            Inspection fee is non-refundable. It covers arranging and conducting your viewing. It does not reserve this home.
          </p>
          <div className="mt-4"><BookActions slug={p.slug} title={p.title} city={p.city} /></div>
          <p className="mt-3 text-xs text-white/70">If you are not signed in, booking will take you to signup first, then to Dashboard.</p>
        </aside>
      </div>
    </div>
  );
}
