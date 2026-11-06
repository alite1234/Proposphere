import { loginAction } from "@/app/actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
      <h1 className="text-white text-xl font-semibold mb-1">Welcome back</h1>
      <p className="text-slate-400 text-sm mb-6">Sign in to your workspace</p>
      {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3">{error}</div>}
      <form action={loginAction} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">Email</label>
          <input name="email" type="email" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@business.com" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">Password</label>
          <input name="password" type="password" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
        </div>
        <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 text-sm transition-colors">Sign in</button>
      </form>
      <p className="text-slate-400 text-sm text-center mt-6">
        No account yet? <a href="/register" className="text-blue-400 hover:text-blue-300">Create one</a>
      </p>
    </div>
  );
}
