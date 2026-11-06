import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "AI Proposal Studio",
    body: "Describe the opportunity. The AI analyses it, asks the questions that matter for scoping and pricing, and drafts a persuasive multi-page proposal you fully control.",
    icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.72 0l-.7.7M6.34 17.66l-.7.7M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    title: "Package comparison tables",
    body: "Every proposal includes a Basic / Professional / Enterprise comparison built from your real packages — never invented features or prices.",
    icon: "M9 17V7m4 10V9m4 8v-4M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z",
  },
  {
    title: "Secure acceptance links",
    body: "Share proposals with expiring, revocable acceptance tokens. Clients review, accept with a signature, and the accepted version is locked forever.",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Quotations & receipts",
    body: "Decimal-safe pricing with discounts and tax, calculated server-side. Record a payment and a branded receipt is generated with the outstanding balance.",
    icon: "M9 14l2 2 4-4m5 7V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12l3-2 3 2 3-2 3 2z",
  },
  {
    title: "Client CRM & pipeline",
    body: "Track every lead from first contact to won business — interactions, follow-up reminders, pipeline stages and client lifetime value.",
    icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3",
  },
  {
    title: "Projects & honest analytics",
    body: "Convert accepted proposals into projects with weighted task progress. Dashboards show money actually received — never vanity numbers.",
    icon: "M7 12l3-3 3 3 4-4m4 8V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z",
  },
];

const STEPS = [
  { n: "01", title: "Profile your business", body: "Add your services, packages, branding and portfolio evidence once — reused across every document." },
  { n: "02", title: "Run discovery with AI", body: "The strategist analyses the opportunity, asks adaptive questions and recommends scope — you approve every item." },
  { n: "03", title: "Send & get it signed", body: "Generate the proposal, share a secure link, and watch acceptance flow straight into projects, quotations and payments." },
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="ambient min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b hairline bg-[#05070d]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">P</div>
            <span className="text-white font-semibold tracking-tight">Proposphere</span>
          </div>
          <div className="flex items-center gap-2.5">
            <a href="#features" className="hidden sm:block text-slate-400 hover:text-white text-sm px-3 py-2 transition-colors">Features</a>
            <a href="#how" className="hidden sm:block text-slate-400 hover:text-white text-sm px-3 py-2 transition-colors">How it works</a>
            {user ? (
              <Link href="/dashboard" className="btn-primary rounded-lg text-sm font-medium px-4 py-2">Open dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-slate-300 hover:text-white text-sm px-3 py-2 transition-colors">Sign in</Link>
                <Link href="/register" className="btn-primary rounded-lg text-sm font-medium px-4 py-2">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
        <div className="rise inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-slate-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          From first conversation to final payment
        </div>
        <h1 className="rise rise-1 text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
          Understand the opportunity.<br />
          Build a <span className="gradient-text">stronger proposal</span>.<br />
          Win the client.
        </h1>
        <p className="rise rise-2 text-slate-400 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
          Proposphere behaves like a thoughtful business development consultant — profiling your business, questioning the opportunity, drafting the proposal, then tracking the work and the money it brings in.
        </p>
        <div className="rise rise-3 flex flex-wrap items-center justify-center gap-3 mt-9">
          <Link href={user ? "/studio/new" : "/register"} className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">
            {user ? "Start a new proposal" : "Create your workspace — free"}
          </Link>
          <Link href={user ? "/dashboard" : "/login"} className="btn-ghost rounded-xl px-6 py-3 text-sm font-medium text-slate-200">
            {user ? "Go to dashboard" : "Sign in"}
          </Link>
        </div>
        <div className="rise rise-4 grid grid-cols-3 gap-4 max-w-xl mx-auto mt-14">
          {[
            { v: "30+", l: "proposal sections" },
            { v: "0", l: "invented facts, ever" },
            { v: "100%", l: "editable AI output" },
          ].map((s) => (
            <div key={s.l} className="glass rounded-2xl px-4 py-5">
              <div className="text-2xl font-bold gradient-text">{s.v}</div>
              <div className="text-slate-500 text-xs mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-bold text-white text-center tracking-tight">Everything after &ldquo;yes&rdquo; depends on what happens before it</h2>
        <p className="text-slate-400 text-center mt-3 max-w-2xl mx-auto">One platform for the whole commercial cycle — not just a document generator.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass glass-hover rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <h3 className="text-white font-semibold">{f.title}</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-bold text-white text-center tracking-tight">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-6 relative overflow-hidden">
              <span className="absolute -top-3 -right-1 text-7xl font-bold text-white/[0.04] select-none">{s.n}</span>
              <div className="text-blue-300 text-xs font-semibold tracking-widest">{s.n}</div>
              <h3 className="text-white font-semibold mt-2">{s.title}</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Principles strip */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="glass rounded-2xl p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            ["AI assists, you decide", "Recommendations need your approval — scope, price, wording."],
            ["No fabricated credibility", "The AI never invents clients, awards or results."],
            ["Financial accuracy first", "Decimal-safe math, computed on the server."],
            ["Privacy by design", "Every record is isolated to your workspace."],
          ].map(([t, b]) => (
            <div key={t}>
              <div className="flex items-center gap-2 text-white text-sm font-semibold">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {t}
              </div>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-5 py-20 text-center">
        <div className="glass rounded-3xl px-8 py-14 relative overflow-hidden">
          <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-cyan-500/20 blur-3xl" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight relative">Track the work. Manage the money.</h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto relative">Set up your business profile in minutes and send your first AI-assisted proposal today.</p>
          <Link href={user ? "/dashboard" : "/register"} className="btn-primary relative inline-block rounded-xl px-8 py-3.5 text-sm font-semibold mt-8">
            {user ? "Open your dashboard" : "Get started free"}
          </Link>
        </div>
      </section>

      <footer className="border-t hairline">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-[10px]">P</div>
            Proposphere
          </div>
          <span>Understand the opportunity. Build a stronger proposal. Win the client.</span>
        </div>
      </footer>
    </div>
  );
}
