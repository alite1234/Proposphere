"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: string; highlight?: boolean };

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

  const links = (
    <nav className="space-y-0.5 flex-1 overflow-y-auto">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active ? "bg-blue-600/15 text-blue-300 font-medium" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            } ${item.highlight && !active ? "text-blue-400" : ""}`}
          >
            <svg className="w-4.5 h-4.5 w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span className="truncate">{item.label}</span>
            {item.href === "/notifications" && unreadCount > 0 && (
              <span className="ml-auto text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-slate-800 pt-3 space-y-2">
      {!aiReady && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-[11px] text-amber-300">
          AI not configured — add GEMINI_API_KEY, GROQ_API_KEY or CEREBRAS_API_KEY to .env
        </div>
      )}
      <div className="flex items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-xs font-medium truncate">{userName}</div>
          <div className="text-slate-500 text-[11px] truncate">{businessName}</div>
        </div>
        <form action={logoutAction}>
          <button title="Sign out" className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="text-white font-semibold text-sm">Proposal AI</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-300 p-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-slate-950/95 pt-16 px-3 pb-4 flex flex-col" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col h-full">
            {links}
            {footer}
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-slate-900 border-r border-slate-800 px-3 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">P</div>
          <span className="text-white font-semibold">Proposal AI</span>
        </Link>
        {links}
        {footer}
      </aside>
      <div className="h-14 lg:hidden" />
    </>
  );
}
