export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gold-soft text-slate-900">
      <header className="sticky top-0 z-40 border-b hairline bg-white/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">P</div>
            <span className="font-semibold tracking-tight text-slate-900">Proposphere</span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Assume user is logged in for now - will be handled by auth */}
            <a href="/studio/new" className="btn-primary rounded-lg text-sm font-medium px-4 py-2">Start a new proposal</a>
            <a href="/login" className="text-slate-600 hover:text-slate-900 text-sm px-3 py-2 transition-colors">Sign in</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08] max-w-4xl mx-auto">
          Understand the opportunity.<br />
          <span className="text-gold">Build a stronger proposal.</span><br />
          Win the client.
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
          Proposphere behaves like a thoughtful business development consultant — profiling your business, questioning the opportunity, drafting the proposal, then tracking the work and the money it brings in.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
          <a href="/studio/new" className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">
            Start a new proposal
          </a>
          <a href="/login" className="btn-ghost rounded-xl px-6 py-3 text-sm font-medium text-slate-200">
            Sign in
          </a>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-14">
          <div className="glass rounded-2xl px-4 py-5">
            <div className="text-2xl font-bold text-gold">30+</div>
            <div className="text-slate-500 text-xs">proposal sections</div>
          </div>
          <div className="glass rounded-2xl px-4 py-5">
            <div className="text-2xl font-bold text-gold">0</div>
            <div className="text-slate-500 text-xs">invented facts, ever</div>
          </div>
          <div className="glass rounded-2xl px-4 py-5">
            <div className="text-2xl font-bold text-gold">100%</div>
            <div className="text-slate-500 text-xs">editable AI output</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          <div className="glass glass-hover rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-slate-200/70 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.72 0l-.7.7M6.34 17.66l-.7.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-semibold">AI Proposal Studio</h3>
            <p className="text-slate-500 text-sm mt-2">Describe the opportunity. The AI analyses it, asks the questions that matter for scoping and pricing, and drafts a persuasive multi-page proposal you fully control.</p>
          </div>
          <div className="glass glass-hover rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-slate-200/70 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m4 10V9m4 8v-4M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-semibold">Package comparison tables</h3>
            <p className="text-slate-500 text-sm mt-2">Every proposal includes a Basic / Professional / Enterprise comparison built from your real packages — never invented features or prices.</p>
          </div>
          <div className="glass glass-hover rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-slate-200/70 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-semibold">Secure acceptance links</h3>
            <p className="text-slate-500 text-sm mt-2">Share proposals with expiring, revocable acceptance tokens. Clients review, accept with a signature, and the accepted version is locked forever.</p>
          </div>
          <div className="glass glass-hover rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-slate-200/70 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4m5 7V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12l3-2 3 2 3-2 3 2z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-semibold">Quotations & receipts</h3>
            <p className="text-slate-500 text-sm mt-2">Decimal-safe pricing with discounts and tax, calculated server-side. Record a payment and a branded receipt is generated with the outstanding balance.</p>
          </div>
          <div className="glass glass-hover rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-slate-200/70 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-semibold">Client CRM & pipeline</h3>
            <p className="text-slate-500 text-sm mt-2">Track every lead from first contact to won business — interactions, follow-up reminders, pipeline stages and client lifetime value.</p>
          </div>
          <div className="glass glass-hover rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-slate-200/70 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4m4 8V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-semibold">Projects & honest analytics</h3>
            <p className="text-slate-500 text-sm mt-2">Convert accepted proposals into projects with weighted task progress. Dashboards show money actually received — never vanity numbers.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <h2 className="text-3xl font-bold text-slate-900 text-center tracking-tight">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          <div>
            <span className="text-7xl font-bold text-slate-900/[0.04] select-none">01</span>
            <h3 className="text-slate-900 font-semibold mt-2">Profile your business</h3>
            <p className="text-slate-500 text-sm mt-2">Add your services, packages, branding and portfolio evidence once — reused across every document.</p>
          </div>
          <div>
            <span className="text-7xl font-bold text-slate-900/[0.04] select-none">02</span>
            <h3 className="text-slate-900 font-semibold mt-2">Run discovery with AI</h3>
            <p className="text-slate-500 text-sm mt-2">The strategist analyses the opportunity, asks adaptive questions and recommends scope — you approve every item.</p>
          </div>
          <div>
            <span className="text-7xl font-bold text-slate-900/[0.04] select-none">03</span>
            <h3 className="text-slate-900 font-semibold mt-2">Send & get it signed</h3>
            <p className="text-slate-500 text-sm mt-2">Generate the proposal, share a secure link, and watch acceptance flow straight into projects, quotations and payments.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-5 py-20 text-center">
        <div className="glass rounded-3xl px-8 py-14 relative overflow-hidden">
          <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-r from-blue-500/15 via-violet-500/15 to-cyan-500/15 blur-3xl" />
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight relative">Track the work. Manage the money.</h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto relative">Set up your business profile in minutes and send your first AI-assisted proposal today.</p>
          <a href="/studio/new" className="btn-primary relative inline-block rounded-xl px-8 py-3.5 text-sm font-semibold mt-8">Open your dashboard</a>
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