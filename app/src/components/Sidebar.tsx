"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: string; group?: string; highlight?: boolean };

const GROUP_LABELS: Record<string, string> = {
  work: "Workspace",
  sell: "Commercial",
  manage: "Manage",
};

export default function Sidebar({
  nav,
  businessName,
  userName,
  unreadCount,
  aiReady,
  logoutAction,
}: {
  nav: NavItem[];
  businessName: string;
  userName: string;
  unreadCount: number;
  aiReady: boolean;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups: string[] = [];
  for (const item of nav) {
    const g = item.group ?? "work";
    if (!groups.includes(g)) groups.push(g);
  }

  const links = (
    <nav className="flex-1 overflow-y-auto space-y-5 pr-1">
      {groups.map((g) => (
        <div key={g}>
          <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-slate-600 uppercase">{GROUP_LABELS[g] ?? g}</div>
          <div className="space-y-0.5">
            {nav
              .filter((item) => (item.group ?? "work") === g)
              .map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all ${
                      active
                        ? "bg-gradient-to-r from-blue-500/15 to-violet-500/10 text-white font-medium border border-white/10 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <svg
                      className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? "text-blue-300" : "text-slate-500 group-hover:text-slate-300"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.6}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="truncate">{item.label}</span>
                    {item.highlight && !active && (
                      <span className="ml-auto text-[9px] font-semibold tracking-wider bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent uppercase">AI</span>
                    )}
                    {item.href === "/notifications" && unreadCount > 0 && (
                      <span className="ml-auto text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-medium">{unreadCount}</span>
                    )}
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t hairline pt-3 space-y-2.5">
      {!aiReady && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-[11px] text-amber-300/90 leading-relaxed">
          AI not configured — add <span className="font-mono">GEMINI_API_KEY</span>, <span className="font-mono">GROQ_API_KEY</span> or <span className="font-mono">CEREBRAS_API_KEY</span> to enable the AI Studio.
        </div>
      )}
      <div className="flex items-center gap-2.5 px-1.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-md shadow-blue-500/20">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-xs font-medium truncate">{userName}</div>
          <div className="text-slate-500 text-[11px] truncate">{businessName}</div>
        </div>
        <form action={logoutAction}>
          <button title="Sign out" className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-6 shrink-0">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">P</div>
      <span className="text-white font-semibold tracking-tight">Proposphere</span>
    </Link>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[#05070d]/80 backdrop-blur-xl border-b hairline px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="text-white font-semibold text-sm">Proposphere</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-300 p-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-[#05070d]/97 pt-16 px-3 pb-4 flex flex-col" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col h-full">
            {links}
            {footer}
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-[#070a12]/80 backdrop-blur-xl border-r hairline px-3 py-4">
        {brand}
        {links}
        {footer}
      </aside>
      <div className="h-14 lg:hidden" />
    </>
  );
}
