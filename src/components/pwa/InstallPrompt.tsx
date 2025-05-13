"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Download } from 'lucide-react';

function isFirefox() {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    if (isFirefox()) {
      setInstallable(true); // Always show install button for Firefox
      return;
    }
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isFirefox()) {
      setShowButton(false); // Just close the button on Firefox
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
    setInstallable(false);
    console.log(`User response to the install prompt: ${outcome}`);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowButton(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isStandalone || !showButton) return null;

  return (
    <>
      {/* Persistent Install Button */}
      {installable && (
        <div className="fixed z-[100] bottom-6 right-6 flex flex-col items-end">
          <div className="relative flex items-center">
            <Button
              onClick={handleInstall}
              className="shadow-lg bg-gradient-to-r from-sky-500 to-pink-500 text-white px-6 py-3 rounded-full text-lg font-bold flex items-center gap-2 animate-bounce pr-12"
              style={{ boxShadow: '0 8px 32px rgba(30,41,59,0.35)' }}
            >
              <Download className="w-5 h-5" /> Install LawMate
            </Button>
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 hover:text-red-500 rounded-full p-1 border border-gray-200 shadow transition-colors"
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Custom Dialog for Chrome/Edge */}
      {showPrompt && !isFirefox() && (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
          <DialogContent className="sm:max-w-md border-4 border-pink-400 shadow-2xl animate-pulse">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-2xl">
                Install LawMate
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription>
                Install LawMate on your device for quick and easy access when you're on the go.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src="/icons/icon-192x192.png"
                  alt="LawMate"
                  className="h-20 w-20 rounded-lg border-2 border-sky-400 shadow-lg"
                />
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-bold leading-none">LawMate</p>
                  <p className="text-sm text-muted-foreground">
                    Your legal practice management solution
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleDismiss}>
                  Not now
                </Button>
                <Button onClick={handleInstall} className="bg-gradient-to-r from-sky-500 to-pink-500 text-white font-bold">
                  Install
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 