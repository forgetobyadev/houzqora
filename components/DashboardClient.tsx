'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import PropertyCard from './PropertyCard';
import PlaceSearch from './PlaceSearch';
import Pagination from './Pagination';
import { useReturnHome } from './useReturnHome';
import { eur, type Property } from '@/lib/properties';
import { fetchProperties, fetchSavedSlugs, getCurrentUser, toggleSavedSlug, type AppUser } from '@/lib/queries';

const cities = ['All', 'Alkmaar', 'Amersfoort', 'Amsterdam', 'Arnhem', 'Breda', 'Delft', 'Dordrecht', 'Eindhoven', 'Enschede', 'Gouda', 'Groningen', 'Haarlem', 'Leiden', 'Maastricht', 'Nijmegen', 'Rotterdam', 'The Hague', 'Tilburg', 'Utrecht', 'Zwolle'];
const bedroomOptions = ['Any', '1', '2', '3+'];
// Rent ranges match the homes actually listed (1490 to 3400 a month).
// The old 800 to 1700 options were left over from before the prices
// were doubled, so the highest maximum filtered the dearer homes out.
const minOptions = ['', '1600', '1800', '2000', '2200', '2600', '3000'];
const maxOptions = ['', '1800', '2000', '2200', '2400', '2600', '3000', '3400'];

