import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proposal AI",
  description: "AI-powered proposal generation and business management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
