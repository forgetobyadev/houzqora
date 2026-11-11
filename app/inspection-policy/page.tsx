import Link from 'next/link';

export default function InspectionPolicy() {
  return (
    <div className="max-w-3xl">
      <h1 className="mt-4 text-3xl font-extrabold text-velvet">Inspection and refund policy</h1>
      <p className="mt-3 text-muted">Last updated: 9 November 2026.</p>
      <p className="mt-3 text-muted">Inspection fees are non-refundable. The fee covers arranging and conducting your viewing.</p>
      <p className="mt-3 text-muted">Generating a receipt for the inspection fee does not reserve, allocate, or transfer any tenancy rights over the property. The property remains subject to availability until the required securing payment has been received and confirmed by the agency under its stated terms.</p>
      <p className="mt-3 text-muted">If a home becomes unavailable after you generate a receipt, the agency will handle that case by manual resolution and contact you directly. If that happens, the agency will handle the refund case directly with you.</p>
      <div className="mt-8 rounded-2xl border border-line bg-white p-5">
        <p className="font-bold text-velvet">More legal pages</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy-policy" className="text-strawberry">Privacy Policy</Link>
          <Link href="/terms" className="text-strawberry">Terms and conditions</Link>
          <Link href="/cookie-policy" className="text-strawberry">Cookie Policy</Link>
          <Link href="/cookie-settings" className="text-strawberry">Cookie settings</Link>
        </div>
      </div>
    </div>
  );
}
