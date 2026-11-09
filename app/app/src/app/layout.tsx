import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proposphere — Win clients, manage delivery, understand your business",
  description:
    "AI-powered proposal generation and business management: proposals, quotations, receipts, CRM, projects and analytics in one platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-gold-soft text-slate-900">
      <body className="antialiased">{children}</body>
    </html>
  );
}