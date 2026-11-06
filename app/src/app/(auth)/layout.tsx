import Link from "next/link";

const POINTS = [
  { title: "AI discovery that asks the right questions", body: "Adaptive questions based on the actual opportunity — not a generic form." },
  { title: "Proposals that win", body: "Multi-page documents with package comparison tables built from your real catalogue." },
  { title: "The full commercial cycle", body: "Quotations, receipts, CRM, projects and honest financial analytics." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ambient min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 border-r hairline bg-white/60 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">P</div>
          <span className="text-slate-900 font-semibold tracking-tight text-lg">Proposphere</span>
        </Link>
        <div className="relative space-y-8 max-w-md">
          <h2 className="text-3xl font-bold text-slate-900 leading-snug">
            Understand the opportunity.<br />
            <span className="gradient-text">Build a stronger proposal.</span><br />
            Win the client.
          </h2>
          <div className="space-y-5">
            {POINTS.map((p) => (
              <div key={p.title} className="flex gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-medium">{p.title}</div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">{p.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-slate-400 text-xs">Track the work. Manage the money. Understand your business.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold">P</div>
            <span className="text-slate-900 font-semibold text-lg">Proposphere</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
