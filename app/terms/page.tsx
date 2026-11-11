import Link from 'next/link';

export default function Terms() {
  return (
    <div className="max-w-3xl">
      <h1 className="mt-4 text-3xl font-extrabold text-velvet">Terms and conditions</h1>
      <p className="mt-3 text-muted">Last updated: 9 November 2026.</p>
      <p className="mt-3 text-muted">These terms explain how HOUZQORA works. By using HOUZQORA, you agree to them. HOUZQORA is a rental and property inspection platform for the Netherlands, listing homes across the country.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">1. What HOUZQORA does</h2>
      <p className="mt-2 text-muted">HOUZQORA lists available rental homes, shows the monthly rent, the inspection fee, and the amount needed to secure a home, and lets you book an inspection and generate an authority to pay for the inspection fee. We arrange the viewing. We do not decide who rents a home. That decision sits with the agency and the property owner, under their own terms.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">2. Your account</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Give correct contact details when you sign up, and keep them up to date.</li>
        <li>Keep your password private. You are responsible for what happens on your account.</li>
        <li>Use the service honestly. Do not pretend to be someone else, and do not try to break, copy, or misuse the site.</li>
        <li>Tell us straight away through the agents page if you think someone else has used your account.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">3. Listings, prices, and availability</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Only homes marked available are shown in public listings. A home can become unavailable at any time.</li>
        <li>Rent is shown monthly, in euros. The inspection fee and the securing amount are shown for each home.</li>
        <li>Listing details, availability, and prices can change. The amount shown at checkout is the amount that applies to that booking.</li>
        <li>Photos and descriptions are provided to help you decide whether to book a viewing. A viewing is the way to check a home for yourself.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">4. Inspection fee</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>The inspection fee is non-refundable. It covers arranging and conducting your viewing.</li>
        <li>Paying the inspection fee does not reserve a home, allocate it to you, or transfer any tenancy rights.</li>
        <li>The home stays subject to availability until the required securing payment has been received and confirmed by the agency under its stated terms.</li>
        <li>If a home becomes unavailable after you generate an authority to pay, the agency will handle that case with you directly. See the Inspection policy for the detail.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">5. Authority to pay, not payments</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>There is no online payment on HOUZQORA. At checkout you fill a form and generate an authority to pay for the inspection fee.</li>
        <li>The fee is read from our database at checkout, never from your browser.</li>
        <li>Send the authority to pay to an agent on WhatsApp. The agency arranges the viewing and confirms the fee with you directly.</li>
        <li>A booking is not marked paid on HOUZQORA. The agency confirms payment under its own terms.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">6. Viewings</h2>
      <p className="mt-2 text-muted">After generating your authority to pay, pick a viewing slot in Bookings and follow the instructions shown there. If you cannot attend, tell us as soon as you can through the agents page. The inspection fee is still non-refundable, as set out in section 4.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">7. Inspection discount</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>New users get 30 percent off inspections for 7 days from the first time they see the offer while signed in.</li>
        <li>The discount is linked to your account, so it follows you across devices.</li>
        <li>Claim the discount to use it. The discounted fee is rounded to the nearest euro.</li>
        <li>When the 7 days end, fees go back to full price. Hiding the banner for one session does not cancel the offer.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">8. Securing a home</h2>
      <p className="mt-2 text-muted">The securing amount is shown on each home and at checkout. It is separate from the inspection fee. Paying it is a separate step, under the agency terms shown at that time. Paying the inspection fee alone does not secure a home.</p>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">9. Acceptable use and liability</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Do not use HOUZQORA to break the law, to mislead other people, or to collect other users data.</li>
        <li>We work to keep the site available and accurate, but we cannot promise it will never be down or free of errors.</li>
        <li>Nothing in these terms limits rights you have under Dutch law that cannot be limited.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold text-velvet">10. Changes and governing law</h2>
      <p className="mt-2 text-muted">We can update these terms when the service changes. The date at the top shows the latest version. If a change affects you in an important way, we will tell you when you next sign in. These terms are governed by the law of the Netherlands.</p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-5">
        <p className="font-bold text-velvet">More legal pages</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy-policy" className="text-strawberry">Privacy Policy</Link>
          <Link href="/inspection-policy" className="text-strawberry">Inspection policy</Link>
          <Link href="/cookie-policy" className="text-strawberry">Cookie Policy</Link>
          <Link href="/cookie-settings" className="text-strawberry">Cookie settings</Link>
        </div>
      </div>
    </div>
  );
}
