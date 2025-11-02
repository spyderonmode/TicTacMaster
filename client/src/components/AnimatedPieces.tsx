import { motion } from "framer-motion";
import { useId } from "react";

interface AnimatedPieceProps {
  symbol: "X" | "O";
  style?: "default" | "thunder" | "fire" | "hammer" | "autumn" | "lovers" | "flower" | "greenleaf" | "cat" | "bestfriends";
  className?: string;
  position?: number;
}

export function AnimatedPiece({ symbol, style = "default", className = "", position }: AnimatedPieceProps) {
  const fallbackId = useId();
  const uniqueId = position ? `piece-${position}` : fallbackId;
  
  if (style === "thunder") {
    return symbol === "X" ? (
      <ThunderX className={className} uniqueId={uniqueId} />
    ) : (
      <ThunderO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "fire") {
    return symbol === "X" ? (
      <FireX className={className} uniqueId={uniqueId} />
    ) : (
      <FireO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "hammer") {
    return symbol === "X" ? (
      <HammerX className={className} uniqueId={uniqueId} />
    ) : (
      <HammerO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "autumn") {
    return symbol === "X" ? (
      <AutumnX className={className} uniqueId={uniqueId} />
    ) : (
      <AutumnO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "lovers") {
    return symbol === "X" ? (
      <LoversX className={className} uniqueId={uniqueId} />
    ) : (
      <LoversO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "flower") {
    return symbol === "X" ? (
      <FlowerX className={className} uniqueId={uniqueId} />
    ) : (
      <FlowerO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "greenleaf") {
    return symbol === "X" ? (
      <GreenLeafX className={className} uniqueId={uniqueId} />
    ) : (
      <GreenLeafO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "cat") {
    return symbol === "X" ? (
      <CatX className={className} uniqueId={uniqueId} />
    ) : (
      <CatO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "bestfriends") {
    return symbol === "X" ? (
      <BestFriendsX className={className} uniqueId={uniqueId} />
    ) : (
      <BestFriendsO className={className} uniqueId={uniqueId} />
    );
  }

  return <span className={className}>{symbol}</span>;
}

function ThunderX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 2px 6px rgba(59, 130, 246, 0.3)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`xGradient1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(59, 130, 246)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(96, 165, 250)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(37, 99, 235)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`xGradient2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(59, 130, 246)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(96, 165, 250)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(37, 99, 235)", stopOpacity: 1 }} />
          </linearGradient>
          <filter id={`bevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
            <feOffset in="blur" dx="1" dy="1" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="2.5" specularConstant="0.4" specularExponent="15" lightingColor="#white" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.path
          d="M 20 20 L 80 80"
          stroke={`url(#xGradient1-${uniqueId})`}
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ transform: "translate(3px, 3px)" }}
        />

        <motion.path
          d="M 80 20 L 20 80"
          stroke={`url(#xGradient2-${uniqueId})`}
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          style={{ transform: "translate(3px, 3px)" }}
        />

        <motion.path
          d="M 20 20 L 80 80"
          stroke={`url(#xGradient1-${uniqueId})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          filter={`url(#bevel-${uniqueId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        <motion.path
          d="M 80 20 L 20 80"
          stroke={`url(#xGradient2-${uniqueId})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          filter={`url(#bevel-${uniqueId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        />

        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 1, 0],
            scale: [0, 1.5, 1.5, 1.5, 0]
          }}
          transition={{
            duration: 0.6,
            times: [0, 0.2, 0.4, 0.6, 1],
            ease: "easeOut"
          }}
        >
          <path
            d="M 35 12 L 40 22 L 50 20 L 45 30 L 55 37 L 43 37 L 40 47 L 35 37 L 23 38 L 30 30 L 25 20 Z"
            fill="rgba(135, 206, 250, 0.8)"
            stroke="rgba(59, 130, 246, 0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 1, 0],
            scale: [0, 1.5, 1.5, 1.5, 0]
          }}
          transition={{
            duration: 0.6,
            times: [0, 0.2, 0.4, 0.6, 1],
            ease: "easeOut",
            delay: 0.1
          }}
        >
          <path
            d="M 65 55 L 70 65 L 80 63 L 75 73 L 85 80 L 73 80 L 70 90 L 65 80 L 53 81 L 60 73 L 55 63 Z"
            fill="rgba(147, 197, 253, 0.8)"
            stroke="rgba(96, 165, 250, 0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <path
            d="M 38 12 L 43 22 L 52 23 L 48 32 L 50 40"
            stroke="rgba(135, 206, 250, 0.9)"
            strokeWidth="2.5"
            fill="none"
            opacity="0.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 62 12 L 57 22 L 67 20 L 55 37 L 65 32 L 57 45"
            stroke="rgba(135, 206, 250, 0.9)"
            strokeWidth="2"
            fill="rgba(135, 206, 250, 0.15)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function ThunderO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 2px 6px rgba(239, 68, 68, 0.3)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <radialGradient id={`oGradient-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(252, 165, 165)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(248, 113, 113)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(220, 38, 38)", stopOpacity: 1 }} />
          </radialGradient>
          <filter id={`bevelO-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
            <feOffset in="blur" dx="1" dy="1" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="2.5" specularConstant="0.4" specularExponent="15" lightingColor="#white" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#oGradient-${uniqueId})`}
          strokeWidth="16"
          fill="none"
          opacity="0.3"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%", transform: "translate(3px, 3px)" }}
        />

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#oGradient-${uniqueId})`}
          strokeWidth="14"
          fill="none"
          filter={`url(#bevelO-${uniqueId})`}
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 1, 0],
            scale: [0, 2, 2, 2, 0]
          }}
          transition={{
            duration: 0.8,
            times: [0, 0.2, 0.5, 0.7, 1],
            ease: "easeOut"
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(252, 165, 165, 0.6)"
            strokeWidth="3"
            opacity="0.4"
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <path
            d="M 28 12 L 33 22 L 42 23 L 38 32 L 40 40"
            stroke="rgba(248, 113, 113, 0.9)"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 52 12 L 47 22 L 57 20 L 45 37 L 55 32 L 47 45"
            stroke="rgba(252, 165, 165, 0.9)"
            strokeWidth="2"
            fill="rgba(252, 165, 165, 0.15)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 72 20 L 67 30 L 77 28 L 65 45 L 75 40 L 67 53"
            stroke="rgba(239, 68, 68, 0.9)"
            strokeWidth="2.5"
            fill="none"
            opacity="0.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function FireX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 3px 8px rgba(255, 69, 0, 0.4)) drop-shadow(0 5px 15px rgba(255, 140, 0, 0.3))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`fireGradient1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(255, 223, 0)", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "rgb(255, 140, 0)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(220, 38, 38)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`fireGradient2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(255, 223, 0)", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "rgb(255, 140, 0)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(220, 38, 38)", stopOpacity: 1 }} />
          </linearGradient>
          <filter id={`fireBevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur"/>
            <feOffset in="blur" dx="1.5" dy="1.5" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.5" specularExponent="18" lightingColor="#FFD700" result="specOut">
              <fePointLight x="-5000" y="-10000" z="25000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.path
          d="M 22 22 L 78 78"
          stroke={`url(#fireGradient1-${uniqueId})`}
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ transform: "translate(4px, 4px)" }}
        />

        <motion.path
          d="M 78 22 L 22 78"
          stroke={`url(#fireGradient2-${uniqueId})`}
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
          style={{ transform: "translate(4px, 4px)" }}
        />

        <motion.path
          d="M 22 22 L 78 78"
          stroke={`url(#fireGradient1-${uniqueId})`}
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
          filter={`url(#fireBevel-${uniqueId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />

        <motion.path
          d="M 78 22 L 22 78"
          stroke={`url(#fireGradient2-${uniqueId})`}
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
          filter={`url(#fireBevel-${uniqueId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
        />

        <motion.g
          animate={{
            y: [0, -2, 0, -3, 0],
            opacity: [0.7, 1, 0.8, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 35 15 Q 35 10, 38 8 Q 41 10, 38 15 Q 35 13, 35 15 Z"
            fill="rgba(255, 223, 0, 0.9)"
            opacity="0.8"
          />
          <path
            d="M 62 15 Q 62 10, 65 8 Q 68 10, 65 15 Q 62 13, 62 15 Z"
            fill="rgba(255, 140, 0, 0.9)"
            opacity="0.85"
          />
          <path
            d="M 62 85 Q 62 80, 65 78 Q 68 80, 65 85 Q 62 83, 62 85 Z"
            fill="rgba(220, 38, 38, 0.9)"
            opacity="0.8"
          />
          <path
            d="M 35 85 Q 35 80, 38 78 Q 41 80, 38 85 Q 35 83, 35 85 Z"
            fill="rgba(255, 140, 0, 0.9)"
            opacity="0.9"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function FireO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 3px 8px rgba(220, 38, 38, 0.4)) drop-shadow(0 5px 15px rgba(255, 69, 0, 0.3))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <radialGradient id={`fireOGradient-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(255, 223, 0)", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "rgb(255, 100, 0)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(180, 20, 0)", stopOpacity: 1 }} />
          </radialGradient>
          <filter id={`fireOBevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur"/>
            <feOffset in="blur" dx="1.5" dy="1.5" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.5" specularExponent="18" lightingColor="#FFD700" result="specOut">
              <fePointLight x="-5000" y="-10000" z="25000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#fireOGradient-${uniqueId})`}
          strokeWidth="18"
          fill="none"
          opacity="0.4"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%", transform: "translate(4px, 4px)" }}
        />

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#fireOGradient-${uniqueId})`}
          strokeWidth="15"
          fill="none"
          filter={`url(#fireOBevel-${uniqueId})`}
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        <motion.g
          animate={{
            scale: [1, 1.15, 1, 1.1, 1],
            opacity: [0.6, 0.9, 0.7, 0.95, 0.6]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke="rgba(255, 140, 0, 0.3)"
            strokeWidth="4"
          />
        </motion.g>

        <motion.g
          animate={{
            y: [0, -3, 0, -2, 0],
            opacity: [0.7, 1, 0.8, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 50 18 Q 50 13, 53 11 Q 56 13, 53 18 Q 50 16, 50 18 Z"
            fill="rgba(255, 223, 0, 0.9)"
            opacity="0.8"
          />
          <path
            d="M 82 50 Q 82 45, 85 43 Q 88 45, 85 50 Q 82 48, 82 50 Z"
            fill="rgba(255, 140, 0, 0.9)"
            opacity="0.85"
          />
          <path
            d="M 50 82 Q 50 77, 53 75 Q 56 77, 53 82 Q 50 80, 50 82 Z"
            fill="rgba(220, 38, 38, 0.9)"
            opacity="0.8"
          />
          <path
            d="M 18 50 Q 18 45, 21 43 Q 24 45, 21 50 Q 18 48, 18 50 Z"
            fill="rgba(255, 100, 0, 0.9)"
            opacity="0.9"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function HammerX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={`hammerGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(120, 120, 120)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(160, 160, 160)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(100, 100, 100)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`xBlue-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(59, 130, 246)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(37, 99, 235)", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        <motion.g
          initial={{ y: -80, opacity: 1 }}
          animate={{ 
            y: [null, 0, 2, 0, -80],
            opacity: [null, 1, 1, 1, 0]
          }}
          transition={{ 
            duration: 0.5,
            times: [0, 0.4, 0.5, 0.6, 1],
            ease: [0.2, 0.8, 0.2, 1]
          }}
        >
          <rect x="44" y="30" width="12" height="25" rx="2" fill={`url(#hammerGrad-${uniqueId})`} />
          <rect x="38" y="25" width="24" height="12" rx="3" fill={`url(#hammerGrad-${uniqueId})`} />
        </motion.g>

        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2, ease: "backOut" }}
        >
          <motion.path
            d="M 25 25 L 75 75"
            stroke={`url(#xBlue-${uniqueId})`}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <motion.path
            d="M 75 25 L 25 75"
            stroke={`url(#xBlue-${uniqueId})`}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill="rgba(255, 255, 255, 0.8)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 2, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            delay: 0.25,
            duration: 0.2,
            ease: "easeOut"
          }}
        />
      </svg>
    </motion.div>
  );
}

function HammerO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={`hammerOGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(120, 120, 120)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(160, 160, 160)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(100, 100, 100)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`oRed-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(252, 165, 165)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(220, 38, 38)", stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        <motion.g
          initial={{ y: -80, opacity: 1 }}
          animate={{ 
            y: [null, 0, 2, 0, -80],
            opacity: [null, 1, 1, 1, 0]
          }}
          transition={{ 
            duration: 0.5,
            times: [0, 0.4, 0.5, 0.6, 1],
            ease: [0.2, 0.8, 0.2, 1]
          }}
        >
          <rect x="44" y="30" width="12" height="25" rx="2" fill={`url(#hammerOGrad-${uniqueId})`} />
          <rect x="38" y="25" width="24" height="12" rx="3" fill={`url(#hammerOGrad-${uniqueId})`} />
        </motion.g>

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#oRed-${uniqueId})`}
          strokeWidth="14"
          fill="none"
          initial={{ pathLength: 0, opacity: 0, rotate: -90 }}
          animate={{ pathLength: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.2, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill="rgba(255, 255, 255, 0.8)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 2, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            delay: 0.25,
            duration: 0.2,
            ease: "easeOut"
          }}
        />
      </svg>
    </motion.div>
  );
}

function AutumnX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 2px 6px rgba(217, 119, 6, 0.3)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`autumnXGrad1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(245, 158, 11)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(217, 119, 6)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(180, 83, 9)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`autumnXGrad2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(245, 158, 11)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(220, 38, 38)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(153, 27, 27)", stopOpacity: 1 }} />
          </linearGradient>
          <filter id={`autumnBevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
            <feOffset in="blur" dx="1" dy="1" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="2.5" specularConstant="0.4" specularExponent="15" lightingColor="#FCD34D" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.path
          d="M 20 20 L 80 80"
          stroke={`url(#autumnXGrad1-${uniqueId})`}
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ transform: "translate(3px, 3px)" }}
        />

        <motion.path
          d="M 80 20 L 20 80"
          stroke={`url(#autumnXGrad2-${uniqueId})`}
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          style={{ transform: "translate(3px, 3px)" }}
        />

        <motion.path
          d="M 20 20 L 80 80"
          stroke={`url(#autumnXGrad1-${uniqueId})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          filter={`url(#autumnBevel-${uniqueId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        <motion.path
          d="M 80 20 L 20 80"
          stroke={`url(#autumnXGrad2-${uniqueId})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          filter={`url(#autumnBevel-${uniqueId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        />

        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <path
            d="M 28 20 C 28 17, 30 16, 31 18 C 32 16, 34 17, 33 19 L 30 24 L 26 23 Z"
            fill="#DC2626"
            opacity="0.9"
          />
          <path
            d="M 70 22 C 70 19, 72 18, 73 20 C 74 18, 76 19, 75 21 L 72 26 L 68 25 Z"
            fill="#EA580C"
            opacity="0.9"
          />
          <path
            d="M 72 78 C 72 75, 74 74, 75 76 C 76 74, 78 75, 77 77 L 74 82 L 70 81 Z"
            fill="#F59E0B"
            opacity="0.9"
          />
          <path
            d="M 28 80 C 28 77, 30 76, 31 78 C 32 76, 34 77, 33 79 L 30 84 L 26 83 Z"
            fill="#D97706"
            opacity="0.9"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function AutumnO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 2px 6px rgba(220, 38, 38, 0.3)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <radialGradient id={`autumnOGradient-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(252, 211, 77)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(245, 158, 11)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(220, 38, 38)", stopOpacity: 1 }} />
          </radialGradient>
          <filter id={`autumnOBevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
            <feOffset in="blur" dx="1" dy="1" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="2.5" specularConstant="0.4" specularExponent="15" lightingColor="#FCD34D" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
          <linearGradient id={`autumnOHighlight-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(254, 243, 199)", stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: "rgb(245, 158, 11)", stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#autumnOGradient-${uniqueId})`}
          strokeWidth="16"
          fill="none"
          opacity="0.3"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%", transform: "translate(3px, 3px)" }}
        />

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#autumnOGradient-${uniqueId})`}
          strokeWidth="14"
          fill="none"
          filter={`url(#autumnOBevel-${uniqueId})`}
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#autumnOHighlight-${uniqueId})`}
          strokeWidth="6"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          style={{ originX: "50%", originY: "50%", transform: "translate(-2px, -2px)" }}
        />
        
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <path
            d="M 35 28 C 35 25, 37 24, 38 26 C 39 24, 41 25, 40 27 L 37 32 L 33 31 Z"
            fill="#DC2626"
            opacity="0.9"
          />
          <path
            d="M 68 30 C 68 27, 70 26, 71 28 C 72 26, 74 27, 73 29 L 70 34 L 66 33 Z"
            fill="#EA580C"
            opacity="0.9"
          />
          <path
            d="M 70 65 C 70 62, 72 61, 73 63 C 74 61, 76 62, 75 64 L 72 69 L 68 68 Z"
            fill="#F59E0B"
            opacity="0.9"
          />
          <path
            d="M 32 66 C 32 63, 34 62, 35 64 C 36 62, 38 63, 37 65 L 34 70 L 30 69 Z"
            fill="#D97706"
            opacity="0.9"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function LoversX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateY: -180 }}
      animate={{ 
        scale: 1,
        rotateY: [0, 180, 360, 540],
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 400, damping: 20 },
        rotateY: { duration: 2, ease: "easeInOut", repeat: Infinity }
      }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`loversXGrad1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(219, 39, 119)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(190, 24, 93)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`loversXGrad2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(251, 113, 133)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(219, 39, 119)", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Main X with 3D effect */}
        <motion.path
          d="M 25 25 L 75 75"
          stroke={`url(#loversXGrad1-${uniqueId})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        <motion.path
          d="M 75 25 L 25 75"
          stroke={`url(#loversXGrad2-${uniqueId})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        />

        {/* Animated floating hearts */}
        <motion.g
          animate={{
            y: [-3, 3, -3],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 50 45 C 50 40, 45 37, 42 40 C 39 37, 34 40, 34 45 C 34 52, 50 60, 50 60 C 50 60, 66 52, 66 45 C 66 40, 61 37, 58 40 C 55 37, 50 40, 50 45 Z"
            fill="rgb(244, 114, 182)"
            opacity="0.7"
          />
        </motion.g>

        <motion.g
          animate={{
            y: [2, -2, 2],
            rotate: [0, -3, 3, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        >
          <path
            d="M 30 22 C 30 20, 28 19, 27 20 C 26 19, 24 20, 24 22 C 24 25, 30 29, 30 29 C 30 29, 36 25, 36 22 C 36 20, 34 19, 33 20 C 32 19, 30 20, 30 22 Z"
            fill="rgb(251, 113, 133)"
            opacity="0.8"
          />
        </motion.g>

        <motion.g
          animate={{
            y: [-2, 2, -2],
            rotate: [0, 4, -4, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <path
            d="M 73 75 C 73 73, 71 72, 70 73 C 69 72, 67 73, 67 75 C 67 78, 73 82, 73 82 C 73 82, 79 78, 79 75 C 79 73, 77 72, 76 73 C 75 72, 73 73, 73 75 Z"
            fill="rgb(236, 72, 153)"
            opacity="0.75"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function LoversO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateY: 180 }}
      animate={{ 
        scale: 1,
        rotateY: [0, -180, -360, -540],
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 400, damping: 20 },
        rotateY: { duration: 2, ease: "easeInOut", repeat: Infinity }
      }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <radialGradient id={`loversOGrad-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(251, 113, 133)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(244, 114, 182)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(219, 39, 119)", stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        {/* Main circle with 3D effect */}
        <motion.circle
          cx="50"
          cy="50"
          r="28"
          stroke={`url(#loversOGrad-${uniqueId})`}
          strokeWidth="14"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        {/* Animated floating hearts around circle */}
        <motion.g
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <path
            d="M 50 20 C 50 18, 48 17, 47 18 C 46 17, 44 18, 44 20 C 44 23, 50 27, 50 27 C 50 27, 56 23, 56 20 C 56 18, 54 17, 53 18 C 52 17, 50 18, 50 20 Z"
            fill="rgb(244, 114, 182)"
            opacity="0.8"
          />
        </motion.g>

        <motion.g
          animate={{
            rotate: [120, 480],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <path
            d="M 76 40 C 76 38, 74 37, 73 38 C 72 37, 70 38, 70 40 C 70 43, 76 47, 76 47 C 76 47, 82 43, 82 40 C 82 38, 80 37, 79 38 C 78 37, 76 38, 76 40 Z"
            fill="rgb(251, 113, 133)"
            opacity="0.75"
          />
        </motion.g>

        <motion.g
          animate={{
            rotate: [240, 600],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <path
            d="M 24 60 C 24 58, 22 57, 21 58 C 20 57, 18 58, 18 60 C 18 63, 24 67, 24 67 C 24 67, 30 63, 30 60 C 30 58, 28 57, 27 58 C 26 57, 24 58, 24 60 Z"
            fill="rgb(236, 72, 153)"
            opacity="0.7"
          />
        </motion.g>

        {/* Center heart that pulses */}
        <motion.g
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0.9, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 50 45 C 50 42, 47 40, 45 42 C 43 40, 40 42, 40 45 C 40 50, 50 56, 50 56 C 50 56, 60 50, 60 45 C 60 42, 57 40, 55 42 C 53 40, 50 42, 50 45 Z"
            fill="rgb(251, 113, 133)"
            opacity="0.6"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function FlowerX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id={`flowerXPetal-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "rgb(251, 113, 133)", stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: "rgb(244, 63, 94)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 1 }} />
            </linearGradient>
            <radialGradient id={`flowerXCenter-${uniqueId}`}>
              <stop offset="0%" style={{ stopColor: "rgb(253, 224, 71)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "rgb(250, 204, 21)", stopOpacity: 1 }} />
            </radialGradient>
          </defs>

          {/* Falling petals in background */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.ellipse
              key={`falling-${i}`}
              cx={15 + i * 10}
              cy={0}
              rx="2"
              ry="3"
              fill={`url(#flowerXPetal-${uniqueId})`}
              opacity="0.4"
              animate={{
                cy: [0, 100],
                opacity: [0, 0.6, 0.4, 0],
                rotate: [0, 360]
              }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "linear"
              }}
            />
          ))}

          {/* Diagonal 1: Top-left to bottom-right flowers */}
          {[
            { x: 22, y: 22 },
            { x: 35, y: 35 },
            { x: 50, y: 50 },
            { x: 65, y: 65 },
            { x: 78, y: 78 }
          ].map((pos, i) => (
            <motion.g 
              key={`diag1-${i}`}
              animate={{
                scale: [1, 1.08, 1]
              }}
              transition={{
                duration: 2 + i * 0.2,
                ease: "easeInOut",
                repeat: Infinity
              }}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              <ellipse cx={pos.x} cy={pos.y - 4} rx="4" ry="6" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 4} cy={pos.y} rx="6" ry="4" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x} cy={pos.y + 4} rx="4" ry="6" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 4} cy={pos.y} rx="6" ry="4" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 3} cy={pos.y - 3} rx="5" ry="5" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 3} cy={pos.y - 3} rx="5" ry="5" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 3} cy={pos.y + 3} rx="5" ry="5" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 3} cy={pos.y + 3} rx="5" ry="5" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <circle cx={pos.x} cy={pos.y} r="3" fill={`url(#flowerXCenter-${uniqueId})`} />
            </motion.g>
          ))}

          {/* Diagonal 2: Top-right to bottom-left flowers */}
          {[
            { x: 78, y: 22 },
            { x: 65, y: 35 },
            { x: 50, y: 50 },
            { x: 35, y: 65 },
            { x: 22, y: 78 }
          ].map((pos, i) => (
            <motion.g 
              key={`diag2-${i}`}
              animate={{
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2.5 + i * 0.2,
                ease: "easeInOut",
                repeat: Infinity
              }}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              <ellipse cx={pos.x} cy={pos.y - 4} rx="4" ry="6" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 4} cy={pos.y} rx="6" ry="4" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x} cy={pos.y + 4} rx="4" ry="6" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 4} cy={pos.y} rx="6" ry="4" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 3} cy={pos.y - 3} rx="5" ry="5" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 3} cy={pos.y - 3} rx="5" ry="5" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 3} cy={pos.y + 3} rx="5" ry="5" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 3} cy={pos.y + 3} rx="5" ry="5" fill={`url(#flowerXPetal-${uniqueId})`} opacity="0.95" />
              <circle cx={pos.x} cy={pos.y} r="3" fill={`url(#flowerXCenter-${uniqueId})`} />
            </motion.g>
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

function FlowerO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  const centerX = 50;
  const centerY = 50;
  const radius = 28;
  const numFlowers = 12;

  const flowerPositions = Array.from({ length: numFlowers }, (_, i) => {
    const angle = (i / numFlowers) * Math.PI * 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id={`flowerOPetal-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "rgb(196, 181, 253)", stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: "rgb(167, 139, 250)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "rgb(147, 51, 234)", stopOpacity: 1 }} />
            </linearGradient>
            <radialGradient id={`flowerOCenter-${uniqueId}`}>
              <stop offset="0%" style={{ stopColor: "rgb(254, 215, 170)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "rgb(251, 146, 60)", stopOpacity: 1 }} />
            </radialGradient>
          </defs>

          {/* Falling petals in background */}
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.ellipse
              key={`falling-${i}`}
              cx={10 + i * 9}
              cy={0}
              rx="2"
              ry="3"
              fill={`url(#flowerOPetal-${uniqueId})`}
              opacity="0.4"
              animate={{
                cy: [0, 100],
                opacity: [0, 0.6, 0.4, 0],
                rotate: [0, 360]
              }}
              transition={{
                duration: 3.5 + i * 0.25,
                repeat: Infinity,
                delay: i * 0.35,
                ease: "linear"
              }}
            />
          ))}

          {/* Circular arrangement of flowers forming an O */}
          {flowerPositions.map((pos, i) => (
            <motion.g 
              key={`flower-${i}`}
              animate={{
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2.2 + i * 0.15,
                ease: "easeInOut",
                repeat: Infinity
              }}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              <ellipse cx={pos.x} cy={pos.y - 4} rx="4" ry="6" fill={`url(#flowerOPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 4} cy={pos.y} rx="6" ry="4" fill={`url(#flowerOPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x} cy={pos.y + 4} rx="4" ry="6" fill={`url(#flowerOPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 4} cy={pos.y} rx="6" ry="4" fill={`url(#flowerOPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 3} cy={pos.y - 3} rx="5" ry="5" fill={`url(#flowerOPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 3} cy={pos.y - 3} rx="5" ry="5" fill={`url(#flowerOPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x + 3} cy={pos.y + 3} rx="5" ry="5" fill={`url(#flowerOPetal-${uniqueId})`} opacity="0.95" />
              <ellipse cx={pos.x - 3} cy={pos.y + 3} rx="5" ry="5" fill={`url(#flowerOPetal-${uniqueId})`} opacity="0.95" />
              <circle cx={pos.x} cy={pos.y} r="3" fill={`url(#flowerOCenter-${uniqueId})`} />
            </motion.g>
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

function GreenLeafX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateZ: -90, opacity: 0 }}
      animate={{ scale: 1, rotateZ: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.6 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1200px"
      }}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`wreathLeafX-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(187, 247, 208)", stopOpacity: 1 }} />
            <stop offset="35%" style={{ stopColor: "rgb(134, 239, 172)", stopOpacity: 1 }} />
            <stop offset="65%" style={{ stopColor: "rgb(74, 222, 128)", stopOpacity: 1 }} />
            <stop offset="85%" style={{ stopColor: "rgb(34, 197, 94)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(22, 163, 74)", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Diagonal Line 1 (top-left to bottom-right) - Leaves arranged in X pattern */}
        {Array.from({ length: 8 }).map((_, i) => {
          const t = i / 7;
          const x = 20 + t * 80;
          const y = 20 + t * 80;
          const rotation = 135;
          
          return (
            <motion.g
              key={`x-leaf-1-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.04,
                ease: "easeOut"
              }}
            >
              <motion.path
                d={`M ${x} ${y} Q ${x + 8} ${y - 3} ${x + 12} ${y} Q ${x + 10} ${y + 5} ${x + 8} ${y + 10} Q ${x + 4} ${y + 14} ${x} ${y + 16} Q ${x - 4} ${y + 14} ${x - 8} ${y + 10} Q ${x - 10} ${y + 5} ${x - 12} ${y} Q ${x - 8} ${y - 3} ${x} ${y} Z`}
                fill={`url(#wreathLeafX-${uniqueId})`}
                stroke="none"
                transform={`rotate(${rotation} ${x} ${y})`}
                animate={{
                  scale: [1, 1.08, 1],
                  rotateZ: [0, 4, 0]
                }}
                transition={{
                  duration: 3 + (i % 3) * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.12
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />

              <motion.path
                d={`M ${x} ${y} L ${x} ${y + 14}`}
                stroke="rgba(22, 163, 74, 0.35)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                transform={`rotate(${rotation} ${x} ${y})`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.04 + 0.2
                }}
              />

              <motion.g
                transform={`rotate(${rotation} ${x} ${y})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.04 + 0.3
                }}
              >
                <path d={`M ${x} ${y + 4} L ${x - 4} ${y + 6}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 4} L ${x + 4} ${y + 6}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 9} L ${x - 4} ${y + 10}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 9} L ${x + 4} ${y + 10}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
              </motion.g>
            </motion.g>
          );
        })}

        {/* Diagonal Line 2 (top-right to bottom-left) - Leaves arranged in X pattern */}
        {Array.from({ length: 8 }).map((_, i) => {
          const t = i / 7;
          const x = 100 - t * 80;
          const y = 20 + t * 80;
          const rotation = 45;
          
          return (
            <motion.g
              key={`x-leaf-2-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.04 + 0.1,
                ease: "easeOut"
              }}
            >
              <motion.path
                d={`M ${x} ${y} Q ${x + 8} ${y - 3} ${x + 12} ${y} Q ${x + 10} ${y + 5} ${x + 8} ${y + 10} Q ${x + 4} ${y + 14} ${x} ${y + 16} Q ${x - 4} ${y + 14} ${x - 8} ${y + 10} Q ${x - 10} ${y + 5} ${x - 12} ${y} Q ${x - 8} ${y - 3} ${x} ${y} Z`}
                fill={`url(#wreathLeafX-${uniqueId})`}
                stroke="none"
                transform={`rotate(${rotation} ${x} ${y})`}
                animate={{
                  scale: [1, 1.08, 1],
                  rotateZ: [0, -4, 0]
                }}
                transition={{
                  duration: 3 + ((i + 1) % 3) * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.12 + 0.15
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />

              <motion.path
                d={`M ${x} ${y} L ${x} ${y + 14}`}
                stroke="rgba(22, 163, 74, 0.35)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                transform={`rotate(${rotation} ${x} ${y})`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.04 + 0.3
                }}
              />

              <motion.g
                transform={`rotate(${rotation} ${x} ${y})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.04 + 0.4
                }}
              >
                <path d={`M ${x} ${y + 4} L ${x - 4} ${y + 6}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 4} L ${x + 4} ${y + 6}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 9} L ${x - 4} ${y + 10}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 9} L ${x + 4} ${y + 10}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
              </motion.g>
            </motion.g>
          );
        })}

        {/* Sparkle particles along X */}
        {Array.from({ length: 10 }).map((_, i) => {
          const t = (i % 5) / 4;
          const isDiagonal1 = i < 5;
          const x = isDiagonal1 ? 20 + t * 80 : 100 - t * 80;
          const y = 20 + t * 80;
          
          return (
            <motion.circle
              key={`sparkle-x-${i}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="rgb(220, 252, 231)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function GreenLeafO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.6 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1200px"
      }}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`wreathLeaf-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(187, 247, 208)", stopOpacity: 1 }} />
            <stop offset="35%" style={{ stopColor: "rgb(134, 239, 172)", stopOpacity: 1 }} />
            <stop offset="65%" style={{ stopColor: "rgb(74, 222, 128)", stopOpacity: 1 }} />
            <stop offset="85%" style={{ stopColor: "rgb(34, 197, 94)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(22, 163, 74)", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Circular Leaf Wreath */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 22.5) * Math.PI / 180;
          const x = 60 + Math.cos(angle) * 35;
          const y = 60 + Math.sin(angle) * 35;
          const rotation = (i * 22.5) + 90;
          
          return (
            <motion.g
              key={`wreath-leaf-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.04,
                ease: "easeOut"
              }}
            >
              {/* Leaf shape */}
              <motion.path
                d={`M ${x} ${y} Q ${x + 8} ${y - 3} ${x + 12} ${y} Q ${x + 10} ${y + 5} ${x + 8} ${y + 10} Q ${x + 4} ${y + 14} ${x} ${y + 16} Q ${x - 4} ${y + 14} ${x - 8} ${y + 10} Q ${x - 10} ${y + 5} ${x - 12} ${y} Q ${x - 8} ${y - 3} ${x} ${y} Z`}
                fill={`url(#wreathLeaf-${uniqueId})`}
                stroke="none"
                transform={`rotate(${rotation} ${x} ${y})`}
                animate={{
                  scale: [1, 1.08, 1],
                  rotateZ: [0, 4, 0]
                }}
                transition={{
                  duration: 3 + (i % 3) * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.12
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />

              {/* Leaf vein */}
              <motion.path
                d={`M ${x} ${y} L ${x} ${y + 14}`}
                stroke="rgba(22, 163, 74, 0.35)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                transform={`rotate(${rotation} ${x} ${y})`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.04 + 0.2
                }}
              />

              {/* Side veins */}
              <motion.g
                transform={`rotate(${rotation} ${x} ${y})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.04 + 0.3
                }}
              >
                <path d={`M ${x} ${y + 4} L ${x - 4} ${y + 6}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 4} L ${x + 4} ${y + 6}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 9} L ${x - 4} ${y + 10}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x} ${y + 9} L ${x + 4} ${y + 10}`} stroke="rgba(22, 163, 74, 0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
              </motion.g>
            </motion.g>
          );
        })}

        {/* Sparkle particles */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * 36) * Math.PI / 180;
          const radius = 35 + (i % 2) * 8;
          const x = 60 + Math.cos(angle) * radius;
          const y = 60 + Math.sin(angle) * radius;
          
          return (
            <motion.circle
              key={`sparkle-o-${i}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="rgb(220, 252, 231)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}


function CatX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateX: -180, rotateZ: 0 }}
      animate={{ 
        scale: 1,
        rotateX: [0, 360, 720],
        rotateZ: [0, -45, 45, 0]
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 300, damping: 18 },
        rotateX: { duration: 4, ease: "easeInOut", repeat: Infinity },
        rotateZ: { duration: 2, ease: "easeInOut", repeat: Infinity }
      }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1200px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`catXScratch1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(251, 146, 60)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(249, 115, 22)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(234, 88, 12)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`catXScratch2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(252, 165, 165)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(248, 113, 113)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(239, 68, 68)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`catPaw-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(251, 113, 133)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        {/* Cat claw scratches forming X */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Triple scratch marks for first diagonal */}
          <motion.path
            d="M 22 18 L 78 74"
            stroke={`url(#catXScratch1-${uniqueId})`}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          <motion.path
            d="M 26 22 L 82 78"
            stroke={`url(#catXScratch1-${uniqueId})`}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
            opacity="0.8"
          />
          <motion.path
            d="M 18 22 L 74 78"
            stroke={`url(#catXScratch1-${uniqueId})`}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            opacity="0.7"
          />

          {/* Triple scratch marks for second diagonal */}
          <motion.path
            d="M 78 18 L 22 74"
            stroke={`url(#catXScratch2-${uniqueId})`}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
          />
          <motion.path
            d="M 74 22 L 18 78"
            stroke={`url(#catXScratch2-${uniqueId})`}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
            opacity="0.8"
          />
          <motion.path
            d="M 82 22 L 26 78"
            stroke={`url(#catXScratch2-${uniqueId})`}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.25 }}
            opacity="0.7"
          />
        </motion.g>

        {/* Cat paw prints bouncing around */}
        <motion.g
          animate={{
            rotate: [0, 360],
            scale: [1, 1.15, 1]
          }}
          transition={{
            rotate: { duration: 6, ease: "linear", repeat: Infinity },
            scale: { duration: 2, ease: "easeInOut", repeat: Infinity }
          }}
        >
          {/* Top left paw */}
          <g>
            <ellipse cx="20" cy="20" rx="3.5" ry="5" fill={`url(#catPaw-${uniqueId})`} opacity="0.75" />
            <ellipse cx="17" cy="14" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
            <ellipse cx="20" cy="12" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
            <ellipse cx="23" cy="14" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
          </g>
          
          {/* Top right paw */}
          <g>
            <ellipse cx="80" cy="20" rx="3.5" ry="5" fill={`url(#catPaw-${uniqueId})`} opacity="0.75" />
            <ellipse cx="77" cy="14" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
            <ellipse cx="80" cy="12" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
            <ellipse cx="83" cy="14" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
          </g>

          {/* Bottom left paw */}
          <g>
            <ellipse cx="20" cy="80" rx="3.5" ry="5" fill={`url(#catPaw-${uniqueId})`} opacity="0.75" />
            <ellipse cx="17" cy="74" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
            <ellipse cx="20" cy="72" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
            <ellipse cx="23" cy="74" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
          </g>

          {/* Bottom right paw */}
          <g>
            <ellipse cx="80" cy="80" rx="3.5" ry="5" fill={`url(#catPaw-${uniqueId})`} opacity="0.75" />
            <ellipse cx="77" cy="74" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
            <ellipse cx="80" cy="72" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
            <ellipse cx="83" cy="74" rx="2" ry="2.5" fill={`url(#catPaw-${uniqueId})`} opacity="0.7" />
          </g>
        </motion.g>
      </svg>
    </motion.div>
  );
}

function CatO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateX: 180, rotateZ: 0 }}
      animate={{ 
        scale: 1,
        rotateX: [0, -360, -720],
        rotateZ: [0, 30, -30, 0]
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 300, damping: 18 },
        rotateX: { duration: 4, ease: "easeInOut", repeat: Infinity },
        rotateZ: { duration: 2, ease: "easeInOut", repeat: Infinity }
      }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1200px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <radialGradient id={`catBody-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(251, 191, 36)", stopOpacity: 1 }} />
            <stop offset="60%" style={{ stopColor: "rgb(245, 158, 11)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(217, 119, 6)", stopOpacity: 1 }} />
          </radialGradient>
          <linearGradient id={`catStripe-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "rgb(234, 88, 12)", stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: "rgb(194, 65, 12)", stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>

        {/* Main curled up cat body (circle) */}
        <motion.circle
          cx="50"
          cy="50"
          r="28"
          stroke={`url(#catBody-${uniqueId})`}
          strokeWidth="15"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        {/* Cat stripes on the circle */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <path
            d="M 28 30 Q 50 32, 72 30"
            stroke={`url(#catStripe-${uniqueId})`}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 26 42 Q 50 44, 74 42"
            stroke={`url(#catStripe-${uniqueId})`}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 28 54 Q 50 56, 72 54"
            stroke={`url(#catStripe-${uniqueId})`}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 30 66 Q 50 68, 70 66"
            stroke={`url(#catStripe-${uniqueId})`}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Cat ears poking out */}
        <motion.g
          animate={{
            y: [-1, 1, -1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Left ear */}
          <path
            d="M 35 24 L 30 14 L 38 20 Z"
            fill="rgb(245, 158, 11)"
            opacity="0.9"
          />
          <path
            d="M 33 22 L 31 17 L 35 21 Z"
            fill="rgb(251, 191, 36)"
            opacity="0.7"
          />
          
          {/* Right ear */}
          <path
            d="M 65 24 L 70 14 L 62 20 Z"
            fill="rgb(245, 158, 11)"
            opacity="0.9"
          />
          <path
            d="M 67 22 L 69 17 L 65 21 Z"
            fill="rgb(251, 191, 36)"
            opacity="0.7"
          />
        </motion.g>

        {/* Sleeping cat face inside circle */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {/* Closed eyes (sleeping) */}
          <path
            d="M 40 45 Q 43 47, 46 45"
            stroke="rgb(120, 53, 15)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 54 45 Q 57 47, 60 45"
            stroke="rgb(120, 53, 15)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Cute nose */}
          <ellipse
            cx="50"
            cy="52"
            rx="2.5"
            ry="2"
            fill="rgb(236, 72, 153)"
            opacity="0.8"
          />
          
          {/* Smile/content mouth */}
          <path
            d="M 50 54 Q 46 56, 44 55 M 50 54 Q 54 56, 56 55"
            stroke="rgb(120, 53, 15)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Cat tail curled around */}
        <motion.path
          d="M 70 65 Q 85 70, 88 55 Q 90 45, 85 38"
          stroke="rgb(245, 158, 11)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
          animate={{
            d: [
              "M 70 65 Q 85 70, 88 55 Q 90 45, 85 38",
              "M 70 65 Q 83 68, 86 58 Q 88 48, 83 40",
              "M 70 65 Q 85 70, 88 55 Q 90 45, 85 38"
            ]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Tail stripes */}
        <motion.g
          animate={{
            opacity: [0.6, 0.8, 0.6]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <circle cx="76" cy="67" r="2" fill="rgb(234, 88, 12)" opacity="0.7" />
          <circle cx="82" cy="64" r="2" fill="rgb(234, 88, 12)" opacity="0.7" />
          <circle cx="86" cy="52" r="2" fill="rgb(234, 88, 12)" opacity="0.7" />
        </motion.g>

        {/* Floating "Z Z Z" for sleeping */}
        {Array.from({ length: 3 }).map((_, i) => {
          const x = 15 + i * 5;
          const startY = 40 + i * 8;
          
          return (
            <motion.text
              key={`z-${i}`}
              x={x}
              y={startY}
              fontSize="8"
              fill="rgb(148, 163, 184)"
              opacity="0.6"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              animate={{
                y: [startY, startY - 15, startY],
                opacity: [0, 0.7, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeInOut"
              }}
            >
              Z
            </motion.text>
          );
        })}
      </svg>
    </motion.div>
  );
}

function BestFriendsX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateY: -180 }}
      animate={{ scale: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1200px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 4px 10px rgba(96, 165, 250, 0.4))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`bfxGrad1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(147, 197, 253)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(96, 165, 250)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(59, 130, 246)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`bfxGrad2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(253, 224, 71)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(250, 204, 21)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(234, 179, 8)", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* First diagonal line - Top-left to bottom-right (Blue arm) */}
        <motion.g
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Arm/hand forming diagonal */}
          <motion.path
            d="M 18 18 L 82 82"
            stroke={`url(#bfxGrad1-${uniqueId})`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
            animate={{
              strokeWidth: [14, 16, 14]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Hand at top-left */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ originX: "18px", originY: "18px" }}
          >
            <circle
              cx="18"
              cy="18"
              r="8"
              fill={`url(#bfxGrad1-${uniqueId})`}
              stroke="rgb(37, 99, 235)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Fingers */}
            <path
              d="M 18 10 L 18 6 M 14 12 L 12 10 M 22 12 L 24 10"
              stroke="rgb(37, 99, 235)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.g>

          {/* Hand at bottom-right */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
            style={{ originX: "82px", originY: "82px" }}
          >
            <circle
              cx="82"
              cy="82"
              r="8"
              fill={`url(#bfxGrad1-${uniqueId})`}
              stroke="rgb(37, 99, 235)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Fingers */}
            <path
              d="M 82 90 L 82 94 M 78 88 L 76 90 M 86 88 L 88 90"
              stroke="rgb(37, 99, 235)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.g>
        </motion.g>

        {/* Second diagonal line - Top-right to bottom-left (Yellow/Gold arm) */}
        <motion.g
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          {/* Arm/hand forming diagonal */}
          <motion.path
            d="M 82 18 L 18 82"
            stroke={`url(#bfxGrad2-${uniqueId})`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
            animate={{
              strokeWidth: [14, 16, 14]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          
          {/* Hand at top-right */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            style={{ originX: "82px", originY: "18px" }}
          >
            <circle
              cx="82"
              cy="18"
              r="8"
              fill={`url(#bfxGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Fingers */}
            <path
              d="M 82 10 L 82 6 M 78 12 L 76 10 M 86 12 L 88 10"
              stroke="rgb(217, 119, 6)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.g>

          {/* Hand at bottom-left */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8
            }}
            style={{ originX: "18px", originY: "82px" }}
          >
            <circle
              cx="18"
              cy="82"
              r="8"
              fill={`url(#bfxGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Fingers */}
            <path
              d="M 18 90 L 18 94 M 14 88 L 12 90 M 22 88 L 24 90"
              stroke="rgb(217, 119, 6)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.g>
        </motion.g>

        {/* Center heart where hands cross */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.path
            d="M 50 55 Q 45 50, 45 47 Q 45 43, 48 43 Q 50 43, 50 45 Q 50 43, 52 43 Q 55 43, 55 47 Q 55 50, 50 55 Z"
            fill="rgb(244, 114, 182)"
            stroke="rgb(236, 72, 153)"
            strokeWidth="1.5"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.g>

        {/* Friendship sparkles */}
        {[0, 1, 2, 3].map((i) => {
          const positions = [
            { x: 50, y: 20 },
            { x: 80, y: 50 },
            { x: 50, y: 80 },
            { x: 20, y: 50 }
          ];
          const pos = positions[i];
          
          return (
            <motion.circle
              key={`sparkle-${i}`}
              cx={pos.x}
              cy={pos.y}
              r="3"
              fill="rgb(251, 191, 36)"
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}
function BestFriendsO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateY: 180 }}
      animate={{ scale: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1200px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 4px 10px rgba(248, 113, 113, 0.4))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`bfoGrad1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(254, 202, 202)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(252, 165, 165)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(248, 113, 113)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`bfoGrad2-${uniqueId}`} x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: "rgb(253, 224, 71)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(250, 204, 21)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(234, 179, 8)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`circleGlow-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(255, 255, 255)", stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: "rgb(248, 113, 113)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* Outer glow */}
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill={`url(#circleGlow-${uniqueId})`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Main circle formed by hands */}
        <motion.circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="rgb(248, 113, 113)"
          strokeWidth="3"
          opacity="0.2"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        {/* Top-left hand - Pink/Red */}
        <motion.g
          initial={{ x: -20, y: -20, scale: 0 }}
          animate={{ x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <motion.g
            animate={{
              rotateZ: [0, -8, 0, -5, 0],
              y: [0, -2, 0]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ originX: "32px", originY: "30px" }}
          >
            {/* Palm */}
            <ellipse
              cx="32"
              cy="30"
              rx="10"
              ry="13"
              fill={`url(#bfoGrad1-${uniqueId})`}
              stroke="rgb(239, 68, 68)"
              strokeWidth="1.5"
              opacity="0.95"
              transform="rotate(-30 32 30)"
            />
            
            {/* Fingers curved around circle */}
            <path
              d="M 38 25 Q 42 24, 44 26 Q 44 28, 42 30 Q 40 30, 38 28 Z"
              fill={`url(#bfoGrad1-${uniqueId})`}
              stroke="rgb(239, 68, 68)"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <path
              d="M 40 30 Q 44 30, 46 32 Q 46 34, 44 36 Q 42 36, 40 34 Z"
              fill={`url(#bfoGrad1-${uniqueId})`}
              stroke="rgb(239, 68, 68)"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <path
              d="M 38 35 Q 42 36, 44 39 Q 44 41, 42 43 Q 40 42, 38 40 Z"
              fill={`url(#bfoGrad1-${uniqueId})`}
              stroke="rgb(239, 68, 68)"
              strokeWidth="0.8"
              opacity="0.9"
            />

            {/* Wrist */}
            <ellipse
              cx="24"
              cy="28"
              rx="4"
              ry="8"
              fill={`url(#bfoGrad1-${uniqueId})`}
              stroke="rgb(239, 68, 68)"
              strokeWidth="1"
              opacity="0.85"
              transform="rotate(-45 24 28)"
            />
          </motion.g>
        </motion.g>

        {/* Bottom-right hand - Yellow/Gold */}
        <motion.g
          initial={{ x: 20, y: 20, scale: 0 }}
          animate={{ x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        >
          <motion.g
            animate={{
              rotateZ: [0, 8, 0, 5, 0],
              y: [0, 2, 0]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7
            }}
            style={{ originX: "68px", originY: "70px" }}
          >
            {/* Palm */}
            <ellipse
              cx="68"
              cy="70"
              rx="10"
              ry="13"
              fill={`url(#bfoGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="1.5"
              opacity="0.95"
              transform="rotate(150 68 70)"
            />
            
            {/* Fingers curved around circle */}
            <path
              d="M 62 75 Q 58 76, 56 74 Q 56 72, 58 70 Q 60 70, 62 72 Z"
              fill={`url(#bfoGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <path
              d="M 60 70 Q 56 70, 54 68 Q 54 66, 56 64 Q 58 64, 60 66 Z"
              fill={`url(#bfoGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <path
              d="M 62 65 Q 58 64, 56 61 Q 56 59, 58 57 Q 60 58, 62 60 Z"
              fill={`url(#bfoGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="0.8"
              opacity="0.9"
            />

            {/* Wrist */}
            <ellipse
              cx="76"
              cy="72"
              rx="4"
              ry="8"
              fill={`url(#bfoGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="1"
              opacity="0.85"
              transform="rotate(135 76 72)"
            />
          </motion.g>
        </motion.g>

        {/* Friendship symbols in center */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {/* Small hearts floating */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * 90) * (Math.PI / 180);
            const x = 50 + Math.cos(angle) * 18;
            const y = 50 + Math.sin(angle) * 18;
            
            return (
              <motion.path
                key={`heart-${i}`}
                d={`M ${x} ${y + 3} Q ${x - 2.5} ${y}, ${x - 2.5} ${y - 1.5} Q ${x - 2.5} ${y - 3}, ${x - 1} ${y - 3} Q ${x} ${y - 3}, ${x} ${y - 2} Q ${x} ${y - 3}, ${x + 1} ${y - 3} Q ${x + 2.5} ${y - 3}, ${x + 2.5} ${y - 1.5} Q ${x + 2.5} ${y}, ${x} ${y + 3} Z`}
                fill="rgb(244, 114, 182)"
                stroke="rgb(236, 72, 153)"
                strokeWidth="0.5"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
              />
            );
          })}

          {/* "BFF" text in center */}
          <motion.text
            x="50"
            y="53"
            fontSize="12"
            fill="rgb(236, 72, 153)"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            textAnchor="middle"
            opacity="0.9"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            BFF
          </motion.text>
        </motion.g>

        {/* Sparkles around the circle */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i * 60) * (Math.PI / 180);
          const x = 50 + Math.cos(angle) * 35;
          const y = 50 + Math.sin(angle) * 35;
          
          return (
            <motion.circle
              key={`sparkle-${i}`}
              cx={x}
              cy={y}
              r="2"
              fill="rgb(251, 191, 36)"
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}
