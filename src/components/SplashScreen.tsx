import { Loader2 } from "lucide-react";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 via-white to-pink-100 z-[9999]">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400 to-pink-400 blur-2xl opacity-30 w-32 h-32 animate-pulse" />
        <div className="flex items-center justify-center w-32 h-32 rounded-full bg-white shadow-lg border-2 border-blue-100">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        </div>
      </div>
      <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight drop-shadow mb-2">LawMate</h1>
      <p className="text-lg text-gray-600 font-medium mb-4">Your AI-Powered Legal Assistant</p>
      <span className="text-sm text-blue-400 animate-pulse">Loading...</span>
    </div>
  );
}

// Add this to your global CSS (e.g., globals.css):
// .animate-fade-in { animation: fadeIn 0.8s ease; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } 