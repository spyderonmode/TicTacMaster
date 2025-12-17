import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import levelPng from "@/lib/level.png";

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  userDisplayName: string;
  newLevel: number;
  previousLevel: number;
  userProfilePicture?: string;
}

function preloadImage(src?: string) {
  return new Promise<void>((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/* JRPG font helper (assumes Cinzel / Trajan-style font available) */
const JRPG_FONT = "font-[Cinzel,Trajan_Pro,serif] tracking-wide uppercase";

export function LevelUpModal({
  open,
  onClose,
  userDisplayName,
  newLevel,
  userProfilePicture,
}: LevelUpModalProps) {
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      if (!open) {
        setIsReady(false);
        return;
      }
      setIsReady(false);
      await Promise.all([preloadImage(levelPng), preloadImage(userProfilePicture)]);
      if (!cancelled) setIsReady(true);
    }

    prepare();
    return () => {
      cancelled = true;
    };
  }, [open, userProfilePicture]);

  const dialogOpen = useMemo(() => open && isReady, [open, isReady]);

  return (
    <Dialog open={dialogOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-[90%]
          p-0 bg-transparent border-0 shadow-none
        "
      >
        {/* ===== JRPG PREMIUM FRAME (NO SHADOWS) ===== */}
        <div className="relative rounded-2xl p-[2px] bg-[linear-gradient(135deg,#fde68a,#f59e0b,#fde68a)]">
          <div className="relative rounded-[15px] bg-gray-950 text-white">
            {/* double-line frame */}
            <div className="pointer-events-none absolute inset-0 rounded-[15px] border border-amber-200/35" />
            <div className="pointer-events-none absolute inset-[10px] rounded-[11px] border border-amber-200/15" />

            {/* corner lines */}
            <div className="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l border-t border-amber-200/50" />
            <div className="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r border-t border-amber-200/50" />
            <div className="pointer-events-none absolute left-4 bottom-4 h-4 w-4 border-l border-b border-amber-200/50" />
            <div className="pointer-events-none absolute right-4 bottom-4 h-4 w-4 border-r border-b border-amber-200/50" />

            <DialogHeader className="relative px-6 pt-6 pb-6 text-center">
              {/* ===== TITLE RIBBON ===== */}
              <div className="flex justify-center">
                <div className={`px-4 py-1.5 border border-amber-200/30 text-amber-100 text-[11px] ${JRPG_FONT}`}>
                  LEVEL UP
                </div>
              </div>

              {/* ===== HEADER IMAGE (STATIC, locked height) ===== */}
              <div className="mt-4 flex justify-center">
                <div className="h-[150px] w-full flex items-center justify-center">
                  <img
                    src={levelPng}
                    alt="Level Up"
                    draggable={false}
                    className="max-h-full w-72 h-auto object-contain"
                  />
                </div>
              </div>

              {/* ===== USER PANEL ===== */}
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center justify-center gap-3">
                  {userProfilePicture && (
                    <img
                      src={userProfilePicture}
                      alt={userDisplayName}
                      draggable={false}
                      className="h-16 w-16 rounded-full border border-amber-200/35 object-cover"
                    />
                  )}

                  <div className="text-left">
                    <div className={`text-base font-semibold ${JRPG_FONT}`}>
                      {userDisplayName}
                    </div>
                    <div className="text-xs text-gray-400">
                      Your journey continues…
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== SHINY JRPG LEVEL PLATE (NO SHADOWS/BLUR) ===== */}
              <div className="mt-4 relative rounded-2xl border border-amber-200/25 bg-white/[0.02] overflow-hidden">
                {/* metallic top sheen */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent" />

                {/* diagonal shine sweep */}
                <motion.div
                  className="pointer-events-none absolute -left-[60%] top-0 h-full w-[60%] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["0%", "220%"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* inner frame */}
                <div className="relative p-4 border border-amber-200/15 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className={`text-[11px] text-amber-200/80 ${JRPG_FONT}`}>
                        New Level
                      </div>
                      <div className={`mt-1 text-sm text-amber-100 ${JRPG_FONT}`}>
                        Mastery Increased
                      </div>
                    </div>

                    {/* polished metal level badge */}
                    <motion.div
                      className="
                        relative h-16 w-16 rounded-2xl
                        border border-amber-200/40
                        bg-[linear-gradient(145deg,#fde68a,#f59e0b,#fde68a)]
                        flex items-center justify-center
                      "
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                      aria-label={`Level ${newLevel}`}
                    >
                      {/* engraved highlight */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.35),transparent_55%)]" />
                      <span className="text-2xl font-extrabold text-gray-950">
                        {newLevel}
                      </span>
                    </motion.div>
                  </div>

                  {/* elegant JRPG meter */}
                  <div className="mt-4">
                    <div className="h-[6px] w-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "80%",
                          background: "linear-gradient(90deg,#fde68a,#f59e0b,#fde68a)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== CONTINUE ONLY ===== */}
              <div className="mt-5">
                <Button
                  onClick={onClose}
                  className="
                    w-full h-12 rounded-xl
                    bg-[linear-gradient(135deg,#fde68a,#f59e0b)]
                    text-gray-950 font-bold tracking-wide
                    border border-amber-200/35
                    hover:brightness-110
                    transition
                  "
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {t("continue")}
                </Button>
              </div>
            </DialogHeader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
