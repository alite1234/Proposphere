import Link from "next/link";
import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { discoverySessions, opportunities } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { analyzeAction, answerQuestionsAction, decideRecommendationAction, generateProposalAction } from "@/app/actions/studio";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const LEVEL_STYLES: Record<string, string> = {
  essential: "bg-red-500/15 text-red-300 border-red-500/30",
  recommended: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  optional: "bg-slate-700/40 text-slate-300 border-slate-600/40",
};

export default async function StudioSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  const { id } = await params;
  const [session] = await db.select().from(discoverySessions).where(and(eq(discoverySessions.id, id), eq(discoverySessions.businessId, t.businessId))).limit(1);
  if (!session) notFound();
  const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, session.opportunityId)).limit(1);
  const analysis = (session.analysis ?? {}) as { summary?: string; likelyNeeds?: string[]; unclearOrMissing?: string[]; risksAndAssumptions?: string[]; likelyConcerns?: string[]; infoNeededToPrice?: string[] };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/studio" className="text-slate-500 text-xs hover:text-slate-300">← Back</Link>
        <h1 className="text-2xl font-bold text-white mt-1">{opp?.title}</h1>
        <p className="text-slate-400 text-sm">{opp?.clientName} · session status: {session.status}</p>
      </div>

      {/* Step 1: analysis */}
      <section className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-white font-semibold text-sm">1. AI discovery & analysis</h2>
          {session.status === "draft" && (
            <form action={analyzeAction}>
              <input type="hidden" name="sessionId" value={id} />
              <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2">Run AI analysis</button>
            </form>
          )}
        </div>
        {!session.analysis && session.status === "draft" && (
          <p className="text-slate-500 text-sm mt-2">The AI will combine your business profile, catalogue, portfolio evidence and this opportunity to identify needs, gaps, risks and questions worth asking.</p>
        )}
        {session.analysis && (
          <div className="mt-3 space-y-3 text-sm">
            {analysis.summary && <p className="text-slate-300">{analysis.summary}</p>}
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
        <section className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm">2. Adaptive discovery questions</h2>
          <p className="text-slate-500 text-xs mt-0.5 mb-3">Generated for this specific opportunity — not a generic form.</p>
          {session.questions.length > 0 && (
            <form action={answerQuestionsAction} className="space-y-3">
              <input type="hidden" name="sessionId" value={id} />
              {session.questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-slate-200 text-sm">{q.question}</label>
                  <div className="text-slate-500 text-xs mb-1">{q.why}</div>
                  <textarea name={`q_${i}`} rows={2} defaultValue={session.answers[q.question] ?? ""} className={input} />
                </div>
              ))}
              <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2">Save answers & get recommendations</button>
            </form>
          )}
        </section>
      )}

      {/* Step 3: recommendations */}
      {session.recommendations.length > 0 && (
        <section className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm">3. Recommendation cards</h2>
          <p className="text-slate-500 text-xs mt-0.5 mb-3">You approve every addition that changes scope, price or delivery time.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {session.recommendations.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-white text-sm font-medium">{r.name}</div>
                  <span className={`text-[10px] rounded px-1.5 py-0.5 border ${LEVEL_STYLES[r.level]}`}>{r.level}</span>
                </div>
                <p className="text-slate-400 text-xs mt-1.5">{r.what}</p>
                <p className="text-slate-500 text-xs mt-1">Why: {r.why}</p>
                <p className="text-slate-500 text-xs">Addresses: {r.problem}</p>
                {r.estimatedCost && <p className="text-emerald-400 text-xs mt-1">Est. cost: {r.estimatedCost}</p>}
                {r.timelineImpact && <p className="text-slate-400 text-xs">Timeline: {r.timelineImpact}</p>}
                <form action={decideRecommendationAction} className="flex gap-1.5 mt-3">
                  <input type="hidden" name="sessionId" value={id} />
                  <input type="hidden" name="recId" value={r.id} />
                  {(["include", "exclude", "ask_client"] as const).map((dec) => (
                    <button
                      key={dec}
                      name="decision"
                      value={dec}
                      className={`text-[11px] rounded-md px-2.5 py-1.5 border transition-colors ${
                        r.decision === dec
                          ? dec === "include" ? "bg-emerald-600 border-emerald-600 text-white" : dec === "exclude" ? "bg-red-600 border-red-600 text-white" : "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {dec === "include" ? "Include" : dec === "exclude" ? "Exclude" : "Ask client"}
                    </button>
                  ))}
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 4: readiness + generate */}
      {session.status !== "draft" && (
        <section className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm">4. Readiness check</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li className="flex justify-between"><span className="text-slate-400">Answered questions</span><span className="text-white">{Object.keys(session.answers).length} / {session.questions.length}</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Approved recommendations</span><span className="text-white">{session.recommendations.filter((r) => r.decision === "include").length} included · {session.recommendations.filter((r) => r.decision === "ask_client").length} to ask client</span></li>
            <li className="flex justify-between"><span className="text-slate-400">Pricing</span><span className="text-white">Calculated by the app from your catalogue — never by the AI</span></li>
          </ul>
          {Object.keys(session.answers).length < session.questions.length && (
            <p className="text-amber-400 text-xs mt-2">⚠ Some questions are unanswered. You can proceed, but missing details may affect the proposal — gaps will be marked as assumptions.</p>
          )}
          <form action={generateProposalAction} className="flex items-end gap-3 mt-4">
            <input type="hidden" name="sessionId" value={id} />
            <div>
              <label className="block text-slate-300 text-xs mb-1">Document complexity</label>
              <select name="complexity" className={input}>
                <option value="simple">Simple — lean one-pager style</option>
                <option value="standard" selected>Standard</option>
                <option value="full">Full — all 30 sections</option>
              </select>
            </div>
            <button className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5">Generate proposal draft</button>
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
