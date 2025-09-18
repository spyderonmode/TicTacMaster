import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  userDisplayName: string;
  newLevel: number;
  previousLevel: number;
  userProfilePicture?: string;
}

export function LevelUpModal({ open, onClose, userDisplayName, newLevel, previousLevel, userProfilePicture }: LevelUpModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-2 border-yellow-400 text-white overflow-hidden">
        {/* Background sparkles animation */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full opacity-70"
              initial={{ 
                x: Math.random() * 400,
                y: Math.random() * 300,
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: 360
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 3
              }}
            >
              <Star className="w-2 h-2" />
            </motion.div>
          ))}
        </div>

        <DialogHeader className="relative z-10 text-center space-y-4">
          {/* Trophy Animation */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
          >
            <div className="relative">
              <Trophy className="w-20 h-20 text-yellow-400" />
              <motion.div
                className="absolute -inset-2 rounded-full border-2 border-yellow-400"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 0.4, 0.8]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity
                }}
              />
            </div>
          </motion.div>

          {/* Congratulations Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <DialogTitle className="text-3xl font-bold text-yellow-400 mb-2">
              🎉 {t('congratulations')}! 🎉
            </DialogTitle>
          </motion.div>

          {/* User Info */}
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
                    className="w-16 h-16 rounded-full border-4 border-yellow-400 shadow-lg object-cover"
                  />
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-yellow-300"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.6, 0.3, 0.6]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity
                    }}
                  />
                </motion.div>
              </div>
            )}
            
            <div className="text-xl font-semibold text-white">
              {userDisplayName}
            </div>
            
            {/* Level Up Text */}
            <div className="text-lg text-blue-200">
              {t('youHaveReachedLevel')} {previousLevel} → 
              <motion.span
                className="text-2xl font-bold text-yellow-400 ml-2"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ 
                  delay: 0.8,
                  duration: 0.6,
                  repeat: 2
                }}
              >
                {newLevel}
              </motion.span>
            </div>
          </motion.div>

          {/* Level Badge Animation */}
          <motion.div
            className="flex justify-center items-center space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <div className="relative">
              <motion.div
                className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-300"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(250, 204, 21, 0.5)",
                    "0 0 40px rgba(250, 204, 21, 0.8)",
                    "0 0 20px rgba(250, 204, 21, 0.5)"
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity
                }}
              >
                <span className="text-2xl font-bold text-purple-900">
                  {newLevel}
                </span>
              </motion.div>
              
              {/* Sparkles around the badge */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </motion.div>
            </div>
          </motion.div>

          {/* Motivational Text */}
          <motion.div
            className="text-center text-blue-200 text-sm space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <div>{t('keepUpTheGreatWork')}</div>
            <div className="text-yellow-300 font-semibold">
              {t('yourSkillsAreImproving')}
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
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-purple-900 font-bold px-8 py-2 transform hover:scale-105 transition-all duration-200"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {t('continue')}
            </Button>
          </motion.div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}