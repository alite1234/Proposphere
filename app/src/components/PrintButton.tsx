"use client";

export default function PrintButton({ label = "Print / PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 hover:bg-slate-700"
    >
      {label}
    </button>
  );
}
