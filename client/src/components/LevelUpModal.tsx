import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { motion } from "framer-motion"; // Retained for trophy/text animations, but the confetti motion is gone

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  userDisplayName: string;
  newLevel: number;
  previousLevel: number; 
  userProfilePicture?: string;
}

// Define modern, rich accent colors
const GOLD_COLOR = "text-amber-300";
const SHADOW_GLOW = "shadow-amber-500/50";
const BORDER_COLOR = "border-amber-400";
const DARK_OBSIDIAN = "bg-gray-950"; 
const GOLD_BG_GRADIENT = "bg-gradient-to-r from-amber-500 to-yellow-600";
const RUBY_COLOR = "text-red-500";


export function LevelUpModal({ open, onClose, userDisplayName, newLevel, userProfilePicture }: LevelUpModalProps) {
  const { t } = useTranslation();

  // Removed useState and useEffect for confetti

  return (
    <Dialog 
        open={open} 
        onOpenChange={onClose}
        // Retaining the smooth overlay transition fix
        overlayClassName="bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    >
      <DialogContent 
        className={`
            fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] 
            max-w-[90vw] sm:max-w-[420px] max-h-[80vh] w-full 
            ${DARK_OBSIDIAN} border border-gray-800 rounded-xl 
            text-white shadow-2xl ${SHADOW_GLOW} 
            
            data-[state=open]:animate-in 
            data-[state=open]:fade-in-100
            data-[state=closed]:animate-out 
            data-[state=closed]:fade-out-0
        `}
      >
        {/* Subtle Background Radial Glow (Obsidian/Ruby) - RETAINED for visual style */}
        <div className="absolute inset-0 z-0 opacity-50">
          <motion.div
            className="absolute w-2/3 h-2/3 rounded-full bg-red-900/40 blur-3xl"
            initial={{ scale: 0.8, x: '10%', y: '10%' }}
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              x: ['10%', '-10%', '10%'],
              y: ['10%', '0%', '10%']
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Main Content (Fixed Height, Justify-between) */}
        <DialogHeader className="relative z-10 text-center space-y-4 pt-6 pb-4 flex flex-col justify-between h-full">
          
          {/* Trophy Animation (Top Section) */}
          <motion.div
            className="flex justify-center relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          >
            <div className="relative">
              <Trophy className={`w-14 h-14 sm:w-16 sm:h-16 ${GOLD_COLOR} drop-shadow-lg ${SHADOW_GLOW}`} />
              <motion.div
                className={`absolute -inset-3 rounded-full border-2 ${RUBY_COLOR} opacity-50`}
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity
                }}
              />
            </div>
            {/* Removed: radialParticles */}
          </motion.div>

          {/* Title: Gold & Bold */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <DialogTitle className={`text-3xl sm:text-4xl font-extrabold ${GOLD_COLOR} mb-1 tracking-wider uppercase`}>
              LEVEL UP!
            </DialogTitle>
          </motion.div>

          {/* User Info & Intro Text */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="space-y-3"
          >
            {/* Profile Picture */}
            {userProfilePicture && (
              <div className="flex justify-center">
                <motion.div
                  className="relative"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
                >
                  <img
                    src={userProfilePicture}
                    alt={userDisplayName}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 ${BORDER_COLOR} object-cover shadow-lg`}
                  />
                  <Sparkles className={`absolute bottom-0 right-0 w-4 h-4 ${GOLD_COLOR}`} />
                </motion.div>
              </div>
            )}

            <div className="text-lg sm:text-xl font-semibold text-gray-200">
              {userDisplayName}
            </div>

            <div className="text-md sm:text-lg text-gray-400 font-medium">
              You have reached to level:
            </div>
          </motion.div>

          {/* Level Badge Animation (Polished Gold Coin Effect) */}
          <motion.div
            className="flex justify-center items-center py-2 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <div className="relative">
              <motion.div
                className={`w-24 h-24 sm:w-28 sm:h-28 ${GOLD_BG_GRADIENT} rounded-full flex items-center justify-center 
                            shadow-xl ${SHADOW_GLOW} border-4 ${BORDER_COLOR} 
                            border-double`}
                animate={{ 
                  boxShadow: [
                    `0 0 20px 5px rgba(251, 191, 36, 0.4)`,
                    `0 0 40px 10px rgba(251, 191, 36, 0.8)`,
                    `0 0 20px 5px rgba(251, 191, 36, 0.4)`
                  ],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity
                }}
              >
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-950 drop-shadow-md">
                  {newLevel}
                </span>
              </motion.div>

              {/* Enhanced Sparkles around the badge */}
              <motion.div
                className="absolute -top-1 right-2"
                animate={{ rotate: 360, opacity: [0, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className={`w-5 h-5 ${GOLD_COLOR}`} />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 left-2"
                animate={{ rotate: -360, opacity: [0, 1, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
              >
                <Sparkles className={`w-5 h-5 ${GOLD_COLOR}`} />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Motivational Text */}
          <motion.div
            className="text-center text-gray-400 text-base space-y-1 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <div className={`text-lg font-semibold ${GOLD_COLOR}`}>
              A new level of excellence is unlocked.
            </div>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            className="pt-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <Button
              onClick={onClose}
              className={`w-full bg-gray-800 hover:bg-gray-700 ${GOLD_COLOR} 
                          font-bold px-8 py-3 transform hover:scale-[1.02] 
                          transition-all duration-200 shadow-md border border-amber-400`}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {t('continue')}
            </Button>
          </motion.div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}