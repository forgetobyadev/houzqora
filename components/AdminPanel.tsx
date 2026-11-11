'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminLogout } from '@/lib/admin-auth';
import { createPropertyAdmin, deletePropertyAdmin, updatePropertyAdmin, uploadPropertyImageAdmin } from '@/lib/admin-actions';
import { fetchAllProperties } from '@/lib/queries';
import Spinner from '@/components/Spinner';
import type { Property } from '@/lib/properties';

const emptyForm: Property = {
  slug: '', title: '', city: '', neighbourhood: '', type: 'Apartment',
  bedrooms: 1, bathrooms: 1, toilets: 1, sizeM2: 50,
  rent: 0, fee: 0, securing: 0,
  furnished: '', parking: '', description: '', amenities: [], images: [],
  available: true,
};

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

type SaveResult = { ok: boolean; error?: string };

// One form for both jobs: adding a house at the top of the panel,
// and editing a house inline under its own row. It is a top level
// component with a key per house, so switching houses resets it
// instead of carrying the last house's values over.
function PropertyForm({ initial, editing, onSave, onCancel }: {
  initial: Property;
  editing: string | null;
  onSave: (p: Property) => Promise<SaveResult>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Property>(initial);
  const [amenitiesText, setAmenitiesText] = useState(initial.amenities.join(', '));
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (key: keyof Property, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Images upload in parallel, so a batch of photos goes up at
  // once instead of one by one. One bad file no longer kills the
  // rest, and the count shows how far along it is.
  const uploadFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) {
      setError('Choose image files to upload.');
      return;
    }
    if (images.length < files.length) {
      setError('Only image files can be uploaded. The rest were skipped.');
    } else {
      setError('');
    }
    setUploading(true);
    let done = 0;
    setUploadStatus(`Uploading 0 of ${images.length}...`);
    // Each upload counts itself as it finishes, so the status
    // stays live while the batch is still going up.
    const results = await Promise.all(images.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadPropertyImageAdmin(formData);
        if (!result.ok || !result.url) throw new Error(result.error || 'Could not upload this image.');
        return result.url;
      } catch {
        return null;
      } finally {
        done += 1;
        setUploadStatus(`Uploading ${done} of ${images.length}...`);
      }
    }));
    const urls = results.filter((u): u is string => u !== null);
    const failed = results.length - urls.length;
    if (urls.length > 0) setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    if (failed > 0) setError(`${failed} image${failed === 1 ? '' : 's'} could not be uploaded. The rest are in.`);
    setUploading(false);
    setUploadStatus('');
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((x) => x !== url) }));
  };

  // The first photo is the cover shown on the cards, so the order
  // can be changed here instead of re-uploading everything.
  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((f) => {
      const next = [...f.images];
      const target = index + direction;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, images: next };
    });
  };

  const save = async () => {
    setError('');
    const slug = editing || slugify(form.title);
    if (!slug) { setError('Give the house a title, so a slug can be made from it.'); return; }
    if (!form.title.trim() || !form.city.trim()) { setError('Title and city are required.'); return; }
    const property: Property = {
      ...form,
      slug,
      title: form.title.trim(),
      city: form.city.trim(),
      amenities: amenitiesText.split(',').map((s) => s.trim()).filter(Boolean),
      images: form.images,
    };
    setBusy(true);
    try {
      const result = await onSave(property);
      if (!result.ok) throw new Error(result.error || 'Could not save this house.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this house. If SUPABASE_SERVICE_ROLE_KEY is not set in .env.local, or the service role grants have not been run, the write will be rejected.');
    } finally {
      setBusy(false);
    }
  };

  const input = "mt-1 block w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none";
  const label = "block text-xs font-extrabold text-velvet";

  return (
    <div>
      <h2 className="text-xl font-extrabold text-velvet">{editing ? 'Edit house' : 'Add a house'}</h2>
      {editing && <p className="mt-1 text-sm text-muted">Slug cannot be changed after creation, because saved homes and bookings point to it.</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={label}>Title<input value={form.title} onChange={(e) => set('title', e.target.value)} className={input} /></label>
        <label className={label}>Slug (made from the title)<input value={editing ? form.slug : slugify(form.title)} disabled className={input} /></label>
        <label className={label}>City<input value={form.city} onChange={(e) => set('city', e.target.value)} className={input} /></label>
        <label className={label}>Neighbourhood<input value={form.neighbourhood} onChange={(e) => set('neighbourhood', e.target.value)} className={input} /></label>
        <label className={label}>Type<input value={form.type} onChange={(e) => set('type', e.target.value)} className={input} /></label>
        <label className={label}>Furnishing<input value={form.furnished} onChange={(e) => set('furnished', e.target.value)} className={input} /></label>
        <label className={label}>Parking<input value={form.parking} onChange={(e) => set('parking', e.target.value)} className={input} /></label>
        <label className={label}>Available<input type="checkbox" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} className="mt-2 block h-5 w-5" /></label>
        <label className={label}>Bedrooms<input type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', Number(e.target.value))} className={input} /></label>
        <label className={label}>Bathrooms<input type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', Number(e.target.value))} className={input} /></label>
        <label className={label}>Toilets<input type="number" value={form.toilets} onChange={(e) => set('toilets', Number(e.target.value))} className={input} /></label>
        <label className={label}>Size (m2)<input type="number" value={form.sizeM2} onChange={(e) => set('sizeM2', Number(e.target.value))} className={input} /></label>
        <label className={label}>Rent / month (€)<input type="number" value={form.rent} onChange={(e) => set('rent', Number(e.target.value))} className={input} /></label>
        <label className={label}>Inspection fee (€)<input type="number" value={form.fee} onChange={(e) => set('fee', Number(e.target.value))} className={input} /></label>
        <label className={label}>Amount to secure (€)<input type="number" value={form.securing} onChange={(e) => set('securing', Number(e.target.value))} className={input} /></label>
      </div>
      <label className={`${label} mt-3`}>Description<textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} className={input} /></label>
      <label className={`${label} mt-3`}>Amenities, separated by commas<textarea value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} rows={2} className={input} /></label>
      <div className="mt-3">
        <p className={label}>Images</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); void uploadFiles(Array.from(e.dataTransfer.files)); }}
          onClick={() => fileInput.current?.click()}
          className={`mt-1 cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm ${dragOver ? 'border-strawberry bg-[#FFF5F3]' : 'border-line bg-white'}`}
        >
          <p className="font-bold text-velvet">Drop images here, or tap to choose</p>
          <p className="mt-1 text-muted">JPG, PNG, WebP or GIF, 5MB or smaller each. They upload straight away, several at once.</p>
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void uploadFiles(e.target.files ? Array.from(e.target.files) : []); e.target.value = ''; }} />
        </div>
        {uploading && <p className="mt-2 flex items-center gap-2 text-sm font-bold text-velvet"><Spinner />{uploadStatus}</p>}
        <div className="mt-3 flex flex-wrap gap-3">
          {form.images.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-24 w-32 rounded-xl border border-line object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-velvet px-2 py-0.5 text-xs font-extrabold text-white">Cover</span>}
              <span className="absolute bottom-1 left-1 flex gap-1">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move photo left" className="btn-press rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-velvet disabled:opacity-40">←</button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} aria-label="Move photo right" className="btn-press rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-velvet disabled:opacity-40">→</button>
              </span>
              <button type="button" onClick={() => removeImage(url)} className="btn-press absolute -right-2 -top-2 rounded-full bg-strawberry px-2 py-0.5 text-xs font-bold text-white">Remove</button>
            </div>
          ))}
        </div>
        {form.images.length > 0 && <p className="mt-2 text-xs text-muted">{form.images.length} photo{form.images.length === 1 ? '' : 's'} · the first photo is the cover shown on the cards.</p>}
      </div>
      {error && <p className="mt-3 text-sm font-bold text-strawberry">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={save} disabled={busy || uploading} className="btn-press flex items-center gap-2 rounded-full bg-strawberry px-5 py-3 font-bold text-white disabled:opacity-60">{busy && <Spinner />}{editing ? 'Save changes' : 'Add house'}</button>
        <button onClick={onCancel} className="btn-press rounded-full border border-line px-5 py-3 font-bold text-velvet">Cancel</button>
      </div>
    </div>
  );
}

export default function AdminPanel({ initialProperties }: { initialProperties: Property[] }) {
  const router = useRouter();
  const [list, setList] = useState<Property[]>(initialProperties);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [availFilter, setAvailFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const cities = useMemo(() => Array.from(new Set(list.map((p) => p.city))).sort(), [list]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      if (availFilter === 'available' && !p.available) return false;
      if (availFilter === 'unavailable' && p.available) return false;
      if (cityFilter !== 'All' && p.city !== cityFilter) return false;
      if (!q) return true;
      return [p.title, p.city, p.neighbourhood, p.slug].join(' ').toLowerCase().includes(q);
    });
  }, [list, search, cityFilter, availFilter]);

  const refresh = async () => {
    setList(await fetchAllProperties());
  };

  // One save path for both forms. The form already validated the
  // title and city, so this only talks to the server.
  const handleSave = async (p: Property): Promise<SaveResult> => {
    setError('');
    setNotice('');
    const result = editing
      ? await updatePropertyAdmin(editing, p)
      : await createPropertyAdmin(p);
    if (!result.ok) return result;
    await refresh();
    setNotice(editing ? 'House updated.' : 'House added.');
    setEditing(null);
    setShowAdd(false);
    return { ok: true };
  };

  const startEdit = (p: Property) => {
    setShowAdd(false);
    setEditing(p.slug);
    setError('');
    setNotice('');
  };

  const toggleAdd = () => {
    setEditing(null);
    setShowAdd((s) => !s);
    setError('');
    setNotice('');
  };

  // Flip a house available or unavailable from its row, without
  // opening the edit form.
  const toggleAvailable = async (p: Property) => {
    setToggling(p.slug);
    setError('');
    try {
      const result = await updatePropertyAdmin(p.slug, { ...p, available: !p.available });
      if (!result.ok) throw new Error(result.error || 'Could not change availability.');
      setList((l) => l.map((x) => (x.slug === p.slug ? { ...x, available: !x.available } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change availability.');
    } finally {
      setToggling(null);
    }
  };

  const remove = async (slug: string) => {
    if (!window.confirm('Delete this house? This cannot be undone.')) return;
    setError('');
    setDeleting(slug);
    try {
      const result = await deletePropertyAdmin(slug);
      if (!result.ok) throw new Error(result.error || 'Could not delete this house.');
      await refresh();
      setNotice('House deleted.');
      if (editing === slug) setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this house.');
    } finally {
      setDeleting(null);
    }
  };

  const logOut = async () => {
    await adminLogout();
    router.refresh();
  };

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-velvet">Admin panel</h1>
        <span className="flex gap-2">
          <button onClick={toggleAdd} className="btn-press rounded-full bg-strawberry px-5 py-2.5 text-sm font-bold text-white">{showAdd ? 'Close add form' : 'Add a house'}</button>
          <button onClick={logOut} className="btn-press rounded-full bg-velvet px-5 py-2.5 text-sm font-bold text-white">Log out</button>
        </span>
      </div>

      {showAdd && (
        <div className="mt-5 rounded-2xl border border-line bg-white p-6">
          <PropertyForm key="add" initial={emptyForm} editing={null} onSave={handleSave} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {notice && <p className="mt-4 text-sm font-bold text-green-700">{notice}</p>}
      {error && <p className="mt-4 text-sm font-bold text-strawberry">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold text-velvet">Houses ({visible.length} of {list.length})</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, city, neighbourhood..."
          className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none"
        />
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="rounded-full border border-line bg-white px-3 py-2.5 text-sm font-bold text-velvet outline-none">
          <option value="All">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value as 'all' | 'available' | 'unavailable')} className="rounded-full border border-line bg-white px-3 py-2.5 text-sm font-bold text-velvet outline-none">
          <option value="all">All houses</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <div className="mt-3 space-y-2">
        {visible.map((p) => (
          <div key={p.slug} className="rounded-xl border border-line bg-white">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt="" className="h-14 w-20 shrink-0 rounded-lg border border-line object-cover" />
              ) : (
                <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-line bg-[#FFF5F3] text-xs font-bold text-muted">No photo</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="font-bold">{p.title}</span>
                <span className="block text-muted">{p.city} · {p.neighbourhood} · €{p.rent} / month · Fee €{p.fee} · Secure €{p.securing} · {p.images.length} photo{p.images.length === 1 ? '' : 's'}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { void toggleAvailable(p); }}
                  disabled={toggling === p.slug}
                  className={`btn-press flex items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60 ${p.available ? 'bg-green-700' : 'bg-strawberry'}`}
                >
                  {toggling === p.slug && <Spinner className="h-3 w-3" />}{p.available ? 'Available' : 'Unavailable'}
                </button>
                <Link href={`/properties/${p.slug}`} target="_blank" rel="noreferrer" className="btn-press rounded-full border border-line px-4 py-2 font-bold text-velvet">View</Link>
                <button onClick={() => startEdit(p)} className="btn-press rounded-full border border-line px-4 py-2 font-bold text-velvet">Edit</button>
                <button onClick={() => { void remove(p.slug); }} disabled={deleting === p.slug} className="btn-press flex items-center gap-2 rounded-full bg-strawberry px-4 py-2 font-bold text-white disabled:opacity-60">{deleting === p.slug && <Spinner className="h-3.5 w-3.5" />}Delete</button>
              </span>
            </div>
            {editing === p.slug && (
              <div className="border-t border-line p-4 sm:p-6">
                <PropertyForm key={p.slug} initial={p} editing={p.slug} onSave={handleSave} onCancel={() => setEditing(null)} />
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="rounded-xl border border-line bg-white p-4 text-sm text-muted">No houses match that search.</p>
        )}
      </div>
    </div>
  );
}
