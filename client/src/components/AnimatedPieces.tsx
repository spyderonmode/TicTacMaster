import { motion } from "framer-motion";
import { useId } from "react";

interface AnimatedPieceProps {
  symbol: "X" | "O";
  style?: "default" | "thunder" | "fire" | "hammer";
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
          transition={{ duration: 0.3, ease: "easeOut" }}
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
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        <motion.path
          d="M 20 20 L 80 80"
          stroke="rgba(147, 197, 253, 0.8)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          style={{ transform: "translate(-1px, -1px)" }}
        />
        <motion.path
          d="M 80 20 L 20 80"
          stroke="rgba(147, 197, 253, 0.8)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          style={{ transform: "translate(-1px, -1px)" }}
        />
        
        <motion.g
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "loop",
          }}
          style={{ filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))" }}
        >
          <path
            d="M 35 15 L 30 25 L 40 23 L 28 40 L 38 35 L 30 48"
            stroke="rgba(255, 215, 0, 1)"
            strokeWidth="2.5"
            fill="rgba(255, 215, 0, 0.2)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 72 55 L 67 65 L 77 63 L 65 80 L 75 75 L 67 88"
            stroke="rgba(255, 215, 0, 1)"
            strokeWidth="2.5"
            fill="rgba(255, 215, 0, 0.2)"
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

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke="rgba(254, 202, 202, 0.8)"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          style={{ originX: "50%", originY: "50%", transform: "translate(-1px, -1px)" }}
        />
        
        <motion.g
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "loop",
            delay: 0.3,
          }}
          style={{ filter: "drop-shadow(0 0 4px rgba(255, 100, 100, 0.8))" }}
        >
          <path
            d="M 25 30 L 20 40 L 30 38 L 18 55 L 28 50 L 20 63"
            stroke="rgba(255, 100, 100, 1)"
            strokeWidth="2.5"
            fill="rgba(255, 100, 100, 0.2)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 75 40 L 70 50 L 80 48 L 68 65 L 78 60 L 70 73"
            stroke="rgba(255, 100, 100, 1)"
            strokeWidth="2.5"
            fill="rgba(255, 100, 100, 0.2)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 50 18 L 45 28 L 55 26 L 43 43 L 53 38 L 45 51"
            stroke="rgba(255, 182, 193, 0.9)"
            strokeWidth="2"
            fill="rgba(255, 182, 193, 0.15)"
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
          transition={{ duration: 0.35, ease: "easeOut" }}
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
          transition={{ duration: 0.35, ease: "easeOut" }}
        />

        <motion.path
          d="M 22 22 L 78 78"
          stroke="rgba(255, 223, 0, 0.9)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
          style={{ transform: "translate(-1px, -1px)" }}
        />
        <motion.path
          d="M 78 22 L 22 78"
          stroke="rgba(255, 223, 0, 0.9)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
          style={{ transform: "translate(-1px, -1px)" }}
        />
        
        <motion.g
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.2, 0.9],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "loop",
          }}
          style={{ filter: "drop-shadow(0 0 6px rgba(255, 140, 0, 1))" }}
        >
          <path
            d="M 35 20 C 33 15, 37 10, 40 12 C 41 8, 44 10, 42 14 C 45 12, 48 16, 45 20 C 47 18, 48 22, 44 26 C 46 28, 42 32, 38 28 C 40 32, 35 34, 32 30 C 30 33, 26 30, 29 26 C 25 28, 24 24, 28 20 C 26 18, 28 14, 32 16 Z"
            fill="url(#fireGradient1-${uniqueId})"
            stroke="rgba(255, 140, 0, 0.6)"
            strokeWidth="1.5"
          />
          <path
            d="M 36 22 C 38 20, 40 24, 38 26 C 36 28, 33 26, 34 24 Z"
            fill="rgba(255, 223, 0, 0.9)"
          />
        </motion.g>

        <motion.g
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.2, 0.9],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "loop",
            delay: 0.25,
          }}
          style={{ filter: "drop-shadow(0 0 6px rgba(255, 140, 0, 1))" }}
        >
          <path
            d="M 68 60 C 66 55, 70 50, 73 52 C 74 48, 77 50, 75 54 C 78 52, 81 56, 78 60 C 80 58, 81 62, 77 66 C 79 68, 75 72, 71 68 C 73 72, 68 74, 65 70 C 63 73, 59 70, 62 66 C 58 68, 57 64, 61 60 C 59 58, 61 54, 65 56 Z"
            fill="url(#fireGradient2-${uniqueId})"
            stroke="rgba(255, 140, 0, 0.6)"
            strokeWidth="1.5"
          />
          <path
            d="M 69 62 C 71 60, 73 64, 71 66 C 69 68, 66 66, 67 64 Z"
            fill="rgba(255, 223, 0, 0.9)"
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

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke="rgba(255, 223, 0, 0.9)"
          strokeWidth="5"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
          style={{ originX: "50%", originY: "50%", transform: "translate(-1px, -1px)" }}
        />
        
        <motion.g
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.2, 0.9],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "loop",
          }}
          style={{ filter: "drop-shadow(0 0 6px rgba(255, 100, 0, 1))" }}
        >
          <path
            d="M 28 35 C 26 30, 30 25, 33 27 C 34 23, 37 25, 35 29 C 38 27, 41 31, 38 35 C 40 33, 41 37, 37 41 C 39 43, 35 47, 31 43 C 33 47, 28 49, 25 45 C 23 48, 19 45, 22 41 C 18 43, 17 39, 21 35 C 19 33, 21 29, 25 31 Z"
            fill={`url(#fireOGradient-${uniqueId})`}
            stroke="rgba(255, 100, 0, 0.6)"
            strokeWidth="1.5"
          />
          <path
            d="M 29 37 C 31 35, 33 39, 31 41 C 29 43, 26 41, 27 39 Z"
            fill="rgba(255, 223, 0, 0.9)"
          />
        </motion.g>

        <motion.g
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.2, 0.9],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "loop",
            delay: 0.25,
          }}
          style={{ filter: "drop-shadow(0 0 6px rgba(255, 100, 0, 1))" }}
        >
          <path
            d="M 65 55 C 63 50, 67 45, 70 47 C 71 43, 74 45, 72 49 C 75 47, 78 51, 75 55 C 77 53, 78 57, 74 61 C 76 63, 72 67, 68 63 C 70 67, 65 69, 62 65 C 60 68, 56 65, 59 61 C 55 63, 54 59, 58 55 C 56 53, 58 49, 62 51 Z"
            fill={`url(#fireOGradient-${uniqueId})`}
            stroke="rgba(255, 100, 0, 0.6)"
            strokeWidth="1.5"
          />
          <path
            d="M 66 57 C 68 55, 70 59, 68 61 C 66 63, 63 61, 64 59 Z"
            fill="rgba(255, 223, 0, 0.9)"
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
