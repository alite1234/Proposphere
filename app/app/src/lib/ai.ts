// Provider abstraction: Gemini, Groq, Cerebras behind one adapter
// The rest of the app only ever calls askText/askJson — never a provider directly.

export type ProviderName = "gemini" | "groq" | "cerebras";

type Config = { name: ProviderName; model: string; languageModel: any } | null;

function getConfig(): Config {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  if (geminiKey) {
    return { name: "gemini", model: "gemini-2.5-flash", languageModel: "google" };
  }
  if (groqKey) {
    return { name: "groq", model: "llama-3.3-70b-versatile", languageModel: "groq" };
  }
  if (cerebrasKey) {
    return { name: "cerebras", model: "llama-3.3-70b", languageModel: "cerebras" };
  }
  return null;
}

export function aiAvailable(): boolean {
  return getConfig() !== null;
}

export function activeProviderName(): ProviderName | "none" {
  return getConfig()?.name ?? "none";
}