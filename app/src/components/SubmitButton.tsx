"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ label, pending, className = "" }: { label: string; pending: string; className?: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <button type="submit" disabled={isPending} className={`${className} disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}>
      {isPending && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {isPending ? pending : label}
    </button>
  );
}
