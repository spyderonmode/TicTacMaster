import { motion } from "framer-motion";

interface AvatarWithFrameProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  borderType?: string | null;
  fallbackText?: string;
}

export function AvatarWithFrame({ 
  src, 
  alt, 
  size = 'md',
  borderType = null,
  fallbackText = '?'
}: AvatarWithFrameProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  const paddingClasses = {
    sm: 'p-[3px]',
    md: 'p-1',
    lg: 'p-1.5'
  };

  const getFrameStyle = () => {
    switch (borderType) {
      case 'level_100_master':
      case 'level100Master':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]}`}
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #d97706 50%, #f59e0b 75%, #fbbf24 100%)',
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              boxShadow: [
                '0 0 20px 2px rgba(251, 191, 36, 0.6), 0 0 30px 4px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(251, 191, 36, 0.3)',
                '0 0 30px 4px rgba(251, 191, 36, 0.8), 0 0 40px 6px rgba(245, 158, 11, 0.5), inset 0 0 25px rgba(251, 191, 36, 0.4)',
                '0 0 20px 2px rgba(251, 191, 36, 0.6), 0 0 30px 4px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(251, 191, 36, 0.3)'
              ],
              rotate: [0, 360]
            }}
            transition={{
              backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
              boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 8, repeat: Infinity, ease: 'linear' }
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 p-[2px] relative">
              <div className="w-full h-full rounded-full bg-gray-900 p-[1px]">
                {src ? (
                  <img 
                    src={src} 
                    alt={alt}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                    {fallbackText}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      
      case 'thundering':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]}`}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 25%, #60a5fa 50%, #1d4ed8 75%, #3b82f6 100%)',
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              boxShadow: [
                '0 0 25px 3px rgba(59, 130, 246, 0.7), 0 0 40px 5px rgba(29, 78, 216, 0.5), inset 0 0 25px rgba(96, 165, 250, 0.4), 0 0 60px 8px rgba(147, 197, 253, 0.3)',
                '0 0 35px 5px rgba(59, 130, 246, 0.9), 0 0 50px 7px rgba(29, 78, 216, 0.7), inset 0 0 30px rgba(96, 165, 250, 0.5), 0 0 70px 10px rgba(147, 197, 253, 0.4)',
                '0 0 25px 3px rgba(59, 130, 246, 0.7), 0 0 40px 5px rgba(29, 78, 216, 0.5), inset 0 0 25px rgba(96, 165, 250, 0.4), 0 0 60px 8px rgba(147, 197, 253, 0.3)'
              ],
              rotate: [0, 360],
              scale: [1, 1.02, 1]
            }}
            transition={{
              backgroundPosition: { duration: 2.5, repeat: Infinity, ease: 'linear' },
              boxShadow: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 p-[3px] relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['-200% -200%', '200% 200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              <div className="w-full h-full rounded-full bg-gray-900 p-[2px] relative z-10">
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.3) 0%, transparent 50%)',
                    }}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  {src ? (
                    <img 
                      src={src} 
                      alt={alt}
                      className="w-full h-full rounded-full object-cover relative z-10"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg relative z-10">
                      {fallbackText}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4"
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            >
              <div className="w-full h-full bg-blue-400 rounded-full blur-sm" />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -left-1 w-4 h-4"
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5,
                delay: 1,
              }}
            >
              <div className="w-full h-full bg-blue-300 rounded-full blur-sm" />
            </motion.div>
          </motion.div>
        );
      
      case 'ultimate_veteran':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]}`}
            style={{
              background: 'linear-gradient(135deg, #ff6347 0%, #ff4500 50%, #ff8c00 100%)',
            }}
            animate={{
              boxShadow: [
                '0 0 15px 2px rgba(255, 99, 71, 0.6), 0 0 25px 3px rgba(255, 69, 0, 0.4)',
                '0 0 20px 3px rgba(255, 99, 71, 0.8), 0 0 30px 4px rgba(255, 69, 0, 0.5)',
                '0 0 15px 2px rgba(255, 99, 71, 0.6), 0 0 25px 3px rgba(255, 69, 0, 0.4)'
              ]
            }}
            transition={{
              boxShadow: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            }}
          >
            <div className="w-full h-full rounded-full bg-gray-900 p-[1px]">
              {src ? (
                <img 
                  src={src} 
                  alt={alt}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                  {fallbackText}
                </div>
              )}
            </div>
          </motion.div>
        );
      
      case 'grandmaster':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]}`}
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #a5b4fc 50%, #c7d2fe 100%)',
            }}
            animate={{
              boxShadow: [
                '0 0 12px 2px rgba(129, 140, 248, 0.6), 0 0 20px 3px rgba(165, 180, 252, 0.4)',
                '0 0 18px 3px rgba(129, 140, 248, 0.8), 0 0 25px 4px rgba(165, 180, 252, 0.5)',
                '0 0 12px 2px rgba(129, 140, 248, 0.6), 0 0 20px 3px rgba(165, 180, 252, 0.4)'
              ]
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }}
          >
            <div className="w-full h-full rounded-full bg-gray-900 p-[1px]">
              {src ? (
                <img 
                  src={src} 
                  alt={alt}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                  {fallbackText}
                </div>
              )}
            </div>
          </motion.div>
        );
      
      case 'champion':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]}`}
            style={{
              background: 'linear-gradient(135deg, #8a2be2 0%, #9932cc 50%, #ba55d3 100%)',
            }}
            animate={{
              boxShadow: [
                '0 0 12px 2px rgba(138, 43, 226, 0.6), 0 0 20px 3px rgba(153, 50, 204, 0.4)',
                '0 0 18px 3px rgba(138, 43, 226, 0.8), 0 0 25px 4px rgba(153, 50, 204, 0.5)',
                '0 0 12px 2px rgba(138, 43, 226, 0.6), 0 0 20px 3px rgba(153, 50, 204, 0.4)'
              ]
            }}
            transition={{
              boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            }}
          >
            <div className="w-full h-full rounded-full bg-gray-900 p-[1px]">
              {src ? (
                <img 
                  src={src} 
                  alt={alt}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                  {fallbackText}
                </div>
              )}
            </div>
          </motion.div>
        );
      
      case 'legend':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]}`}
            style={{
              background: 'linear-gradient(135deg, #ff4500 0%, #ff6600 50%, #ff8800 100%)',
            }}
            animate={{
              boxShadow: [
                '0 0 10px 2px rgba(255, 69, 0, 0.6)',
                '0 0 15px 3px rgba(255, 69, 0, 0.8)',
                '0 0 10px 2px rgba(255, 69, 0, 0.6)'
              ]
            }}
            transition={{
              boxShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            }}
          >
            <div className="w-full h-full rounded-full bg-gray-900 p-[1px]">
              {src ? (
                <img 
                  src={src} 
                  alt={alt}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                  {fallbackText}
                </div>
              )}
            </div>
          </motion.div>
        );
      
      default:
        // No frame
        return (
          <div className={`${sizeClasses[size]} rounded-full`}>
            {src ? (
              <img 
                src={src} 
                alt={alt}
                className="w-full h-full rounded-full object-cover border-2 border-gray-600"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 border-2 border-gray-600 flex items-center justify-center text-white font-bold text-lg">
                {fallbackText}
              </div>
            )}
          </div>
        );
    }
  };

  return getFrameStyle();
}
