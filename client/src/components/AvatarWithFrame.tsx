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
              {/* Animated energy waves - multiple layers */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #ff006e)',
                  opacity: 0.8,
                }}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 180deg, transparent 0%, #ff006e 25%, transparent 50%, #3a86ff 75%, transparent 100%)',
                  opacity: 0.6,
                }}
                animate={{
                  rotate: [360, 0],
                }}
                transition={{
                  duration: 6,
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
                  animate={{
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ) : (
                <motion.div 
                  className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg relative z-10"
                  animate={{
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 4,
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
