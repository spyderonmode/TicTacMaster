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
          <div className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]} avatar-level-100-master`}>
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
          </div>
        );

      case 'thundering':
        return (
          <div className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]} avatar-thundering`}>
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 p-[3px] relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['-200% -200%', '200% 200%'],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, transparent 40%, rgba(147, 197, 253, 0.8) 50%, transparent 60%)',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['200% 200%', '-200% -200%'],
                  opacity: [0, 0.8, 0]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.5
                }}
              />
              <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.4) 0%, transparent 50%)',
                  }}
                  animate={{
                    opacity: [0.2, 0.7, 0.2],
                  }}
                  transition={{
                    duration: 1.5,
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
        );

      case 'firestorm':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]}`}
            style={{
              background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 20%, #ea580c 40%, #f97316 60%, #fb923c 80%, #fdba74 100%)',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-600 via-red-600 to-amber-500 p-[4px] relative overflow-visible">

              {/* Fire particles all around the border */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const radius = size === 'sm' ? 18 : size === 'md' ? 26 : 38;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full z-0"
                    style={{
                      left: '50%',
                      top: '50%',
                      background: 'radial-gradient(circle, #fef3c7, #fbbf24)',
                      boxShadow: '0 0 4px #fbbf24, 0 0 8px #fb923c',
                    }}
                    animate={{
                      x: [x * 0.85, x * 1.05, x * 0.9, x * 1.1, x * 0.88],
                      y: [y * 0.85, y * 1.05, y * 0.9, y * 1.1, y * 0.88],
                      opacity: [0.5, 1, 0.7, 0.9, 0.6],
                      scale: [0.5, 1.2, 0.8, 1.3, 0.6],
                    }}
                    transition={{
                      duration: 2 + (i % 4) * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.1,
                    }}
                  />
                );
              })}

              {/* Additional animated fire particles */}
              {[...Array(12)].map((_, i) => {
                const angle = (i * 360) / 12 + 15;
                const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 40;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <motion.div
                    key={`outer-${i}`}
                    className="absolute w-0.5 h-0.5 rounded-full z-0"
                    style={{
                      left: '50%',
                      top: '50%',
                      background: 'radial-gradient(circle, #fb923c, #ea580c)',
                      boxShadow: '0 0 3px #fb923c',
                    }}
                    animate={{
                      x: [x * 0.9, x * 1.15, x * 0.95, x * 1.08],
                      y: [y * 0.9, y * 1.15, y * 0.95, y * 1.08],
                      opacity: [0.3, 0.8, 0.5, 0.7],
                      scale: [0.4, 1, 0.6, 0.9],
                    }}
                    transition={{
                      duration: 1.8 + (i % 3) * 0.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.15,
                    }}
                  />
                );
              })}

              <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                {src ? (
                  <motion.img 
                    src={src} 
                    alt={alt}
                    className="w-full h-full rounded-full object-cover relative z-10"
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                ) : (
                  <motion.div 
                    className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg relative z-10"
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    {fallbackText}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        );

      case 'ultimate_veteran':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]} avatar-ultimate-veteran`}
            style={{
              background: 'linear-gradient(135deg, #ff6347 0%, #ff4500 50%, #ff8c00 100%)',
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
          </div>
        );

      case 'grandmaster':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]} avatar-grandmaster`}
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #a5b4fc 50%, #c7d2fe 100%)',
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
          </div>
        );

      case 'champion':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]} avatar-champion`}
            style={{
              background: 'linear-gradient(135deg, #8a2be2 0%, #9932cc 50%, #ba55d3 100%)',
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
          </div>
        );

      case 'legend':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]} avatar-legend`}
            style={{
              background: 'linear-gradient(135deg, #ff4500 0%, #ff6600 50%, #ff8800 100%)',
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
          </div>
        );

      case 'lovers_3d':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full relative ${paddingClasses[size]}`}
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #fbcfe8 100%)',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-[3px] relative overflow-visible">

              {/* 3D Floating hearts around the avatar */}
              {[...Array(18)].map((_, i) => {
                const angle = (i * 360) / 18;
                const radius = size === 'sm' ? 22 : size === 'md' ? 30 : 42;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const heartSize = size === 'sm' ? 7 : size === 'md' ? 10 : 13;

                return (
                  <motion.div
                    key={i}
                    className="absolute z-0"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${heartSize}px`,
                      height: `${heartSize}px`,
                      marginLeft: `-${heartSize / 2}px`,
                      marginTop: `-${heartSize / 2}px`,
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                    }}
                    initial={{ x, y }}
                    animate={{
                      x: [
                        x, 
                        x * 1.1, 
                        x * 0.9, 
                        x * 1.05, 
                        x
                      ],
                      y: [
                        y, 
                        y * 1.1, 
                        y * 0.9, 
                        y * 1.05, 
                        y
                      ],
                      scale: [0.8, 1.2, 0.9, 1.1, 0.8],
                      rotateY: [0, 180, 360],
                      rotateZ: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 3 + (i % 4) * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.15,
                    }}
                  >
                    <svg
                      width={heartSize}
                      height={heartSize}
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(236, 72, 153, 0.6))',
                      }}
                    >
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="url(#heartGradient)"
                      />
                      <defs>
                        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                          <stop offset="50%" style={{ stopColor: '#f472b6', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#fbcfe8', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                );
              })}

              <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                {src ? (
                  <img 
                    src={src} 
                    alt={alt}
                    className="w-full h-full rounded-full object-cover relative z-10"
                  />
                ) : (
                  <div 
                    className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg relative z-10"
                  >
                    {fallbackText}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'diamond_luxury':
        return (
          <div
            className={`${sizeClasses[size]} relative ${paddingClasses[size]}`}
            style={{
              transform: 'rotate(45deg)',
            }}
          >
            <div className="w-full h-full p-[4px] relative overflow-visible"
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 20%, #e0e7ff 40%, #ddd6fe 60%, #c4b5fd 80%, #a78bfa 100%)',
                borderRadius: '8px',
              }}
            >
              {/* Animated shimmer overlay on border */}
              <motion.div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  borderRadius: '8px',
                }}
                animate={{
                  backgroundPosition: ['-200% 0%', '200% 0%'],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Floating pyramid diamond crystals around the border */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const radius = size === 'sm' ? 24 : size === 'md' ? 32 : 44;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const diamondSize = size === 'sm' ? 8 : size === 'md' ? 10 : 12;

                return (
                  <motion.div
                    key={i}
                    className="absolute z-0"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${diamondSize}px`,
                      height: `${diamondSize}px`,
                      marginLeft: `-${diamondSize / 2}px`,
                      marginTop: `-${diamondSize / 2}px`,
                    }}
                    initial={{ x, y }}
                    animate={{
                      x: [x, x * 1.08, x * 0.92, x * 1.05, x],
                      y: [y, y * 1.08, y * 0.92, y * 1.05, y],
                      scale: [0.8, 1.4, 0.9, 1.2, 0.8],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3 + (i % 4) * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.12,
                    }}
                  >
                    <svg
                      width={diamondSize}
                      height={diamondSize}
                      viewBox="0 0 24 24"
                    >
                      <defs>
                        <linearGradient id={`diamondGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                          <stop offset="50%" style={{ stopColor: '#f8f8ff', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#e8e8ff', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 2 L6 10 L12 22 L18 10 Z"
                        fill={`url(#diamondGrad${i})`}
                        stroke="#ffffff"
                        strokeWidth="0.5"
                      />
                      <path
                        d="M12 2 L6 10 L12 11 Z"
                        fill="rgba(255, 255, 255, 0.9)"
                      />
                      <path
                        d="M12 2 L18 10 L12 11 Z"
                        fill="rgba(255, 255, 255, 0.7)"
                      />
                    </svg>
                  </motion.div>
                );
              })}

              {/* Shining particles on diamonds */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const radius = size === 'sm' ? 24 : size === 'md' ? 32 : 44;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <motion.div
                    key={`shine-${i}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '3px',
                      height: '3px',
                      marginLeft: '-1.5px',
                      marginTop: '-1.5px',
                      background: 'radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0.9) 50%, transparent 100%)',
                      borderRadius: '50%',
                    }}
                    animate={{
                      x: [x, x, x],
                      y: [y, y, y],
                      opacity: [0, 1, 0],
                      scale: [0.5, 2, 0.5],
                    }}
                    transition={{
                      duration: 1.5 + (i % 3) * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.1,
                    }}
                  />
                );
              })}

              <div 
                className="w-full h-full rounded-full overflow-hidden relative z-10"
                style={{
                  transform: 'rotate(-45deg)',
                }}
              >
                {src ? (
                  <img 
                    src={src} 
                    alt={alt}
                    className="w-full h-full rounded-full object-cover relative z-10"
                  />
                ) : (
                  <div 
                    className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg relative z-10"
                  >
                    {fallbackText}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'holographic_matrix':
        return (
          <div className={`${sizeClasses[size]} rounded-full relative`} style={{ padding: '8px' }}>
            {/* Outer 3D Prismatic Border Ring - positioned outside */}
            <div 
              className="absolute rounded-full"
              style={{
                inset: '-6px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
                padding: '4px',
                boxShadow: `
                  inset 0 2px 4px rgba(255, 255, 255, 0.3),
                  inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                  0 0 20px rgba(102, 126, 234, 0.5)
                `,
                transform: 'translateZ(0)',
              }}
            >
              {/* Multi-layer 3D border effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.4) 10%, transparent 20%, rgba(255,255,255,0.4) 30%, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%, rgba(255,255,255,0.4) 70%, transparent 80%, rgba(255,255,255,0.4) 90%, transparent 100%)',
                }}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Inner layer */}
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(225deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  padding: '2px',
                  boxShadow: 'inset 0 2px 3px rgba(0, 0, 0, 0.4), inset 0 -2px 3px rgba(255, 255, 255, 0.2)',
                }}
              />
            </div>

            {/* Avatar - Full Size */}
            <div className="w-full h-full rounded-full overflow-hidden relative z-10 bg-black"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
              }}
            >
              {src ? (
                <motion.img 
                  src={src} 
                  alt={alt}
                  className="w-full h-full rounded-full object-cover"
                  style={{
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                  }}
                  animate={{
                    rotateX: [0, 5, -5, 5, 0],
                    rotateY: [0, -8, 8, -8, 0],
                    translateZ: [0, 15, -10, 15, 0],
                    scale: [1, 1.03, 0.98, 1.03, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ) : (
                <motion.div 
                  className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                  }}
                  animate={{
                    rotateX: [0, 5, -5, 5, 0],
                    rotateY: [0, -8, 8, -8, 0],
                    translateZ: [0, 15, -10, 15, 0],
                    scale: [1, 1.03, 0.98, 1.03, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {fallbackText}
                </motion.div>
              )}
            </div>
          </div>
        );

      case 'cosmic_vortex':
        return (
          <div className={`${sizeClasses[size]} rounded-full relative`} style={{ padding: '8px' }}>
            {/* Outer Neon Energy Plasma Border Ring - positioned outside */}
            <div 
              className="absolute rounded-full overflow-visible"
              style={{
                inset: '-6px',
                background: 'linear-gradient(135deg, #ff006e 0%, #8338ec 33%, #3a86ff 66%, #06ffa5 100%)',
                padding: '4px',
                boxShadow: `
                  inset 0 0 8px rgba(255, 0, 110, 0.6),
                  inset 0 0 12px rgba(131, 56, 236, 0.4)
                `,
              }}
            >
              {/* Animated energy waves - optimized */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #ff006e)',
                  opacity: 0.8,
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 180deg, transparent 0%, #ff006e 25%, transparent 50%, #3a86ff 75%, transparent 100%)',
                  opacity: 0.6,
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  rotate: -360,
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Inner glow layer */}
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #ff006e 0%, #8338ec 25%, #3a86ff 50%, #06ffa5 75%, #ffbe0b 100%)',
                  padding: '2px',
                }}
              />
            </div>

            {/* Avatar - Full Size */}
            <div className="w-full h-full rounded-full overflow-hidden relative z-10">
              {src ? (
                <motion.img 
                  src={src} 
                  alt={alt}
                  className="w-full h-full rounded-full object-cover relative z-10"
                  style={{
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ) : (
                <motion.div 
                  className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg relative z-10"
                  style={{
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {fallbackText}
                </motion.div>
              )}
            </div>
          </div>
        );

      case 'celestial_nebula':
        return (
          <div className={`${sizeClasses[size]} rounded-full relative`} style={{ padding: '5px' }}>
            {/* Triple-layer Supernova Border with Extreme Energy */}
            <div 
              className="absolute rounded-full overflow-visible"
              style={{
                inset: '-3.2px',
              }}
            >
              {/* Outer explosive energy ring - optimized */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: '-4.8px',
                  background: 'radial-gradient(circle, transparent 30%, #ff006e 50%, #8338ec 70%, #3a86ff 90%, transparent 100%)',
                  willChange: 'transform, opacity',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Main border with intense gradient */}
              <div 
                className="absolute rounded-full"
                style={{
                  inset: '0px',
                  background: 'linear-gradient(135deg, #ff006e 0%, #8338ec 20%, #3a86ff 40%, #06ffa5 60%, #ffbe0b 80%, #ff006e 100%)',
                  padding: '2px',
                }}
              >
                {/* Fast spinning galaxy layer 1 - optimized */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #ff006e, transparent, #8338ec, transparent, #3a86ff, transparent, #06ffa5, transparent, #ff006e)',
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                  }}
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Counter-rotating galaxy layer 2 - optimized */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 180deg, transparent, #f093fb, transparent, #00f2fe, transparent, #ffbe0b, transparent)',
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                  }}
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Pulsing cosmic energy waves - reduced to 2 */}
                {[...Array(2)].map((_, i) => (
                  <motion.div
                    key={`wave-${i}`}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, transparent ${40 + i * 15}%, rgba(255, 0, 110, 0.3) ${55 + i * 15}%, transparent ${70 + i * 15}%)`,
                      willChange: 'transform, opacity',
                      transform: 'translateZ(0)',
                    }}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0, 0.8, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: i * 1.25,
                    }}
                  />
                ))}

                {/* Shooting star comets - reduced to 6 */}
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 360) / 6;
                  const startRadius = size === 'sm' ? 12 : size === 'md' ? 17.6 : 25.6;
                  const endRadius = size === 'sm' ? 28 : size === 'md' ? 38.4 : 52;
                  const startX = Math.cos((angle * Math.PI) / 180) * startRadius;
                  const startY = Math.sin((angle * Math.PI) / 180) * startRadius;
                  const endX = Math.cos((angle * Math.PI) / 180) * endRadius;
                  const endY = Math.sin((angle * Math.PI) / 180) * endRadius;

                  return (
                    <motion.div
                      key={`comet-${i}`}
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: '2.4px',
                        height: '9.6px',
                        background: 'linear-gradient(to bottom, #fff, #00f2fe, transparent)',
                        borderRadius: '50%',
                        transformOrigin: 'center',
                        willChange: 'transform, opacity',
                        transform: 'translateZ(0)',
                      }}
                      animate={{
                        x: [startX, endX, startX],
                        y: [startY, endY, startY],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                        delay: i * 0.33,
                      }}
                    />
                  );
                })}

                {/* Glowing particles - reduced to 16 */}
                {[...Array(16)].map((_, i) => {
                  const angle = (i * 360) / 16;
                  const radius = size === 'sm' ? 14.4 : size === 'md' ? 20.8 : 30.4;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  const colors = ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b', '#f093fb'];
                  const color = colors[i % colors.length];

                  return (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: '2.4px',
                        height: '2.4px',
                        background: `radial-gradient(circle, ${color}, transparent)`,
                        borderRadius: '50%',
                        willChange: 'transform, opacity',
                        transform: 'translateZ(0)',
                      }}
                      animate={{
                        x: [x, x * 1.2, x],
                        y: [y, y * 1.2, y],
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 2, 1],
                      }}
                      transition={{
                        duration: 2.5 + (i % 4) * 0.3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.15,
                      }}
                    />
                  );
                })}

                {/* Supernova explosion bursts - reduced to 8 */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i * 360) / 8;
                  const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 38.4;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;

                  return (
                    <motion.div
                      key={`burst-${i}`}
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: '1.6px',
                        height: '6.4px',
                        background: 'linear-gradient(to bottom, #fff, #ffbe0b, transparent)',
                        borderRadius: '50%',
                        transformOrigin: 'center bottom',
                        willChange: 'transform, opacity',
                        transform: 'translateZ(0)',
                      }}
                      animate={{
                        x: [0, x, 0],
                        y: [0, y, 0],
                        opacity: [0, 1, 0],
                        scaleY: [0.5, 2, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeOut',
                        delay: i * 0.19,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Avatar - Static with subtle glow */}
            <div className="w-full h-full rounded-full overflow-hidden relative z-10">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.3), transparent)',
                  willChange: 'opacity',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
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
        );

      case 'royal_zigzag_crown':
        return (
          <div className={`${sizeClasses[size]} relative`} style={{ padding: '8px' }}>
            {/* Zigzag Border - positioned outside */}
            <div 
              className="absolute overflow-visible"
              style={{
                inset: '-6px',
              }}
            >
              {/* SVG Zigzag Border */}
              <svg 
                className="absolute w-full h-full"
                viewBox="0 0 100 100"
                style={{ 
                  left: '50%', 
                  top: '50%', 
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <defs>
                  <linearGradient id="royalGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                    <stop offset="25%" style={{ stopColor: '#ffed4e', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#ffa500', stopOpacity: 1 }} />
                    <stop offset="75%" style={{ stopColor: '#ffed4e', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                
                {/* Zigzag circle path */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="url(#royalGoldGradient)"
                  strokeWidth="8"
                  strokeDasharray="3,1"
                  strokeLinecap="square"
                  animate={{
                    opacity: [0.95, 1, 0.95],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </svg>

              {/* 16 Golden Sparkles - in the space between border and avatar */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const radius = size === 'sm' ? 18 : size === 'md' ? 24 : 32;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute z-10"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '8px',
                      height: '8px',
                      marginLeft: '-4px',
                      marginTop: '-4px',
                      background: 'radial-gradient(circle, #fff, #ffd700, #ffa500, transparent)',
                      borderRadius: '50%',
                    }}
                    animate={{
                      x: [x, x],
                      y: [y, y],
                      opacity: [0, 1, 0],
                      scale: [0.5, 2, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.09,
                    }}
                  />
                );
              })}

            </div>

            {/* Avatar - Full Size - No Animation */}
            <div className="w-full h-full rounded-full overflow-hidden relative z-10">
              {src ? (
                <img 
                  src={src} 
                  alt={alt}
                  className="w-full h-full rounded-full object-cover relative z-10"
                />
              ) : (
                <div 
                  className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg relative z-10"
                >
                  {fallbackText}
                </div>
              )}
            </div>
          </div>
        );

      case 'quantum_prism':
        return (
          <div className={`${sizeClasses[size]} rounded-full relative`} style={{ padding: '6px' }}>
            {/* Hexagonal Rotating Frame */}
            <div 
              className="absolute"
              style={{
                inset: '-8px',
                overflow: 'visible',
              }}
            >
              {/* Outer 3D Hexagonal Layer - Most outer */}
              <motion.div
                className="absolute"
                style={{
                  inset: '-2px',
                  background: 'linear-gradient(135deg, #00ffff 0%, #00d4ff 25%, #0080ff 50%, #00d4ff 75%, #00ffff 100%)',
                  clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
                  padding: '2px',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 255, 255, 0.5)) drop-shadow(0 0 12px rgba(0, 212, 255, 0.8))',
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div 
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0, 255, 255, 0.3), rgba(0, 128, 255, 0.1))',
                    clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
                  }}
                />
              </motion.div>

              {/* Middle 3D Hexagonal Layer */}
              <motion.div
                className="absolute"
                style={{
                  inset: '2px',
                  background: 'linear-gradient(135deg, #00d4ff 0%, #00a8ff 25%, #0080ff 50%, #00d4ff 75%, #00ffff 100%)',
                  clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
                  padding: '3px',
                  filter: 'drop-shadow(0 2px 6px rgba(0, 212, 255, 0.7))',
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  rotate: [0, -360],
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div 
                  className="w-full h-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
                  }}
                />
              </motion.div>

              {/* Inner 3D Hexagonal Layer - Closest to avatar */}
              <motion.div
                className="absolute"
                style={{
                  inset: '6px',
                  background: 'linear-gradient(225deg, #00ffff 0%, #00d4ff 50%, #0080ff 100%)',
                  clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
                  padding: '2px',
                  opacity: 0.8,
                  filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))',
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div 
                  className="w-full h-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
                  }}
                />
              </motion.div>

              {/* Floating Geometric Crystals - 8 hexagons evenly distributed */}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 360) / 8 + 22.5; // Offset to avoid top/bottom/sides
                const radius = size === 'sm' ? 22 : size === 'md' ? 30 : 40;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const crystalSize = size === 'sm' ? 7 : size === 'md' ? 9 : 11;

                return (
                  <motion.div
                    key={`crystal-${i}`}
                    className="absolute z-10"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${crystalSize}px`,
                      height: `${crystalSize}px`,
                      marginLeft: `-${crystalSize / 2}px`,
                      marginTop: `-${crystalSize / 2}px`,
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                      willChange: 'transform, opacity',
                      transform: 'translateZ(0)',
                    }}
                    animate={{
                      x: [x, x * 1.1, x],
                      y: [y, y * 1.1, y],
                      rotateZ: [0, 360],
                      rotateY: [0, 180, 360],
                      scale: [0.9, 1.2, 0.9],
                    }}
                    transition={{
                      duration: 4 + (i % 3) * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.2,
                    }}
                  >
                    <svg
                      width={crystalSize}
                      height={crystalSize}
                      viewBox="0 0 20 20"
                      style={{
                        filter: 'drop-shadow(0 0 3px rgba(0, 212, 255, 0.8))',
                      }}
                    >
                      <polygon
                        points="10,0 18,5 18,15 10,20 2,15 2,5"
                        fill="url(#crystalGrad)"
                        stroke="#00ffff"
                        strokeWidth="0.5"
                      />
                      <defs>
                        <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#00ffff', stopOpacity: 0.9 }} />
                          <stop offset="50%" style={{ stopColor: '#00d4ff', stopOpacity: 0.7 }} />
                          <stop offset="100%" style={{ stopColor: '#0080ff', stopOpacity: 0.9 }} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                );
              })}

              {/* Light Beams - 6 rays behind border */}
              {[...Array(6)].map((_, i) => {
                const angle = (i * 360) / 6 + 30; // Offset for cleaner look

                return (
                  <motion.div
                    key={`beam-${i}`}
                    className="absolute z-0"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '1.5px',
                      height: '50%',
                      background: 'linear-gradient(to top, transparent, rgba(0, 255, 255, 0.4), transparent)',
                      transformOrigin: 'bottom center',
                      willChange: 'transform, opacity',
                      transform: 'translateZ(0)',
                    }}
                    animate={{
                      rotate: [angle, angle + 360],
                      opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.6,
                    }}
                  />
                );
              })}

              {/* Pulsing Energy Rings - Behind border */}
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute rounded-full z-0"
                  style={{
                    inset: '15%',
                    border: '1px solid rgba(0, 212, 255, 0.4)',
                    boxShadow: '0 0 8px rgba(0, 255, 255, 0.3)',
                    willChange: 'transform, opacity',
                    transform: 'translateZ(0)',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: i * 1.75,
                  }}
                />
              ))}
            </div>

            {/* Central Star Core - Big and centered */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: size === 'sm' ? '24px' : size === 'md' ? '32px' : '40px',
                height: size === 'sm' ? '24px' : size === 'md' ? '32px' : '40px',
                marginLeft: size === 'sm' ? '-12px' : size === 'md' ? '-16px' : '-20px',
                marginTop: size === 'sm' ? '-12px' : size === 'md' ? '-16px' : '-20px',
                background: 'radial-gradient(circle, #ffffff 0%, #00ffff 30%, #00d4ff 60%, transparent 100%)',
                filter: 'blur(2px)',
                zIndex: 5,
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Star Core Sharp Center */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px',
                height: size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px',
                marginLeft: size === 'sm' ? '-6px' : size === 'md' ? '-8px' : '-10px',
                marginTop: size === 'sm' ? '-6px' : size === 'md' ? '-8px' : '-10px',
                background: 'radial-gradient(circle, #ffffff 0%, #00ffff 50%, #00d4ff 100%)',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.9), 0 0 40px rgba(0, 212, 255, 0.6)',
                zIndex: 6,
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
              }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Avatar with enhanced glow */}
            <div className="w-full h-full rounded-full overflow-hidden relative z-20">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.2), transparent 70%)',
                  willChange: 'opacity',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
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
        );

    case 'phoenix_immortal':
        return (
          <div className={`${sizeClasses[size]} rounded-full relative`} style={{ padding: '6px' }}>
            {/* Eternal Rebirth Fire Aura - Outermost layer */}
            <div 
              className="absolute rounded-full overflow-visible"
              style={{
                inset: '-8px',
              }}
            >
              {/* Intense pulsing rebirth glow */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: '-10px',
                  background: 'radial-gradient(circle, rgba(255, 140, 0, 0.5) 0%, rgba(255, 69, 0, 0.4) 30%, rgba(255, 215, 0, 0.3) 60%, transparent 100%)',
                  filter: 'blur(6px)',
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Phoenix Wing Flames - Left Wing */}
              {[...Array(8)].map((_, i) => {
                const angle = 180 + (i * 20) - 70;
                const radius = size === 'sm' ? 26 + i * 3 : size === 'md' ? 36 + i * 4 : 50 + i * 5;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const height = size === 'sm' ? 16 - i * 1.5 : size === 'md' ? 22 - i * 2 : 32 - i * 3;

                return (
                  <motion.div
                    key={`left-wing-${i}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '4px',
                      height: `${height}px`,
                      background: 'linear-gradient(to bottom, #fff, #ffd700, #ff8c00, #ff4500, transparent)',
                      borderRadius: '50%',
                      transformOrigin: 'center bottom',
                      filter: 'blur(1px)',
                    }}
                    animate={{
                      x: [x * 0.7, x, x * 0.8, x],
                      y: [y * 0.7, y, y * 0.8, y],
                      scaleY: [0.8, 1.2, 0.9, 1.2, 0.8],
                      opacity: [0.6, 1, 0.7, 1, 0.6],
                      rotate: [angle - 95, angle - 90, angle - 92, angle - 90, angle - 95],
                    }}
                    transition={{
                      duration: 2.5 + i * 0.1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.05,
                    }}
                  />
                );
              })}

              {/* Phoenix Wing Flames - Right Wing */}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 20) - 70;
                const radius = size === 'sm' ? 26 + i * 3 : size === 'md' ? 36 + i * 4 : 50 + i * 5;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const height = size === 'sm' ? 16 - i * 1.5 : size === 'md' ? 22 - i * 2 : 32 - i * 3;

                return (
                  <motion.div
                    key={`right-wing-${i}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '4px',
                      height: `${height}px`,
                      background: 'linear-gradient(to bottom, #fff, #ffd700, #ff8c00, #ff4500, transparent)',
                      borderRadius: '50%',
                      transformOrigin: 'center bottom',
                      filter: 'blur(1px)',
                    }}
                    animate={{
                      x: [x * 0.7, x, x * 0.8, x],
                      y: [y * 0.7, y, y * 0.8, y],
                      scaleY: [0.8, 1.2, 0.9, 1.2, 0.8],
                      opacity: [0.6, 1, 0.7, 1, 0.6],
                      rotate: [angle - 85, angle - 90, angle - 88, angle - 90, angle - 85],
                    }}
                    transition={{
                      duration: 2.5 + i * 0.1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.05,
                    }}
                  />
                );
              })}

              {/* Main Fire Border with Rebirth Color Cycle */}
              <motion.div 
                className="absolute rounded-full"
                style={{
                  inset: '0px',
                  padding: '3px',
                }}
                animate={{
                  background: [
                    'linear-gradient(135deg, #ff4500 0%, #ff8c00 25%, #ffd700 50%, #ffed4e 75%, #fff 100%)',
                    'linear-gradient(135deg, #ffd700 0%, #ffed4e 25%, #fff 50%, #ff8c00 75%, #ff4500 100%)',
                    'linear-gradient(135deg, #fff 0%, #ffd700 25%, #ff8c00 50%, #ff4500 75%, #ff6347 100%)',
                    'linear-gradient(135deg, #ff4500 0%, #ff8c00 25%, #ffd700 50%, #ffed4e 75%, #fff 100%)',
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Spinning flame rings */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #ff4500, #ff8c00, #ffd700, transparent, #ff4500)',
                  }}
                  animate={{
                    rotate: [0, 360],
                    opacity: [0.6, 0.9, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 180deg, transparent, #ffd700, #fff, transparent)',
                  }}
                  animate={{
                    rotate: [360, 0],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </motion.div>

              {/* Divine Golden Feathers */}
              {[...Array(24)].map((_, i) => {
                const angle = (i * 360) / 24;
                const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 38;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const featherSize = size === 'sm' ? 8 : size === 'md' ? 11 : 15;

                return (
                  <motion.div
                    key={`feather-${i}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${featherSize}px`,
                      height: `${featherSize * 1.8}px`,
                      marginLeft: `-${featherSize / 2}px`,
                      marginTop: `-${featherSize * 0.9}px`,
                    }}
                    animate={{
                      x: [x, x * 1.15, x * 0.9, x * 1.1, x],
                      y: [y, y * 1.15, y * 0.9, y * 1.1, y],
                      rotate: [angle, angle + 15, angle - 10, angle + 10, angle],
                      opacity: [0.5, 1, 0.7, 0.9, 0.5],
                      scale: [0.8, 1.3, 0.9, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 3.5 + (i % 5) * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.08,
                    }}
                  >
                    <svg
                      width={featherSize}
                      height={featherSize * 1.8}
                      viewBox="0 0 20 36"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.6))',
                      }}
                    >
                      <defs>
                        <linearGradient id={`featherGrad${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                          <stop offset="30%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                          <stop offset="70%" style={{ stopColor: '#ff8c00', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#ff4500', stopOpacity: 0.8 }} />
                        </linearGradient>
                      </defs>
                      <path
                        d="M10 0 Q4 10 2 20 Q4 28 10 36 Q16 28 18 20 Q16 10 10 0 Z"
                        fill={`url(#featherGrad${i})`}
                        stroke="#ffd700"
                        strokeWidth="0.5"
                      />
                      <path
                        d="M10 0 L10 36"
                        stroke="#ffed4e"
                        strokeWidth="1"
                      />
                    </svg>
                  </motion.div>
                );
              })}

              {/* Floating Embers */}
              {[...Array(40)].map((_, i) => {
                const angle = (i * 360) / 40;
                const radius = size === 'sm' ? 16 + (i % 8) * 2 : size === 'md' ? 22 + (i % 8) * 3 : 32 + (i % 8) * 4;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const colors = ['#fff', '#ffd700', '#ff8c00', '#ff4500'];
                const color = colors[i % colors.length];

                return (
                  <motion.div
                    key={`ember-${i}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '2px',
                      height: '2px',
                      background: `radial-gradient(circle, ${color}, transparent)`,
                      borderRadius: '50%',
                    }}
                    animate={{
                      x: [x, x * 1.4, x * 0.6, x * 1.3, x],
                      y: [y, y * 1.4, y * 0.6, y * 1.3, y],
                      opacity: [0.3, 1, 0.5, 0.8, 0.3],
                      scale: [0.5, 2.5, 1, 2, 0.5],
                    }}
                    transition={{
                      duration: 2.5 + (i % 7) * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.04,
                    }}
                  />
                );
              })}

              {/* Rebirth Flame Bursts */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const radius = size === 'sm' ? 24 : size === 'md' ? 32 : 44;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <motion.div
                    key={`burst-${i}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '3px',
                      height: '12px',
                      background: 'linear-gradient(to bottom, #fff, #ffd700, #ff8c00, transparent)',
                      borderRadius: '50%',
                      transformOrigin: 'center bottom',
                    }}
                    animate={{
                      x: [0, x * 0.8, 0],
                      y: [0, y * 0.8, 0],
                      opacity: [0, 1, 0],
                      scaleY: [0.5, 2.5, 0.5],
                      rotate: [angle - 90, angle - 90, angle - 90],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: i * 0.11,
                    }}
                  />
                );
              })}
            </div>

            {/* Avatar with Phoenix Glow */}
            <div className="w-full h-full rounded-full overflow-hidden relative z-10">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 40% 40%, rgba(255, 215, 0, 0.4), transparent)',
                }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  background: [
                    'radial-gradient(circle at 40% 40%, rgba(255, 215, 0, 0.4), transparent)',
                    'radial-gradient(circle at 40% 40%, rgba(255, 140, 0, 0.5), transparent)',
                    'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.3), transparent)',
                    'radial-gradient(circle at 40% 40%, rgba(255, 215, 0, 0.4), transparent)',
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
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
