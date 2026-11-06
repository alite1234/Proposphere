import Link from "next/link";
import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { discoverySessions, opportunities } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { analyzeAction, generateProposalAction } from "@/app/actions/studio";
import { StudioQuestions, RecommendationCards } from "@/components/StudioFlow";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const input = "field";

function Stepper({ current, done }: { current: number; done: number[] }) {
  const steps = ["Analysis", "Discovery", "Recommendations", "Generate"];
  return (
    <div className="glass rounded-2xl px-5 py-4">
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const n = i + 1;
          const isDone = done.includes(n);
          const isCurrent = n === current;
          return (
            <li key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
                    isDone
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : isCurrent
                        ? "bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/30 scale-110"
                        : "bg-white/[0.04] text-slate-500 border border-white/10"
                  }`}
                >
                  {isDone ? "✓" : n}
                </span>
                <span className={`text-xs hidden sm:block ${isCurrent ? "text-white font-medium" : isDone ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
              </div>
              {n < steps.length && <div className={`flex-1 h-px mx-3 ${isDone ? "bg-emerald-500/40" : "bg-white/10"}`} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default async function StudioSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  const { id } = await params;
  const [session] = await db.select().from(discoverySessions).where(and(eq(discoverySessions.id, id), eq(discoverySessions.businessId, t.businessId))).limit(1);
  if (!session) notFound();
  const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, session.opportunityId)).limit(1);
  const analysis = (session.analysis ?? {}) as { summary?: string; likelyNeeds?: string[]; unclearOrMissing?: string[]; risksAndAssumptions?: string[]; likelyConcerns?: string[]; infoNeededToPrice?: string[] };

  const analysisDone = session.status !== "draft";
  const questionsDone = Object.keys(session.answers).length > 0;
  const recsDone = session.recommendations.some((r) => r.decision !== "pending");
  const readyToGenerate = session.status !== "draft";

  const current = !analysisDone ? 1 : !questionsDone ? 2 : !recsDone ? 3 : 4;
  const doneSteps = [analysisDone && 1, questionsDone && 2, recsDone && 3].filter(Boolean) as number[];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/studio" className="text-slate-500 text-xs hover:text-slate-300">← Back to Studio</Link>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1">{opp?.title}</h1>
        <p className="text-slate-400 text-sm">{opp?.clientName} · {session.status.replace(/_/g, " ")}</p>
      </div>

      <Stepper current={current} done={doneSteps} />

      {/* Step 1: analysis */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-white font-semibold text-sm">1. AI discovery & analysis</h2>
          {session.status === "draft" && (
            <form action={analyzeAction}>
              <input type="hidden" name="sessionId" value={id} />
              <SubmitButton label="Run AI analysis" pending="Analysing opportunity…" className="btn-primary rounded-xl text-white text-xs font-medium px-4 py-2" />
            </form>
          )}
        </div>
        {!session.analysis && session.status === "draft" && (
          <p className="text-slate-500 text-sm mt-2">The AI will combine your business profile, catalogue, portfolio evidence and this opportunity to identify needs, gaps, risks and questions worth asking.</p>
        )}
        {session.analysis && (
          <div className="mt-3 space-y-3 text-sm">
            {analysis.summary && <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>}
            {analysis.likelyNeeds && analysis.likelyNeeds.length > 0 && (
              <Block title="Likely needs (based on supplied evidence)" items={analysis.likelyNeeds} color="text-emerald-300" />
            )}
            {analysis.unclearOrMissing && analysis.unclearOrMissing.length > 0 && (
              <Block title="Unclear or missing" items={analysis.unclearOrMissing} color="text-amber-300" />
            )}
            {analysis.risksAndAssumptions && analysis.risksAndAssumptions.length > 0 && (
              <Block title="Risks & assumptions" items={analysis.risksAndAssumptions} color="text-red-300" />
            )}
            {analysis.likelyConcerns && analysis.likelyConcerns.length > 0 && (
              <Block title="Likely client concerns" items={analysis.likelyConcerns} color="text-slate-300" />
            )}
            {analysis.infoNeededToPrice && analysis.infoNeededToPrice.length > 0 && (
              <Block title="Info needed to price accurately" items={analysis.infoNeededToPrice} color="text-blue-300" />
            )}
          </div>
        )}
      </section>

      {/* Step 2: adaptive questions */}
      {session.status !== "draft" && (
        <section className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm">2. Adaptive discovery questions</h2>
          <p className="text-slate-500 text-xs mt-0.5 mb-4">Generated for this specific opportunity — not a generic form.</p>
          {session.questions.length > 0 && (
            <StudioQuestions sessionId={id} questions={session.questions} answers={session.answers} />
          )}
        </section>
      )}

      {/* Step 3: recommendations */}
      {session.recommendations.length > 0 && (
        <section className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm">3. Recommendation cards</h2>
          <p className="text-slate-500 text-xs mt-0.5 mb-4">You approve every addition that changes scope, price or delivery time.</p>
          <RecommendationCards sessionId={id} recommendations={session.recommendations} />
        </section>
      )}

      {/* Step 4: readiness + generate */}
      {readyToGenerate && (
        <section className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm">4. Readiness check</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-slate-400">Answered questions</span><span className="text-white">{Object.keys(session.answers).length} / {session.questions.length}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Approved recommendations</span><span className="text-white">{session.recommendations.filter((r) => r.decision === "include").length} included · {session.recommendations.filter((r) => r.decision === "ask_client").length} to ask client</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Pricing</span><span className="text-white">Calculated by the app from your catalogue — never by the AI</span></li>
          </ul>
          {Object.keys(session.answers).length < session.questions.length && (
            <p className="text-amber-400 text-xs mt-3">⚠ Some questions are unanswered. You can proceed, but missing details may affect the proposal — gaps will be marked as assumptions.</p>
          )}
          <form action={generateProposalAction} className="flex items-end gap-3 mt-5">
            <input type="hidden" name="sessionId" value={id} />
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Document complexity</label>
              <select name="complexity" className={input}>
                <option value="simple">Lean — 7 essential sections</option>
                <option value="standard" selected>Standard — 15 sections (recommended)</option>
                <option value="full">Comprehensive — all 30 sections</option>
              </select>
            </div>
            <SubmitButton label="Generate proposal draft" pending="Writing your proposal…" className="btn-primary rounded-xl text-white text-sm font-medium px-5 py-2.5" />
          </form>
        </section>
      )}
    </div>
  );
}

function Block({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <div className={`text-xs font-medium ${color}`}>{title}</div>
      <ul className="list-disc list-inside text-slate-400 text-xs mt-1 space-y-0.5">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}
