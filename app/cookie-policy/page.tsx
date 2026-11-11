import Link from 'next/link';

export default function CookiePolicy() {
  return (
    <div className="max-w-3xl">
      <h1 className="mt-4 text-3xl font-extrabold text-velvet">Cookie Policy</h1>
      <p className="mt-3 text-muted">Last updated: 9 November 2026.</p>
      <p className="mt-3 text-muted">This page explains what cookies and similar storage HOUZQORA uses, and what each one does. We keep this list short on purpose. We do not run analytics cookies, advertising cookies, or third party tracking cookies.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">1. What a cookie is</h2>
      <p className="mt-2 text-muted">A cookie is a small file your browser stores when you visit a site. It lets the site remember you, or remember a choice you made. Browser storage, such as local storage, does a similar job on your own device. HOUZQORA uses both, only for the purposes listed below.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">2. Strictly necessary cookies</h2>
      <p className="mt-2 text-muted">These are needed for the site to work. You cannot turn them off in Cookie settings, because signing in and booking would stop working without them.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Supabase sign in session: keeps you signed in while you browse, and lets the site know which account is yours. Without it, you would be signed out on every page.</li>
        <li>Admin login, named houzqora_admin: used only for the admin panel, to remember that an admin has signed in. It lasts 7 days, it is httpOnly, and it is not used for regular visitors.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">3. Preference storage on your device</h2>
      <p className="mt-2 text-muted">These are stored in your browser, not sent to us as cookies, and they only hold your own HOUZQORA state.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Saved homes and bookings fallback: if the database is not reachable, your saved homes and bookings are kept in local storage so they do not vanish.</li>
        <li>Discount state: when your 7 day inspection discount started, and whether you claimed it, kept per account as a fallback to the database.</li>
        <li>Pending home: the home you were looking at before signing up, so we can take you back to it afterwards.</li>
        <li>Banner dismissal: kept only for the current session, so hiding the discount banner does not cancel the offer.</li>
        <li>Cookie choices: the choices you save on the Cookie settings page.</li>
      </ul>
      <p className="mt-2 text-muted">You can turn preference storage off in Cookie settings. If you do, saved homes, bookings, and discount state will rely on the database only, and the fallback will not work while you are offline or the database is unreachable.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">4. What we do not use</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>No analytics cookies. We do not measure your visit with Google Analytics or a similar tool.</li>
        <li>No marketing or advertising cookies. We do not show adverts from other companies, and we do not track you across other sites.</li>
        <li>No social media tracking cookies.</li>
      </ul>
      <p className="mt-2 text-muted">If we add analytics or marketing cookies later, we will update this page and ask for your choice in Cookie settings first.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">5. Payments</h2>
      <p className="mt-2 text-muted">When you pay, you leave HOUZQORA and pay on the Mollie page. Mollie may set its own cookies on its own pages, under its own cookie policy. We do not control those cookies.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">6. How to control cookies</h2>
      <p className="mt-2 text-muted">Use the Cookie settings page to save your choices for this site. You can also delete cookies and browser storage in your browser settings at any time. If you block strictly necessary cookies in your browser, signing in, saving homes, and booking will not work.</p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-5">
        <p className="font-bold text-velvet">More legal pages</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy-policy" className="text-strawberry">Privacy Policy</Link>
          <Link href="/terms" className="text-strawberry">Terms and conditions</Link>
          <Link href="/inspection-policy" className="text-strawberry">Inspection policy</Link>
          <Link href="/cookie-settings" className="text-strawberry">Cookie settings</Link>
        </div>
      </div>
    </div>
  );
}