export default function DashboardClient({ initialPage }: { initialPage: number }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All');
  const [beds, setBeds] = useState('Any');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The page is local state, and the address carries it (?page=6)
  // so back still returns to the exact page. Paging writes the
  // address directly instead of asking the server, so the list
  // changes at once with no loading flash in between.
  const [page, setPage] = useState(initialPage);
  const pageSize = 4;

  const writePageToAddress = (n: number, replace = false) => {
    const params = new URLSearchParams(window.location.search);
    if (n <= 1) params.delete('page');
    else params.set('page', String(n));
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  };

  // Stepping back through the pages updates the list from the
  // address, so the phone back button works inside the list too.
  useEffect(() => {
    const onPop = () => {
      const raw = Number(new URLSearchParams(window.location.search).get('page') ?? '1');
      setPage(Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Homes are public, so they do not wait for the account
      // check. Start both at once, show the homes as soon as
      // both are in, then fill in the saved marks afterwards
      // instead of holding the whole dashboard for them.
      const [u, props] = await Promise.all([getCurrentUser(), fetchProperties()]);
      if (cancelled) return;
      setUser(u);
      setProperties(props);
      setLoaded(true);
      if (u) {
        const s = await fetchSavedSlugs(u.id);
        if (!cancelled) setSaved(s);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const places = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    properties.forEach((p) => {
      [p.city, p.neighbourhood].forEach((place) => {
        if (!seen.has(place)) {
          seen.add(place);
          list.push(place);
        }
      });
    });
    return list;
  }, [properties]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (q && ![p.title, p.city, p.neighbourhood].join(' ').toLowerCase().includes(q)) return false;
      if (city !== 'All' && p.city !== city) return false;
      if (beds === '1' && p.bedrooms !== 1) return false;
      if (beds === '2' && p.bedrooms !== 2) return false;
      if (beds === '3+' && p.bedrooms < 3) return false;
      if (minRent && p.rent < Number(minRent)) return false;
      if (maxRent && p.rent > Number(maxRent)) return false;
      return true;
    });
  }, [properties, search, city, beds, minRent, maxRent]);

  // A filter change starts the list over at page 1. The first run
  // is skipped so a shared ?page= link still opens on that page.
  // The page is clamped to the pages that exist, so a short list
  // after loading never needs a reset of its own.
  const firstFilters = useRef(true);
  useEffect(() => {
    if (firstFilters.current) {
      firstFilters.current = false;
      return;
    }
    setPage(1);
    writePageToAddress(1, true);
    // Only the filters reset the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, city, beds, minRent, maxRent]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageHomes = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  useReturnHome(pageHomes);

  const goToPage = (n: number) => {
    const next = Math.max(1, Math.min(n, totalPages));
    setPage(next);
    writePageToAddress(next);
  };

  if (!loaded) return <p className="mt-6">Loading dashboard...</p>;

  if (!user) {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h1 className="text-xl font-extrabold text-velvet">Please log in</h1>
        <div className="mt-4 flex gap-3">
          <Link href="/login" className="btn-press rounded-full bg-velvet px-5 py-3 font-bold text-white">Log in</Link>
          <Link href="/signup" className="btn-press rounded-full bg-strawberry px-5 py-3 font-bold text-white">Sign up</Link>
        </div>
      </div>
    );
  }

  const firstName = user.name.split(' ')[0];
  const clearAll = () => {
    setSearch('');
    setCity('All');
    setBeds('Any');
    setMinRent('');
    setMaxRent('');
  };

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold text-velvet">Dashboard</h1>
      </div>
      <p className="mt-2 text-xl font-bold">Welcome, {firstName}</p>

      <div className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-[0_8px_24px_rgba(94,18,32,0.08)]">
        <button type="button" onClick={() => setFiltersOpen((o) => !o)} className="btn-press flex w-full items-center justify-between text-left" aria-expanded={filtersOpen}>
          <span className="text-sm font-extrabold text-velvet">Filters</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={filtersOpen ? 'rotate-180 text-velvet' : 'text-velvet'}><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {filtersOpen && (
          <>
        <div className="mt-3">
          <PlaceSearch value={search} onChange={setSearch} places={places} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-extrabold uppercase tracking-wide text-muted">
            Location
            <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 block w-full rounded-xl border border-line px-3 py-2.5 text-sm font-bold text-ink outline-none">
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-muted">
            Bedrooms
            <select value={beds} onChange={(e) => setBeds(e.target.value)} className="mt-1 block w-full rounded-xl border border-line px-3 py-2.5 text-sm font-bold text-ink outline-none">
              {bedroomOptions.map((b) => (
                <option key={b} value={b}>{b === 'Any' ? 'Any' : `${b} bedrooms`}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-muted">
            Min rent
            <select value={minRent} onChange={(e) => setMinRent(e.target.value)} className="mt-1 block w-full rounded-xl border border-line px-3 py-2.5 text-sm font-bold text-ink outline-none">
              {minOptions.map((v) => (
                <option key={v || 'any'} value={v}>{v ? eur(Number(v)) : 'Any'}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-muted">
            Max rent
            <select value={maxRent} onChange={(e) => setMaxRent(e.target.value)} className="mt-1 block w-full rounded-xl border border-line px-3 py-2.5 text-sm font-bold text-ink outline-none">
              {maxOptions.map((v) => (
                <option key={v || 'any'} value={v}>{v ? eur(Number(v)) : 'Any'}</option>
              ))}
            </select>
          </label>
        </div>
        <button onClick={clearAll} className="btn-press mt-4 rounded-full border border-line px-4 py-2 text-sm font-bold text-velvet">Clear filters</button>
          </>
        )}
      </div>

      <p className="mt-6 text-sm font-extrabold text-velvet">{filtered.length} homes</p>
      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-xl font-extrabold text-velvet">No homes found</h2>
          <button onClick={clearAll} className="btn-press mt-4 rounded-full bg-strawberry px-5 py-3 font-bold text-white">Clear filters</button>
        </div>
      ) : (
        <>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageHomes.map((p, i) => (
            <PropertyCard
              key={p.slug}
              p={p}
              index={((safePage - 1) * pageSize + i) % 3}
              showSave
              saved={saved.includes(p.slug)}
              saving={toggling === p.slug}
              onToggleSave={async () => {
                if (!user) return;
                setToggling(p.slug);
                try {
                  const nowSaved = await toggleSavedSlug(user.id, p.slug);
                  setSaved((s) => (nowSaved ? [...s, p.slug] : s.filter((x) => x !== p.slug)));
                } finally {
                  setToggling(null);
                }
              }}
            />
          ))}
        </div>
        <Pagination page={safePage} totalPages={totalPages} onPage={goToPage} />
        </>
      )}
    </div>
  );
}
