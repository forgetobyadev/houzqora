import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="max-w-3xl">
      <h1 className="mt-4 text-3xl font-extrabold text-velvet">Privacy Policy</h1>
      <p className="mt-3 text-muted">Last updated: 9 November 2026.</p>
      <p className="mt-3 text-muted">This page explains, in plain words, what HOUZQORA collects, why we collect it, and what you can ask us to do with it. HOUZQORA is a rental and property inspection platform for the Netherlands.</p>


      <h2 className="mt-6 text-xl font-extrabold text-velvet">1. What we collect</h2>
      <p className="mt-2 text-muted">We collect only what the service needs to work.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Account details you give us when you sign up: your name, email address, and phone number.</li>
        <li>Homes you save, bookings you make, viewing slots you pick, and whether an inspection fee has been paid.</li>
        <li>Receipt details, when you generate a receipt: the house, whether you want to buy or rent, your viewing slot, and how the agent should reach you. We do not collect or store your card number or bank details. There is no online payment on HOUZQORA.</li>
        <li>Discount state for signed in users: when your 7 day inspection discount started and whether you claimed it.</li>
        <li>Technical details needed to keep you signed in and to keep the site working, such as a session identifier.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">2. How we use it</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>To show you available homes and their rent, inspection fee, and securing amount.</li>
        <li>To arrange your inspection, record your booking, and show your viewing slot.</li>
        <li>To apply your inspection discount when you have claimed it.</li>
        <li>To keep accounts secure and to stop misuse.</li>
      </ul>
      <p className="mt-2 text-muted">We do not sell personal data. We do not use your data to show you adverts from other companies.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">3. Who we share it with</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Supabase, which hosts our database and sign in service. Your account, saved homes, and bookings are stored there.</li>
        <li>Brevo, which sends our sign in, confirmation, and password reset emails.</li>
        <li>We share data with the police or a regulator only when the law requires it.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">4. How long we keep it</h2>
      <p className="mt-2 text-muted">We keep your account and booking records while your account is active and for as long as we need them to deal with a booking or a legal duty. When data is no longer needed, we delete it or make it anonymous.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">5. Your rights</h2>
      <p className="mt-2 text-muted">Under the General Data Protection Regulation, which applies in the Netherlands, you can ask us to:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Show you the personal data we hold about you.</li>
        <li>Correct data that is wrong or out of date.</li>
        <li>Delete your personal data, where the law allows it.</li>
        <li>Limit how we use your data, or give you a copy of it in a usable form.</li>
        <li>Stop using your data for a purpose you object to.</li>
      </ul>
      <p className="mt-2 text-muted">We will answer within one month. If you are not happy with our answer, you can complain to the Dutch Data Protection Authority, the Autoriteit Persoonsgegevens.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">6. Security</h2>
      <p className="mt-2 text-muted">Access to personal data is limited to what each part of the service needs. Admin access is protected by a separate login.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">7. Changes to this policy</h2>
      <p className="mt-2 text-muted">If we change how we collect or use personal data, we will update this page and change the date at the top. If a change affects you in an important way, we will tell you when you next sign in.</p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-5">
        <p className="font-bold text-velvet">More legal pages</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-strawberry">Terms and conditions</Link>
          <Link href="/inspection-policy" className="text-strawberry">Inspection policy</Link>
          <Link href="/cookie-policy" className="text-strawberry">Cookie Policy</Link>
          <Link href="/cookie-settings" className="text-strawberry">Cookie settings</Link>
        </div>
      </div>
    </div>
  );
}
