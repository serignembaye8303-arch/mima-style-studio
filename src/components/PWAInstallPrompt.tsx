import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: any) => { e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!evt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 bg-foreground text-background rounded-lg shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5">
      <Download className="h-5 w-5 text-gold shrink-0" />
      <div className="flex-1">
        <p className="font-display text-sm">Installer Mima Boutique</p>
        <p className="text-[11px] text-background/70">Accès rapide depuis votre écran d'accueil.</p>
      </div>
      <button onClick={async () => { evt.prompt(); const r = await evt.userChoice; if (r.outcome) setEvt(null); }} className="bg-background text-foreground text-xs tracking-luxe px-3 py-2 rounded">Installer</button>
      <button onClick={() => setDismissed(true)} className="p-1 text-background/60 hover:text-background"><X className="h-4 w-4" /></button>
    </div>
  );
}
