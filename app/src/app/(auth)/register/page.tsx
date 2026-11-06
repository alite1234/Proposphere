import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { registerAction } from "@/app/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/40 rise">
      <h1 className="text-white text-2xl font-bold tracking-tight">Create your workspace</h1>
      <p className="text-slate-400 text-sm mt-1.5 mb-7">Set up your business in minutes. No credit card needed.</p>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      <form action={registerAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Your name</label>
            <input name="name" required autoComplete="name" className="field" placeholder="Ada Obi" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Business name</label>
            <input name="businessName" autoComplete="organization" className="field" placeholder="Acme Studio" />
          </div>
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">Email</label>
          <input name="email" type="email" required autoComplete="email" className="field" placeholder="you@business.com" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-300 text-sm">Password</label>
            <span className="text-slate-600 text-xs">Min 8 characters</span>
          </div>
          <PasswordInput name="password" minLength={8} />
        </div>
        <SubmitButton label="Create account" pending="Creating workspace…" className="btn-primary w-full rounded-xl py-3 text-sm font-semibold mt-2" />
        <p className="text-slate-600 text-[11px] text-center leading-relaxed">
          By creating an account you agree to keep your business and client data accurate. AI output is always editable before anything is sent.
        </p>
      </form>

      <p className="text-slate-400 text-sm text-center mt-6">
        Already registered?{" "}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
