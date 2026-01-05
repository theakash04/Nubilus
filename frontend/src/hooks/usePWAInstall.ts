import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (running as standalone PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log("beforeinstallprompt event fired!");
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log("App was installed!");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      // Fallback: Show browser's native install UI hint
      alert(
        "To install this app:\n\n" +
          "Chrome/Edge: Click the install icon in the address bar (⊕)\n\n" +
          "Safari: Tap Share → Add to Home Screen"
      );
      return false;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }

    return outcome === "accepted";
  };

  // Check if PWA is supported (has service worker support)
  const isPWASupported = "serviceWorker" in navigator;

  return {
    isInstallable,
    isInstalled,
    isPWASupported,
    // Show install option if PWA is supported, not installed, and either installable OR we want to show fallback
    canShowInstall: isPWASupported && !isInstalled,
    installApp,
  };
}
