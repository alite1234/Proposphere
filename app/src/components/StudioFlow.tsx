"use client";

import { useActionState } from "react";
import { answerQuestionsAction, decideRecommendationAction } from "@/app/actions/studio";
import type { ActionState } from "@/lib/action-state";
import SubmitButton from "@/components/SubmitButton";

export type StudioQuestion = { id: string; question: string; why: string };

export function StudioQuestions({ sessionId, questions, answers }: { sessionId: string; questions: StudioQuestion[]; answers: Record<string, string> }) {
  const [state, formAction] = useActionState<ActionState, FormData>(answerQuestionsAction, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      {questions.map((q, i) => (
        <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <label className="block text-slate-100 text-sm font-medium">{q.question}</label>
          <div className="text-slate-500 text-xs mt-0.5 mb-2">{q.why}</div>
          <textarea name={`q_${i}`} rows={2} defaultValue={answers[q.question] ?? ""} className="field" placeholder="Your answer…" />
        </div>
      ))}
      {state?.error && <div className="rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm px-4 py-3">{state.error}</div>}
      <div className="flex items-center gap-3">
        <SubmitButton label="Save answers & get recommendations" pending="Analysing your answers…" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-medium" />
        <span className="text-slate-500 text-xs">The AI recommends; you approve every item.</span>
      </div>
    </form>
  );
}

const LEVEL_STYLES: Record<string, string> = {
  essential: "bg-red-500/15 text-red-300 border-red-500/30",
  recommended: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  optional: "bg-white/[0.05] text-slate-300 border-white/10",
};

export type RecommendationCard = {
  id: string;
  name: string;
  what: string;
  why: string;
  problem: string;
  level: string;
  estimatedCost?: string;
  timelineImpact?: string;
  decision: string;
};

export function RecommendationCards({ sessionId, recommendations }: { sessionId: string; recommendations: RecommendationCard[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(decideRecommendationAction, null);
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((r) => (
          <div key={r.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="text-white text-sm font-medium">{r.name}</div>
              <span className={`text-[10px] rounded px-1.5 py-0.5 border ${LEVEL_STYLES[r.level] ?? ""}`}>{r.level}</span>
            </div>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{r.what}</p>
            <p className="text-slate-500 text-xs mt-1.5">Why: {r.why}</p>
            <p className="text-slate-500 text-xs">Addresses: {r.problem}</p>
            <div className="flex gap-3 mt-1.5 text-xs">
              {r.estimatedCost && <span className="text-emerald-400">Est. cost: {r.estimatedCost}</span>}
              {r.timelineImpact && <span className="text-slate-400">Timeline: {r.timelineImpact}</span>}
            </div>
            <form action={formAction} className="flex gap-1.5 mt-3">
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="recId" value={r.id} />
              {(["include", "exclude", "ask_client"] as const).map((dec) => (
                <button
                  key={dec}
                  name="decision"
                  value={dec}
                  className={`text-[11px] rounded-lg px-2.5 py-1.5 border transition-all ${
                    r.decision === dec
                      ? dec === "include"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25"
                        : dec === "exclude"
                          ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/25"
                          : "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/25"
                      : "border-white/10 text-slate-400 hover:text-white hover:border-white/25"
                  }`}
                >
                  {dec === "include" ? "Include" : dec === "exclude" ? "Exclude" : "Ask client"}
                </button>
              ))}
            </form>
          </div>
        ))}
      </div>
      {state?.error && <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm px-4 py-3">{state.error}</div>}
    </div>
  );
}
