export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-violet-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
        </div>
      </div>
      <h2 className="mt-4 text-xl font-bold text-white tracking-widest">METROFLOW</h2>
      <p className="text-sm text-gray-500 mt-1">Initializing Bangalore Metro Transit Intelligence...</p>
    </div>
  );
}
