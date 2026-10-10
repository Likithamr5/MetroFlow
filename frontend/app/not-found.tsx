import Link from "next/link";
import { Train, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="text-center flex flex-col items-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-violet-500 blur-3xl opacity-20 rounded-full"></div>
          <Train size={80} className="text-violet-500 relative z-10" />
        </div>
        <h1 className="text-6xl font-extrabold text-white mb-4">404</h1>
        <h2 className="text-xl text-gray-300 font-semibold mb-2">Station Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md text-sm">
          The requested analytical view or dashboard component does not exist in the MetroFlow platform.
        </p>
        <Link href="/" className="flex items-center gap-2 text-sm bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-violet-600/25">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
