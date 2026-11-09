"use server";

import { aiAvailable, activeProviderName } from "@/lib/ai";

export async function GET() {
  return new Response(
    JSON.stringify({
      aiAvailable: aiAvailable(),
      provider: activeProviderName(),
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }
  );
}