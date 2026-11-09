"use client";

import { useState } from "react";

export default function SubmitButton({ label, pending }: { label: string; pending?: string }) {
  const [isPending, setIsPending] = useState(false);
  const text = isPending ? (pending || "Processing…") : label;
  return (
    <button
      type="submit"
      disabled={isPending}
      className="rounded-lg px-6 py-2.5 text-sm font-medium"
    >
      {text}
    </button>
  );
}