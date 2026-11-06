export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="text-white text-2xl font-bold">Proposal AI</span>
          </div>
          <p className="text-slate-400 text-sm">Understand the opportunity. Build a stronger proposal. Win the client.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
