import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, generateObject, type LanguageModel } from "ai";
import { z } from "zod";

// Provider abstraction: Gemini, Groq, Cerebras behind one adapter (spec §20).
// The rest of the app only ever calls askText/askJson — never a provider directly.

export type ProviderName = "gemini" | "groq" | "cerebras";

type Config = { name: ProviderName; model: string; languageModel: LanguageModel } | null;

function getConfig(): Config {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return { name: "gemini", model: process.env.GEMINI_MODEL || "gemini-2.0-flash", languageModel: google(process.env.GEMINI_MODEL || "gemini-2.0-flash") };
  }
  if (groqKey) {
    const groq = createOpenAICompatible({ name: "groq", baseURL: "https://api.groq.com/openai/v1", apiKey: groqKey });
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    return { name: "groq", model, languageModel: groq.chatModel(model) };
  }
  if (cerebrasKey) {
    const cerebras = createOpenAICompatible({ name: "cerebras", baseURL: "https://api.cerebras.ai/v1", apiKey: cerebrasKey });
    const model = process.env.CEREBRAS_MODEL || "llama-3.3-70b";
    return { name: "cerebras", model, languageModel: cerebras.chatModel(model) };
  }
  return null;
}

export function aiAvailable(): boolean {
  return getConfig() !== null;
}

export async function askText(system: string, prompt: string): Promise<string> {
  const cfg = getConfig();
  if (!cfg) throw new Error("NO_AI_PROVIDER: set GEMINI_API_KEY, GROQ_API_KEY or CEREBRAS_API_KEY in .env");
  const { text } = await generateText({ model: cfg.languageModel, system, prompt, maxOutputTokens: 4000 });
  return text;
}

export async function askJson<T>(system: string, prompt: string, schema: z.ZodType<T>): Promise<T> {
  const cfg = getConfig();
  if (!cfg) throw new Error("NO_AI_PROVIDER: set GEMINI_API_KEY, GROQ_API_KEY or CEREBRAS_API_KEY in .env");
  const { object } = await generateObject({ model: cfg.languageModel, schema, system, prompt });
  return object;
}

export function activeProviderName(): ProviderName | "none" {
  return getConfig()?.name ?? "none";
}
