import { registerAction } from "@/app/actions/auth";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
      <h1 className="text-white text-xl font-semibold mb-1">Create your account</h1>
      <p className="text-slate-400 text-sm mb-6">Set up your business workspace in minutes</p>
      {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3">{error}</div>}
      <form action={registerAction} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">Your name</label>
          <input name="name" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ada Obi" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">Business name</label>
          <input name="businessName" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Acme Studio" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">Email</label>
          <input name="email" type="email" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@business.com" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">Password (min 8 characters)</label>
          <input name="password" type="password" required minLength={8} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
        </div>
        <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 text-sm transition-colors">Create account</button>
      </form>
      <p className="text-slate-400 text-sm text-center mt-6">
        Already registered? <a href="/login" className="text-blue-400 hover:text-blue-300">Sign in</a>
      </p>
    </div>
  );
}
