"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import type { ReactNode } from "react";

// Replays a subtle entrance animation on every route change.
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
}

// Reveals children when they scroll into view.
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={(el) => {
        if (!el || (el as HTMLElement & { __observed?: boolean }).__observed) return;
        (el as HTMLElement & { __observed?: boolean }).__observed = true;
        const io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                setTimeout(() => el.classList.add("revealed"), delay);
                io.disconnect();
              }
            }
          },
          { threshold: 0.12 }
        );
        io.observe(el);
      }}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}