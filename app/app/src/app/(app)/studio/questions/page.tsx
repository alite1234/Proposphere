export default function StudioQuestions() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6">AI Discovery Questions</h2>
      <p className="text-slate-500 mb-6">
        The AI has generated adaptive questions based on your opportunity. Answer each question to help the AI recommend the right services for your proposal.
      </p>
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">What is the primary purpose or goal of this project?</h3>
          <textarea className="w-full rounded-lg px-3 py-2 border border-slate-200/50 text-slate-300 focus:outline-none focus:border-gold transition-colors" rows={4} placeholder="e.g. Build a website to showcase our portfolio and accept online bookings" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">What is the target launch or delivery date?</h3>
          <textarea className="w-full rounded-lg px-3 py-2 border border-slate-200/50 text-slate-300 focus:outline-none focus:border-gold transition-colors" rows={4} placeholder="e.g. December 2024" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">Who provides images, content and access credentials?</h3>
          <textarea className="w-full rounded-lg px-3 py-2 border border-slate-200/50 text-slate-300 focus:outline-none focus:border-gold transition-colors" rows={4} placeholder="e.g. Client provides copy, we provide access" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">Is there an existing system or website to migrate or replace?</h3>
          <textarea className="w-full rounded-lg px-3 py-2 border border-slate-200/50 text-slate-300 focus:outline-none focus:border-gold transition-colors" rows={4} placeholder="e.g. Existing WordPress site to be redesigned" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">Is ongoing maintenance or support needed after delivery?</h3>
          <textarea className="w-full rounded-lg px-3 py-2 border border-slate-200/50 text-slate-300 focus:outline-none focus:border-gold transition-colors" rows={4} placeholder="e.g. 3 months of post-launch support" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">What is the budget range the client has indicated?</h3>
          <textarea className="w-full rounded-lg px-3 py-2 border border-slate-200/50 text-slate-300 focus:outline-none focus:border-gold transition-colors" rows={4} placeholder="e.g. $5,000 - $15,000" />
        </div>
      </div>
    </div>
  );
}