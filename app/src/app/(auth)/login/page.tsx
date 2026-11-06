import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loginAction } from "@/app/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(next || "/dashboard");

  return (
    <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/40 rise">
      <h1 className="text-white text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="text-slate-400 text-sm mt-1.5 mb-7">Sign in to your workspace to continue.</p>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">Email</label>
          <input name="email" type="email" required autoComplete="email" className="field" placeholder="you@business.com" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-300 text-sm">Password</label>
            <span className="text-slate-600 text-xs">Min 8 characters</span>
          </div>
          <PasswordInput name="password" />
        </div>
        <SubmitButton label="Sign in" pending="Signing in…" className="btn-primary w-full rounded-xl py-3 text-sm font-semibold mt-2" />
      </form>

      <p className="text-slate-400 text-sm text-center mt-7">
        No account yet?{" "}
        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
          Create one free
        </Link>
      </p>
    </div>
  );
}
