import { ReactNode, useEffect } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hideBadge = () => {
        document.querySelectorAll('div[class^="cl-internal-"]').forEach(div => {
          if (
            div.textContent?.toLowerCase().includes('secured by') ||
            div.innerHTML.includes('clerk.com')
          ) {
            (div as HTMLElement).style.display = 'none';
          }
        });
      };
      // Initial check
      hideBadge();
      // MutationObserver for instant removal
      const observer = new MutationObserver(hideBadge);
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-100 via-white to-pink-100">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-64 h-64 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-lg p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-blue-600 tracking-tight mb-4">LawMate</h2>
          <h1 className="text-2xl font-semibold text-gray-800">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
} 