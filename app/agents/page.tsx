'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, setPendingPath, type AppUser } from '@/lib/queries';
import Spinner from '@/components/Spinner';

const agents = [
  { label: 'Chat Agent 1', wa: '2349074451933' },
  { label: 'Chat Agent 2', wa: '2349159685585' },
];

// WhatsApp mark, drawn in white like the other icons in the app.
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function AgentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AppUser | null>(null);
  const [checked, setChecked] = useState(false);

  const title = searchParams.get('title') || '';
  const city = searchParams.get('city') || '';
  const intent = searchParams.get('intent') || '';
  const ref = searchParams.get('ref') || '';
  // The draft still goes to WhatsApp in the link itself, so tapping
  // an agent opens WhatsApp with it ready. It is no longer shown
  // on this page. An authority to pay link carries buy or rent plus the
  // reference, so the agent hears the choice and the
  // reference straight away.
  const draft = title && city && (intent === 'buy' || intent === 'rent') && ref
    ? `Hi HOUZQORA, I want to ${intent} ${title} in ${city}. My authority to pay is ${ref} and I will send it to you here. Please help me with the next steps.`
    : title && city
      ? `Hi HOUZQORA, I want to book a house inspection for ${title} in ${city}. Please help me with the next steps.`
      : 'Hi HOUZQORA, I want to book a house inspection. Please help me with the next steps.';

  // Fallback only: the real auth door is the click on Contact
  // agent, Message agency, or Chat with an agent, which checks
  // login straight away. This check only covers a direct visit
  // to this page, so a visitor who types the address while
  // logged out still goes to login first and comes back here
  // with the home still carried in the link.
  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (!u) {
        const query = searchParams.toString();
        setPendingPath(query ? `/agents?${query}` : '/agents');
        router.push('/login');
        return;
      }
      setUser(u);
      setChecked(true);
    })();
  }, [router, searchParams]);

  if (!checked || !user) {
    return <p className="mt-6 flex items-center gap-2"><Spinner />Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mt-4 text-3xl font-extrabold text-velvet">Contact an agent</h1>
      <p className="mt-2 text-muted">
        {title && city
          ? ref
            ? `About ${title} in ${city}. Your authority to pay ${ref} is ready to send.`
            : `About ${title} in ${city}. Choose an agent to chat with on WhatsApp.`
          : 'Choose an agent to chat with on WhatsApp about a home or an inspection.'}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {agents.map((agent) => (
          <a
            key={agent.label}
            href={`https://wa.me/${agent.wa}?text=${encodeURIComponent(draft)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press flex items-center justify-center gap-2 rounded-full bg-velvet px-5 py-3 font-bold text-white"
          >
            <WhatsAppIcon />
            {agent.label}
          </a>
        ))}
      </div>

      <Link href="/" className="btn-press mt-6 inline-block rounded-full border border-line bg-white px-5 py-3 font-bold text-velvet">
        Back to home
      </Link>
    </div>
  );
}

export default function Agents() {
  return (
    <Suspense fallback={<p className="mt-6 flex items-center gap-2"><Spinner />Loading...</p>}>
      <AgentsContent />
    </Suspense>
  );
}
