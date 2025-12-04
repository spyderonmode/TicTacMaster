import { motion } from "framer-motion";
import { useId, memo } from "react";
import "./AnimatedPieces.css";

interface AnimatedPieceProps {
  symbol: "X" | "O";
  style?: "default" | "thunder" | "fire" | "hammer" | "autumn" | "lovers" | "flower" | "greenleaf" | "cat" | "bestfriends" | "lotus" | "holi" | "tulip" | "butterfly" | "peacock" | "bulb" | "moonstar";
  className?: string;
  position?: number;
}

const AnimatedPieceComponent = ({ symbol, style = "default", className = "", position }: AnimatedPieceProps) => {
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

  if (style === "lotus") {
    return symbol === "X" ? (
      <LotusX className={className} uniqueId={uniqueId} />
    ) : (
      <LotusO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "holi") {
    return symbol === "X" ? (
      <HoliX className={className} uniqueId={uniqueId} />
    ) : (
      <HoliO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "tulip") {
    return symbol === "X" ? (
      <TulipX className={className} uniqueId={uniqueId} />
    ) : (
      <TulipO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "butterfly") {
    return symbol === "X" ? (
      <ButterflyX className={className} uniqueId={uniqueId} />
    ) : (
      <ButterflyO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "peacock") {
    return symbol === "X" ? (
      <PeacockX className={className} uniqueId={uniqueId} />
    ) : (
      <PeacockO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "bulb") {
    return symbol === "X" ? (
      <BulbX className={className} uniqueId={uniqueId} />
    ) : (
      <BulbO className={className} uniqueId={uniqueId} />
    );
  }

  if (style === "moonstar") {
    return symbol === "X" ? (
      <MoonStarX className={className} uniqueId={uniqueId} />
    ) : (
      <MoonStarO className={className} uniqueId={uniqueId} />
    );
  }

  return <span className={className}>{symbol}</span>;
};

// Export memoized version to prevent unnecessary re-renders
export const AnimatedPiece = memo(AnimatedPieceComponent, (prevProps, nextProps) => {
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.style === nextProps.style &&
    prevProps.position === nextProps.position &&
    prevProps.className === nextProps.className
  );
});

function ThunderX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <div className={`animated-piece-container ${className}`}>
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

        <g className="spark-burst-1">
          <path
            d="M 35 12 L 40 22 L 50 20 L 45 30 L 55 37 L 43 37 L 40 47 L 35 37 L 23 38 L 30 30 L 25 20 Z"
            fill="rgba(135, 206, 250, 0.8)"
            stroke="rgba(59, 130, 246, 0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        <g className="spark-burst-2">
          <path
            d="M 65 55 L 70 65 L 80 63 L 75 73 L 85 80 L 73 80 L 70 90 L 65 80 L 53 81 L 60 73 L 55 63 Z"
            fill="rgba(147, 197, 253, 0.8)"
            stroke="rgba(96, 165, 250, 0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        <g className="lightning-bolt">
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
        </g>
      </svg>
    </div>
  );
}

function ThunderO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <div className={`animated-piece-container ${className}`}>
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

        <g className="ring-expansion">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(252, 165, 165, 0.6)"
            strokeWidth="3"
            opacity="0.4"
          />
        </g>

        <g className="lightning-bolt">
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
        </g>
      </svg>
    </div>
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
        rotateY: { duration: 2, ease: "easeInOut",  }
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
        rotateY: { duration: 2, ease: "easeInOut",  }
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
        rotateX: { duration: 4, ease: "easeInOut",  },
        rotateZ: { duration: 2, ease: "easeInOut",  }
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
            rotate: { duration: 6, ease: "linear",  },
            scale: { duration: 2, ease: "easeInOut",  }
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
        rotateX: { duration: 4, ease: "easeInOut",  },
        rotateZ: { duration: 2, ease: "easeInOut",  }
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
          filter: "drop-shadow(0 4px 10px rgba(244, 114, 182, 0.4))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`bfoGrad1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(244, 114, 182)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(219, 39, 119)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`bfoGrad2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(253, 224, 71)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(250, 204, 21)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(234, 179, 8)", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* First curved arm - Pink/Magenta forming top half of circle */}
        <motion.g
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Curved arm path */}
          <motion.path
            d="M 50 22 Q 75 22, 78 50 Q 75 78, 50 78"
            stroke={`url(#bfoGrad1-${uniqueId})`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
            animate={{
              strokeWidth: [14, 16, 14]
            }}
            transition={{
              duration: 3,
              
              ease: "easeInOut"
            }}
          />
          
          {/* Hand at top with fingers */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 3,
              
              ease: "easeInOut"
            }}
            style={{ originX: "50px", originY: "22px" }}
          >
            <circle
              cx="50"
              cy="22"
              r="8"
              fill={`url(#bfoGrad1-${uniqueId})`}
              stroke="rgb(219, 39, 119)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Fingers */}
            <path
              d="M 50 14 L 50 10 M 46 16 L 44 14 M 54 16 L 56 14"
              stroke="rgb(219, 39, 119)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.g>

          {/* Hand at bottom with fingers */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 3,
              
              ease: "easeInOut",
              delay: 0.3
            }}
            style={{ originX: "50px", originY: "78px" }}
          >
            <circle
              cx="50"
              cy="78"
              r="8"
              fill={`url(#bfoGrad1-${uniqueId})`}
              stroke="rgb(219, 39, 119)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Fingers */}
            <path
              d="M 50 86 L 50 90 M 46 84 L 44 86 M 54 84 L 56 86"
              stroke="rgb(219, 39, 119)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.g>
        </motion.g>

        {/* Second curved arm - Yellow/Gold forming bottom half of circle */}
        <motion.g
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          {/* Curved arm path */}
          <motion.path
            d="M 50 78 Q 25 78, 22 50 Q 25 22, 50 22"
            stroke={`url(#bfoGrad2-${uniqueId})`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
            animate={{
              strokeWidth: [14, 16, 14]
            }}
            transition={{
              duration: 3,
              
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          
          {/* Hand at bottom with fingers */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 3,
              
              ease: "easeInOut",
              delay: 0.5
            }}
            style={{ originX: "50px", originY: "78px" }}
          >
            <circle
              cx="50"
              cy="78"
              r="8"
              fill={`url(#bfoGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Fingers */}
            <path
              d="M 50 86 L 50 90 M 46 84 L 44 86 M 54 84 L 56 86"
              stroke="rgb(217, 119, 6)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.g>

          {/* Hand at top with fingers */}
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 3,
              
              ease: "easeInOut",
              delay: 0.8
            }}
            style={{ originX: "50px", originY: "22px" }}
          >
            <circle
              cx="50"
              cy="22"
              r="8"
              fill={`url(#bfoGrad2-${uniqueId})`}
              stroke="rgb(217, 119, 6)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Fingers */}
            <path
              d="M 50 14 L 50 10 M 46 16 L 44 14 M 54 16 L 56 14"
              stroke="rgb(217, 119, 6)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.g>
        </motion.g>

        {/* Center heart where hands meet */}
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
              
              ease: "easeInOut"
            }}
          />
        </motion.g>

        {/* Friendship sparkles */}
        {[0, 1, 2, 3].map((i) => {
          const positions = [
            { x: 50, y: 22 },
            { x: 78, y: 50 },
            { x: 50, y: 78 },
            { x: 22, y: 50 }
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

function LotusX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateY: -180 }}
      animate={{ scale: 0.8, rotateY: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
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
          <linearGradient id={`lotusXGrad1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(219, 39, 119)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(190, 24, 93)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`lotusXGrad2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(251, 207, 232)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(219, 39, 119)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`lotusXCenter-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(254, 240, 138)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(251, 191, 36)", stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <motion.path
            d="M 20 20 L 80 80"
            stroke={`url(#lotusXGrad1-${uniqueId})`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          <motion.path
            d="M 80 20 L 20 80"
            stroke={`url(#lotusXGrad2-${uniqueId})`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          />
        </motion.g>

        {[0, 1, 2, 3].map((i) => {
          const angle = (i * 90 - 45) * Math.PI / 180;
          const x = 50 + Math.cos(angle) * 35;
          const y = 50 + Math.sin(angle) * 35;
          
          return (
            <motion.g
              key={`petal-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1,
                opacity: 1
              }}
              transition={{ 
                delay: 0.2 + i * 0.03, 
                duration: 0.3,
                ease: "easeInOut"
              }}
            >
              <ellipse
                cx={x}
                cy={y}
                rx="8"
                ry="14"
                fill="rgba(251, 207, 232, 0.6)"
                stroke="rgb(236, 72, 153)"
                strokeWidth="1.5"
                transform={`rotate(${i * 90 - 45} ${x} ${y})`}
              />
            </motion.g>
          );
        })}

        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill={`url(#lotusXCenter-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            opacity: 1
          }}
          transition={{ 
            delay: 0.3, 
            duration: 0.3,
            ease: "easeInOut"
          }}
        />
      </svg>
    </motion.div>
  );
}

function LotusO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateY: 180 }}
      animate={{ scale: 0.8, rotateY: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
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
          <radialGradient id={`lotusOGrad-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(165, 243, 252)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(34, 211, 238)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(6, 182, 212)", stopOpacity: 1 }} />
          </radialGradient>
          <radialGradient id={`lotusOCenter-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(254, 240, 138)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(251, 191, 36)", stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#lotusOGrad-${uniqueId})`}
          strokeWidth="14"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * 45) * Math.PI / 180;
          const x = 50 + Math.cos(angle) * 38;
          const y = 50 + Math.sin(angle) * 38;
          
          return (
            <motion.g
              key={`petal-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1,
                opacity: 1
              }}
              transition={{ 
                delay: 0.2 + i * 0.02, 
                duration: 0.3,
                ease: "easeInOut"
              }}
            >
              <ellipse
                cx={x}
                cy={y}
                rx="6"
                ry="12"
                fill="rgba(207, 250, 254, 0.6)"
                stroke="rgb(34, 211, 238)"
                strokeWidth="1.5"
                transform={`rotate(${i * 45} ${x} ${y})`}
              />
            </motion.g>
          );
        })}

        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill={`url(#lotusOCenter-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            opacity: 1
          }}
          transition={{ 
            delay: 0.3, 
            duration: 0.3,
            ease: "easeInOut"
          }}
        />
      </svg>
    </motion.div>
  );
}

function HoliX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1,
        opacity: 1,
        y: [0, -3, 0, -2, 0],
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 300, damping: 20 },
        opacity: { duration: 0.3 },
        y: { duration: 3.5,  ease: "easeInOut" }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
      >
        {/* Main X shape with multiple color layers */}
        <motion.g
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            
            ease: "easeInOut"
          }}
        >
          <motion.path
            d="M 20 20 L 80 80"
            stroke="rgb(236, 72, 153)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            animate={{
              strokeWidth: [14, 16, 14],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 1.8,
              
              ease: "easeInOut"
            }}
          />
          <motion.path
            d="M 80 20 L 20 80"
            stroke="rgb(250, 204, 21)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            animate={{
              strokeWidth: [14, 16, 14],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2,
              
              delay: 0.3,
              ease: "easeInOut"
            }}
          />
          <motion.path
            d="M 20 20 L 80 80"
            stroke="rgb(59, 130, 246)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            animate={{
              strokeWidth: [8, 10, 8],
            }}
            transition={{
              duration: 1.5,
              
              delay: 0.5,
              ease: "easeInOut"
            }}
          />
          <motion.path
            d="M 80 20 L 20 80"
            stroke="rgb(34, 197, 94)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            animate={{
              strokeWidth: [8, 10, 8],
            }}
            transition={{
              duration: 1.7,
              
              delay: 0.6,
              ease: "easeInOut"
            }}
          />
        </motion.g>

        {/* Floating color particles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 360) / 12;
          const radius = 38;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          const colors = ["rgb(236, 72, 153)", "rgb(250, 204, 21)", "rgb(34, 197, 94)", "rgb(59, 130, 246)", "rgb(168, 85, 247)"];
          const color = colors[i % colors.length];
          
          return (
            <motion.circle
              key={`particle-${i}`}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              animate={{
                scale: [0.6, 1.3, 0.6],
                opacity: [0.5, 1, 0.5],
                y: [y, y - 4, y + 2, y],
              }}
              transition={{
                duration: 2.2,
                
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function HoliO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1,
        opacity: 1,
        x: [0, 2, 0, -2, 0],
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 300, damping: 20 },
        opacity: { duration: 0.3 },
        x: { duration: 4,  ease: "easeInOut" }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
      >
        {/* Main O shape with multiple color layers */}
        <motion.g
          animate={{
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 2.2,
            
            ease: "easeInOut"
          }}
        >
          <motion.circle
            cx="50"
            cy="50"
            r="28"
            stroke="rgb(250, 204, 21)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            animate={{
              strokeWidth: [12, 14, 12],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 1.9,
              
              ease: "easeInOut"
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="28"
            stroke="rgb(236, 72, 153)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            animate={{
              strokeWidth: [10, 12, 10],
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 2.1,
              
              delay: 0.2,
              ease: "easeInOut"
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="28"
            stroke="rgb(59, 130, 246)"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
            animate={{
              strokeWidth: [7, 9, 7],
            }}
            transition={{
              duration: 1.6,
              
              delay: 0.4,
              ease: "easeInOut"
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="28"
            stroke="rgb(34, 197, 94)"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
            animate={{
              strokeWidth: [7, 9, 7],
            }}
            transition={{
              duration: 1.8,
              
              delay: 0.5,
              ease: "easeInOut"
            }}
          />
        </motion.g>

        {/* Bouncing color particles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 360) / 12;
          const radius = 40;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          const colors = ["rgb(250, 204, 21)", "rgb(34, 197, 94)", "rgb(59, 130, 246)", "rgb(168, 85, 247)", "rgb(236, 72, 153)"];
          const color = colors[i % colors.length];
          
          return (
            <motion.circle
              key={`o-particle-${i}`}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              animate={{
                scale: [0.7, 1.4, 0.7],
                opacity: [0.6, 1, 0.6],
                x: [x, x + 2, x - 2, x],
              }}
              transition={{
                duration: 2.4,
                
                delay: i * 0.12,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function TulipX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  const tulipColors = [
    { petal: "rgb(244, 114, 182)", shade: "rgb(236, 72, 153)", name: "pink" },
    { petal: "rgb(239, 68, 68)", shade: "rgb(220, 38, 38)", name: "red" },
    { petal: "rgb(192, 132, 252)", shade: "rgb(168, 85, 247)", name: "purple" },
    { petal: "rgb(251, 191, 36)", shade: "rgb(245, 158, 11)", name: "yellow" },
  ];

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1,
        opacity: 1
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 260, damping: 20 },
        opacity: { duration: 0.5 }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
      >
        <defs>
          {tulipColors.map((color, idx) => (
            <linearGradient key={`tulipGrad-${idx}`} id={`tulipPetal${idx}-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: color.petal, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: color.shade, stopOpacity: 1 }} />
            </linearGradient>
          ))}
          <linearGradient id={`tulipStem-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(134, 239, 172)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(34, 197, 94)", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* X shape - First diagonal made entirely of tulips */}
        {[...Array(11)].map((_, i) => {
          const progress = i / 10;
          const x = 18 + (64 * progress);
          const y = 18 + (64 * progress);
          const colorIdx = i % 4;
          const size = i === 5 ? 1.2 : 1;
          
          return (
            <motion.g 
              key={`tulip-d1-${i}`}
              initial={{ scale: 0 }}
              animate={{ 
                scale: size,
                x: [0, 1.5, -1.5, 0],
                y: [0, -2, 0, -1, 0]
              }}
              transition={{ 
                scale: { delay: i * 0.03, type: "spring", stiffness: 300 },
                x: { duration: 3 + i * 0.15,  ease: "easeInOut", delay: i * 0.1 },
                y: { duration: 2.8 + i * 0.12,  ease: "easeInOut", delay: i * 0.08 }
              }}
            >
              {/* Left petal */}
              <motion.path
                d={`M ${x - 4.5 * size} ${y} Q ${x - 7 * size} ${y - 4 * size}, ${x - 5 * size} ${y - 8 * size} Q ${x - 2.5 * size} ${y - 9 * size}, ${x - 1.5 * size} ${y - 2 * size} Z`}
                fill={`url(#tulipPetal${colorIdx}-${uniqueId})`}
                stroke={tulipColors[colorIdx].shade}
                strokeWidth="0.5"
                animate={{
                  scale: [1, 1.08, 1]
                }}
                transition={{
                  duration: 2.5 + i * 0.1,
                  
                  ease: "easeInOut",
                  delay: i * 0.1
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {/* Center petal */}
              <motion.path
                d={`M ${x - 1 * size} ${y - 1 * size} Q ${x - 0.5 * size} ${y - 10 * size}, ${x + 0.5 * size} ${y - 11 * size} Q ${x + 2 * size} ${y - 9.5 * size}, ${x + 1 * size} ${y - 1 * size} Z`}
                fill={`url(#tulipPetal${colorIdx}-${uniqueId})`}
                stroke={tulipColors[colorIdx].shade}
                strokeWidth="0.5"
                animate={{
                  scale: [1, 1.06, 1]
                }}
                transition={{
                  duration: 2.5 + i * 0.1,
                  
                  ease: "easeInOut",
                  delay: i * 0.1 + 0.05
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {/* Right petal */}
              <motion.path
                d={`M ${x + 1.5 * size} ${y - 2 * size} Q ${x + 2.5 * size} ${y - 9 * size}, ${x + 5 * size} ${y - 8 * size} Q ${x + 7 * size} ${y - 4 * size}, ${x + 4.5 * size} ${y} Z`}
                fill={`url(#tulipPetal${colorIdx}-${uniqueId})`}
                stroke={tulipColors[colorIdx].shade}
                strokeWidth="0.5"
                animate={{
                  scale: [1, 1.08, 1]
                }}
                transition={{
                  duration: 2.5 + i * 0.1,
                  
                  ease: "easeInOut",
                  delay: i * 0.1 + 0.02
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {/* Small stem */}
              <motion.line
                x1={x}
                y1={y}
                x2={x}
                y2={y + 4 * size}
                stroke={`url(#tulipStem-${uniqueId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{
                  opacity: [0.7, 0.9, 0.7]
                }}
                transition={{
                  duration: 2.5,
                  
                  ease: "easeInOut",
                  delay: i * 0.08
                }}
              />
            </motion.g>
          );
        })}

        {/* X shape - Second diagonal made entirely of tulips */}
        {[...Array(11)].map((_, i) => {
          const progress = i / 10;
          const x = 82 - (64 * progress);
          const y = 18 + (64 * progress);
          const colorIdx = (i + 2) % 4;
          const size = i === 5 ? 1.2 : 1;
          
          return (
            <motion.g 
              key={`tulip-d2-${i}`}
              initial={{ scale: 0 }}
              animate={{ 
                scale: size,
                x: [0, -1.5, 1.5, 0],
                y: [0, -1.5, 0, -2, 0]
              }}
              transition={{ 
                scale: { delay: i * 0.03 + 0.1, type: "spring", stiffness: 300 },
                x: { duration: 3.2 + i * 0.15,  ease: "easeInOut", delay: i * 0.12 },
                y: { duration: 2.9 + i * 0.12,  ease: "easeInOut", delay: i * 0.1 }
              }}
            >
              {/* Left petal */}
              <motion.path
                d={`M ${x - 4.5 * size} ${y} Q ${x - 7 * size} ${y - 4 * size}, ${x - 5 * size} ${y - 8 * size} Q ${x - 2.5 * size} ${y - 9 * size}, ${x - 1.5 * size} ${y - 2 * size} Z`}
                fill={`url(#tulipPetal${colorIdx}-${uniqueId})`}
                stroke={tulipColors[colorIdx].shade}
                strokeWidth="0.5"
                animate={{
                  scale: [1, 1.08, 1]
                }}
                transition={{
                  duration: 2.6 + i * 0.1,
                  
                  ease: "easeInOut",
                  delay: i * 0.12
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {/* Center petal */}
              <motion.path
                d={`M ${x - 1 * size} ${y - 1 * size} Q ${x - 0.5 * size} ${y - 10 * size}, ${x + 0.5 * size} ${y - 11 * size} Q ${x + 2 * size} ${y - 9.5 * size}, ${x + 1 * size} ${y - 1 * size} Z`}
                fill={`url(#tulipPetal${colorIdx}-${uniqueId})`}
                stroke={tulipColors[colorIdx].shade}
                strokeWidth="0.5"
                animate={{
                  scale: [1, 1.06, 1]
                }}
                transition={{
                  duration: 2.6 + i * 0.1,
                  
                  ease: "easeInOut",
                  delay: i * 0.12 + 0.05
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {/* Right petal */}
              <motion.path
                d={`M ${x + 1.5 * size} ${y - 2 * size} Q ${x + 2.5 * size} ${y - 9 * size}, ${x + 5 * size} ${y - 8 * size} Q ${x + 7 * size} ${y - 4 * size}, ${x + 4.5 * size} ${y} Z`}
                fill={`url(#tulipPetal${colorIdx}-${uniqueId})`}
                stroke={tulipColors[colorIdx].shade}
                strokeWidth="0.5"
                animate={{
                  scale: [1, 1.08, 1]
                }}
                transition={{
                  duration: 2.6 + i * 0.1,
                  
                  ease: "easeInOut",
                  delay: i * 0.12 + 0.02
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {/* Small stem */}
              <motion.line
                x1={x}
                y1={y}
                x2={x}
                y2={y + 4 * size}
                stroke={`url(#tulipStem-${uniqueId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{
                  opacity: [0.7, 0.9, 0.7]
                }}
                transition={{
                  duration: 2.5,
                  
                  ease: "easeInOut",
                  delay: i * 0.08
                }}
              />
            </motion.g>
          );
        })}

        {/* Gentle floating petals in background */}
        {[...Array(6)].map((_, i) => {
          const positions = [
            { x: 25, y: 10 },
            { x: 75, y: 12 },
            { x: 12, y: 50 },
            { x: 88, y: 50 },
            { x: 25, y: 88 },
            { x: 75, y: 90 }
          ];
          const pos = positions[i];
          const colorIdx = i % 4;
          
          return (
            <motion.ellipse
              key={`float-petal-${i}`}
              cx={pos.x}
              cy={pos.y}
              rx="1.5"
              ry="2.5"
              fill={tulipColors[colorIdx].petal}
              opacity="0.4"
              animate={{
                y: [pos.y, pos.y + 3, pos.y],
                opacity: [0.3, 0.5, 0.3],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 3.5 + i * 0.3,
                
                delay: i * 0.3,
                ease: "easeInOut"
              }}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function TulipO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  const tulipColors = [
    { petal: "rgb(244, 114, 182)", shade: "rgb(236, 72, 153)", name: "pink" },
    { petal: "rgb(239, 68, 68)", shade: "rgb(220, 38, 38)", name: "red" },
    { petal: "rgb(192, 132, 252)", shade: "rgb(168, 85, 247)", name: "purple" },
    { petal: "rgb(251, 191, 36)", shade: "rgb(245, 158, 11)", name: "yellow" },
  ];

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1,
        opacity: 1
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 260, damping: 20 },
        opacity: { duration: 0.5 }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
      >
        <defs>
          {tulipColors.map((color, idx) => (
            <linearGradient key={`tulipOGrad-${idx}`} id={`tulipOPetal${idx}-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: color.petal, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: color.shade, stopOpacity: 1 }} />
            </linearGradient>
          ))}
          <linearGradient id={`tulipOStem-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(134, 239, 172)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(34, 197, 94)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`tulipOCenter-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(254, 240, 138)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(253, 224, 71)", stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        {/* O shape made entirely of tulips arranged in a circle */}
        {[...Array(16)].map((_, i) => {
          const angle = (i * 360) / 16 - 90;
          const radius = 30;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          const colorIdx = i % 4;
          const size = 1;
          const petalAngle = angle + 90;
          
          return (
            <motion.g 
              key={`tulip-o-${i}`}
              initial={{ scale: 0 }}
              animate={{ 
                scale: size,
                x: [0, Math.cos((angle * Math.PI) / 180) * 1.5, 0],
                y: [0, Math.sin((angle * Math.PI) / 180) * 1.5, 0]
              }}
              transition={{ 
                scale: { delay: i * 0.02, type: "spring", stiffness: 300 },
                x: { duration: 2.5 + i * 0.08,  ease: "easeInOut", delay: i * 0.06 },
                y: { duration: 2.5 + i * 0.08,  ease: "easeInOut", delay: i * 0.06 }
              }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              {/* Rotate tulip to point outward from center */}
              <g transform={`rotate(${petalAngle} ${x} ${y})`}>
                {/* Left petal */}
                <motion.path
                  d={`M ${x - 4 * size} ${y} Q ${x - 6.5 * size} ${y - 3.5 * size}, ${x - 4.5 * size} ${y - 7.5 * size} Q ${x - 2 * size} ${y - 8.5 * size}, ${x - 1.2 * size} ${y - 1.5 * size} Z`}
                  fill={`url(#tulipOPetal${colorIdx}-${uniqueId})`}
                  stroke={tulipColors[colorIdx].shade}
                  strokeWidth="0.4"
                  animate={{
                    scale: [1, 1.08, 1]
                  }}
                  transition={{
                    duration: 2.3 + i * 0.08,
                    
                    ease: "easeInOut",
                    delay: i * 0.08
                  }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                {/* Center petal */}
                <motion.path
                  d={`M ${x - 0.8 * size} ${y - 0.8 * size} Q ${x - 0.4 * size} ${y - 9 * size}, ${x + 0.4 * size} ${y - 10 * size} Q ${x + 1.8 * size} ${y - 8.5 * size}, ${x + 0.8 * size} ${y - 0.8 * size} Z`}
                  fill={`url(#tulipOPetal${colorIdx}-${uniqueId})`}
                  stroke={tulipColors[colorIdx].shade}
                  strokeWidth="0.4"
                  animate={{
                    scale: [1, 1.06, 1]
                  }}
                  transition={{
                    duration: 2.3 + i * 0.08,
                    
                    ease: "easeInOut",
                    delay: i * 0.08 + 0.04
                  }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                {/* Right petal */}
                <motion.path
                  d={`M ${x + 1.2 * size} ${y - 1.5 * size} Q ${x + 2 * size} ${y - 8.5 * size}, ${x + 4.5 * size} ${y - 7.5 * size} Q ${x + 6.5 * size} ${y - 3.5 * size}, ${x + 4 * size} ${y} Z`}
                  fill={`url(#tulipOPetal${colorIdx}-${uniqueId})`}
                  stroke={tulipColors[colorIdx].shade}
                  strokeWidth="0.4"
                  animate={{
                    scale: [1, 1.08, 1]
                  }}
                  transition={{
                    duration: 2.3 + i * 0.08,
                    
                    ease: "easeInOut",
                    delay: i * 0.08 + 0.02
                  }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                {/* Small stem */}
                <motion.line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={y + 3.5 * size}
                  stroke={`url(#tulipOStem-${uniqueId})`}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  animate={{
                    opacity: [0.7, 0.9, 0.7]
                  }}
                  transition={{
                    duration: 2.3,
                    
                    ease: "easeInOut",
                    delay: i * 0.06
                  }}
                />
              </g>
            </motion.g>
          );
        })}

        {/* Beautiful yellow center */}
        <motion.circle
          cx="50"
          cy="50"
          r="14"
          fill={`url(#tulipOCenter-${uniqueId})`}
          stroke="rgb(234, 179, 8)"
          strokeWidth="1"
          initial={{ scale: 0 }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.95, 1, 0.95],
          }}
          transition={{
            scale: { delay: 0.3, duration: 2.8,  ease: "easeInOut" },
            opacity: { delay: 0.3, duration: 2.8,  ease: "easeInOut" }
          }}
        />

        {/* Inner glow */}
        <motion.circle
          cx="50"
          cy="50"
          r="9"
          fill="rgb(254, 249, 195)"
          opacity="0.8"
          initial={{ scale: 0 }}
          animate={{
            scale: [0.96, 1.08, 0.96],
            opacity: [0.7, 0.9, 0.7],
          }}
          transition={{
            delay: 0.32,
            scale: { duration: 2.5,  ease: "easeInOut" },
            opacity: { duration: 2.5,  ease: "easeInOut" }
          }}
        />

        {/* Gentle floating petals in background */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 360) / 6;
          const radius = 42;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          const colorIdx = i % 4;
          
          return (
            <motion.ellipse
              key={`float-petal-${i}`}
              cx={x}
              cy={y}
              rx="1.5"
              ry="2.5"
              fill={tulipColors[colorIdx].petal}
              opacity="0.4"
              animate={{
                y: [y, y + 2, y],
                opacity: [0.3, 0.5, 0.3],
                rotate: [0, 8, -8, 0]
              }}
              transition={{
                duration: 3.2 + i * 0.25,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function ButterflyX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 3
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
          <linearGradient id={`butterflyXWing1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(168, 85, 247)", stopOpacity: 0.95 }} />
            <stop offset="50%" style={{ stopColor: "rgb(147, 51, 234)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(126, 34, 206)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`butterflyXWing2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(192, 132, 252)", stopOpacity: 0.95 }} />
            <stop offset="50%" style={{ stopColor: "rgb(168, 85, 247)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(147, 51, 234)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`butterflyXBody-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(88, 28, 135)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(59, 7, 100)", stopOpacity: 1 }} />
          </radialGradient>
          <filter id={`butterflyBevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
            <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.6" specularExponent="20" lightingColor="#ffffff" result="specOut">
              <fePointLight x="-5000" y="-10000" z="30000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.g
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 0 }}
          style={{ transformOrigin: "50% 50%", transformStyle: "preserve-3d" }}
        >
          <motion.path
            d="M 50 25 Q 25 15, 15 25 Q 10 35, 15 45 Q 25 50, 35 48 Q 40 35, 50 25 Z"
            fill={`url(#butterflyXWing1-${uniqueId})`}
            stroke="rgb(126, 34, 206)"
            strokeWidth="1.5"
            filter={`url(#butterflyBevel-${uniqueId})`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "50% 35%", transformStyle: "preserve-3d" }}
          />

          <motion.path
            d="M 50 25 Q 75 15, 85 25 Q 90 35, 85 45 Q 75 50, 65 48 Q 60 35, 50 25 Z"
            fill={`url(#butterflyXWing2-${uniqueId})`}
            stroke="rgb(126, 34, 206)"
            strokeWidth="1.5"
            filter={`url(#butterflyBevel-${uniqueId})`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "50% 35%", transformStyle: "preserve-3d" }}
          />

          <motion.path
            d="M 50 75 Q 25 65, 18 72 Q 12 80, 18 88 Q 28 92, 38 88 Q 45 80, 50 75 Z"
            fill={`url(#butterflyXWing1-${uniqueId})`}
            stroke="rgb(126, 34, 206)"
            strokeWidth="1.5"
            filter={`url(#butterflyBevel-${uniqueId})`}
            opacity="0.95"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "50% 65%", transformStyle: "preserve-3d" }}
          />

          <motion.path
            d="M 50 75 Q 75 65, 82 72 Q 88 80, 82 88 Q 72 92, 62 88 Q 55 80, 50 75 Z"
            fill={`url(#butterflyXWing2-${uniqueId})`}
            stroke="rgb(126, 34, 206)"
            strokeWidth="1.5"
            filter={`url(#butterflyBevel-${uniqueId})`}
            opacity="0.95"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "50% 65%", transformStyle: "preserve-3d" }}
          />
        </motion.g>

        <motion.path
          d="M 30 30 L 70 70"
          stroke="rgb(88, 28, 135)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          filter={`url(#butterflyBevel-${uniqueId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
        />

        <motion.path
          d="M 70 30 L 30 70"
          stroke="rgb(88, 28, 135)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          filter={`url(#butterflyBevel-${uniqueId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.35 }}
        />

        <motion.ellipse
          cx="50"
          cy="50"
          rx="5"
          ry="25"
          fill={`url(#butterflyXBody-${uniqueId})`}
          stroke="rgb(59, 7, 100)"
          strokeWidth="1"
          filter={`url(#butterflyBevel-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />

        <motion.path
          d="M 48 20 Q 46 12, 44 8"
          stroke="rgb(88, 28, 135)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          style={{ transformOrigin: "48px 20px" }}
        />
        <motion.circle
          cx="44"
          cy="8"
          r="2"
          fill="rgb(168, 85, 247)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.6 }}
        />

        <motion.path
          d="M 52 20 Q 54 12, 56 8"
          stroke="rgb(88, 28, 135)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          style={{ transformOrigin: "52px 20px" }}
        />
        <motion.circle
          cx="56"
          cy="8"
          r="2"
          fill="rgb(168, 85, 247)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.6 }}
        />

        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) + 22.5;
          const radius = 35;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          
          return (
            <motion.circle
              key={`sparkle-${i}`}
              cx={x}
              cy={y}
              r="1.5"
              fill="rgb(216, 180, 254)"
              opacity="0.6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.8 }}
              transition={{
                duration: 0.5,
                delay: 0.6 + i * 0.05,
                ease: "easeOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function ButterflyO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 3
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
          <linearGradient id={`butterflyOWing1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(251, 146, 60)", stopOpacity: 0.95 }} />
            <stop offset="50%" style={{ stopColor: "rgb(249, 115, 22)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(234, 88, 12)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`butterflyOWing2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(253, 186, 116)", stopOpacity: 0.95 }} />
            <stop offset="50%" style={{ stopColor: "rgb(251, 146, 60)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(249, 115, 22)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`butterflyOBody-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(124, 45, 18)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(69, 26, 3)", stopOpacity: 1 }} />
          </radialGradient>
          <filter id={`butterflyOBevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
            <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.6" specularExponent="20" lightingColor="#FFA500" result="specOut">
              <fePointLight x="-5000" y="-10000" z="30000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.g
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 0 }}
          style={{ transformOrigin: "50% 50%", transformStyle: "preserve-3d" }}
        >
          <motion.path
            d="M 50 25 Q 25 15, 15 25 Q 10 35, 15 45 Q 25 50, 35 48 Q 40 35, 50 25 Z"
            fill={`url(#butterflyOWing1-${uniqueId})`}
            stroke="rgb(234, 88, 12)"
            strokeWidth="1.5"
            filter={`url(#butterflyOBevel-${uniqueId})`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "50% 35%", transformStyle: "preserve-3d" }}
          />

          <motion.path
            d="M 50 25 Q 75 15, 85 25 Q 90 35, 85 45 Q 75 50, 65 48 Q 60 35, 50 25 Z"
            fill={`url(#butterflyOWing2-${uniqueId})`}
            stroke="rgb(234, 88, 12)"
            strokeWidth="1.5"
            filter={`url(#butterflyOBevel-${uniqueId})`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "50% 35%", transformStyle: "preserve-3d" }}
          />

          <motion.path
            d="M 50 75 Q 25 65, 18 72 Q 12 80, 18 88 Q 28 92, 38 88 Q 45 80, 50 75 Z"
            fill={`url(#butterflyOWing1-${uniqueId})`}
            stroke="rgb(234, 88, 12)"
            strokeWidth="1.5"
            filter={`url(#butterflyOBevel-${uniqueId})`}
            opacity="0.95"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "50% 65%", transformStyle: "preserve-3d" }}
          />

          <motion.path
            d="M 50 75 Q 75 65, 82 72 Q 88 80, 82 88 Q 72 92, 62 88 Q 55 80, 50 75 Z"
            fill={`url(#butterflyOWing2-${uniqueId})`}
            stroke="rgb(234, 88, 12)"
            strokeWidth="1.5"
            filter={`url(#butterflyOBevel-${uniqueId})`}
            opacity="0.95"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "50% 65%", transformStyle: "preserve-3d" }}
          />
        </motion.g>

        <motion.circle
          cx="50"
          cy="50"
          r="25"
          stroke="rgb(124, 45, 18)"
          strokeWidth="10"
          fill="none"
          filter={`url(#butterflyOBevel-${uniqueId})`}
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          style={{ originX: "50%", originY: "50%" }}
        />

        <motion.ellipse
          cx="50"
          cy="50"
          rx="5"
          ry="25"
          fill={`url(#butterflyOBody-${uniqueId})`}
          stroke="rgb(69, 26, 3)"
          strokeWidth="1"
          filter={`url(#butterflyOBevel-${uniqueId})`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />

        <motion.path
          d="M 48 20 Q 46 12, 44 8"
          stroke="rgb(124, 45, 18)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          style={{ transformOrigin: "48px 20px" }}
        />
        <motion.circle
          cx="44"
          cy="8"
          r="2"
          fill="rgb(251, 146, 60)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.6 }}
        />

        <motion.path
          d="M 52 20 Q 54 12, 56 8"
          stroke="rgb(124, 45, 18)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          style={{ transformOrigin: "52px 20px" }}
        />
        <motion.circle
          cx="56"
          cy="8"
          r="2"
          fill="rgb(251, 146, 60)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.6 }}
        />

        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) + 22.5;
          const radius = 40;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          
          return (
            <motion.circle
              key={`sparkle-${i}`}
              cx={x}
              cy={y}
              r="1.5"
              fill="rgb(254, 215, 170)"
              opacity="0.6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.8 }}
              transition={{
                duration: 0.5,
                delay: 0.6 + i * 0.05,
                ease: "easeOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function PeacockX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateY: -180 }}
      animate={{ scale: 1, rotateY: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 18,
        duration: 3
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
          <linearGradient id={`peacockXFeather1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(16, 185, 129)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(5, 150, 105)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(6, 78, 59)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`peacockXFeather2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(14, 165, 233)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(59, 130, 246)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(37, 99, 235)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`peacockXEye-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(147, 51, 234)", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "rgb(59, 130, 246)", stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: "rgb(16, 185, 129)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(6, 78, 59)", stopOpacity: 1 }} />
          </radialGradient>
          <filter id={`peacockBevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
            <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.6" specularExponent="20" lightingColor="#ffffff" result="specOut">
              <fePointLight x="-5000" y="-10000" z="30000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.g
          style={{ transformOrigin: "50% 50%", transformStyle: "preserve-3d" }}
        >
          <motion.path
            d="M 20 20 L 80 80"
            stroke={`url(#peacockXFeather1-${uniqueId})`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            filter={`url(#peacockBevel-${uniqueId})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          
          <motion.path
            d="M 80 20 L 20 80"
            stroke={`url(#peacockXFeather2-${uniqueId})`}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            filter={`url(#peacockBevel-${uniqueId})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          />

          <motion.circle
            cx="35"
            cy="35"
            r="7"
            fill={`url(#peacockXEye-${uniqueId})`}
            stroke="rgb(16, 185, 129)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          />
          <motion.circle
            cx="35"
            cy="35"
            r="3.5"
            fill="rgb(59, 130, 246)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.6 }}
          />
          <motion.circle
            cx="35"
            cy="35"
            r="1.2"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, delay: 0.7 }}
          />

          <motion.circle
            cx="65"
            cy="35"
            r="7"
            fill={`url(#peacockXEye-${uniqueId})`}
            stroke="rgb(14, 165, 233)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.55 }}
          />
          <motion.circle
            cx="65"
            cy="35"
            r="3.5"
            fill="rgb(147, 51, 234)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.65 }}
          />
          <motion.circle
            cx="65"
            cy="35"
            r="1.2"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, delay: 0.75 }}
          />

          <motion.circle
            cx="35"
            cy="65"
            r="7"
            fill={`url(#peacockXEye-${uniqueId})`}
            stroke="rgb(14, 165, 233)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          />
          <motion.circle
            cx="35"
            cy="65"
            r="3.5"
            fill="rgb(16, 185, 129)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.7 }}
          />
          <motion.circle
            cx="35"
            cy="65"
            r="1.2"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, delay: 0.8 }}
          />

          <motion.circle
            cx="65"
            cy="65"
            r="7"
            fill={`url(#peacockXEye-${uniqueId})`}
            stroke="rgb(16, 185, 129)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.65 }}
          />
          <motion.circle
            cx="65"
            cy="65"
            r="3.5"
            fill="rgb(147, 51, 234)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.75 }}
          />
          <motion.circle
            cx="65"
            cy="65"
            r="1.2"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, delay: 0.85 }}
          />
        </motion.g>

        {[...Array(12)].map((_, i) => {
          const angle = i * 30;
          const radius = 42;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          
          return (
            <motion.circle
              key={`sparkle-${i}`}
              cx={x}
              cy={y}
              r="1.2"
              fill={i % 3 === 0 ? "rgb(147, 51, 234)" : i % 3 === 1 ? "rgb(14, 165, 233)" : "rgb(16, 185, 129)"}
              opacity="0.8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0.9 }}
              transition={{
                duration: 0.4,
                delay: 0.7 + i * 0.03,
                ease: "easeOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function PeacockO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotateY: -180 }}
      animate={{ scale: 1, rotateY: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 18,
        duration: 3
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
          <radialGradient id={`peacockOGradient-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(251, 191, 36)", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "rgb(245, 158, 11)", stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: "rgb(217, 119, 6)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(180, 83, 9)", stopOpacity: 1 }} />
          </radialGradient>
          <linearGradient id={`peacockOFeather1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(251, 191, 36)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(245, 158, 11)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(217, 119, 6)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`peacockOFeather2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(251, 146, 60)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(249, 115, 22)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(234, 88, 12)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`peacockOEye-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(168, 85, 247)", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "rgb(217, 119, 6)", stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: "rgb(251, 191, 36)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(180, 83, 9)", stopOpacity: 1 }} />
          </radialGradient>
          <filter id={`peacockOBevel-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
            <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.6" specularExponent="20" lightingColor="#FFA500" result="specOut">
              <fePointLight x="-5000" y="-10000" z="30000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <motion.g
          style={{ transformOrigin: "50% 50%", transformStyle: "preserve-3d" }}
        >
          <motion.circle
            cx="50"
            cy="50"
            r="30"
            stroke={`url(#peacockOGradient-${uniqueId})`}
            strokeWidth="12"
            fill="none"
            filter={`url(#peacockOBevel-${uniqueId})`}
            initial={{ pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ originX: "50%", originY: "50%" }}
          />

          <motion.circle
            cx="50"
            cy="20"
            r="6"
            fill={`url(#peacockOEye-${uniqueId})`}
            stroke="rgb(251, 191, 36)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          />
          <motion.circle
            cx="50"
            cy="20"
            r="3"
            fill="rgb(168, 85, 247)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.4 }}
          />
          <motion.circle
            cx="50"
            cy="20"
            r="1"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, delay: 0.5 }}
          />

          <motion.circle
            cx="50"
            cy="80"
            r="6"
            fill={`url(#peacockOEye-${uniqueId})`}
            stroke="rgb(245, 158, 11)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          />
          <motion.circle
            cx="50"
            cy="80"
            r="3"
            fill="rgb(251, 146, 60)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.45 }}
          />
          <motion.circle
            cx="50"
            cy="80"
            r="1"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, delay: 0.55 }}
          />

          <motion.circle
            cx="20"
            cy="50"
            r="6"
            fill={`url(#peacockOEye-${uniqueId})`}
            stroke="rgb(251, 191, 36)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />
          <motion.circle
            cx="20"
            cy="50"
            r="3"
            fill="rgb(217, 119, 6)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.5 }}
          />
          <motion.circle
            cx="20"
            cy="50"
            r="1"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, delay: 0.6 }}
          />

          <motion.circle
            cx="80"
            cy="50"
            r="6"
            fill={`url(#peacockOEye-${uniqueId})`}
            stroke="rgb(245, 158, 11)"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.45 }}
          />
          <motion.circle
            cx="80"
            cy="50"
            r="3"
            fill="rgb(168, 85, 247)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.55 }}
          />
          <motion.circle
            cx="80"
            cy="50"
            r="1"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, delay: 0.65 }}
          />

          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = i * 45;
            const x = 50 + 38 * Math.cos((angle * Math.PI) / 180);
            const y = 50 + 38 * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.path
                key={`feather-${i}`}
                d={`M 50 50 L ${x} ${y}`}
                stroke={i % 2 === 0 ? `url(#peacockOFeather1-${uniqueId})` : `url(#peacockOFeather2-${uniqueId})`}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.04 }}
              />
            );
          })}
        </motion.g>

        {[...Array(12)].map((_, i) => {
          const angle = i * 30;
          const radius = 48;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
          
          return (
            <motion.circle
              key={`sparkle-${i}`}
              cx={x}
              cy={y}
              r="1.2"
              fill={i % 3 === 0 ? "rgb(168, 85, 247)" : i % 3 === 1 ? "rgb(251, 191, 36)" : "rgb(249, 115, 22)"}
              opacity="0.8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0.9 }}
              transition={{
                duration: 0.4,
                delay: 0.7 + i * 0.03,
                ease: "easeOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}
function BulbX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
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
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <radialGradient id={`bulbGlow-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(255, 255, 200)", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "rgb(255, 220, 100)", stopOpacity: 0.9 }} />
            <stop offset="80%" style={{ stopColor: "rgb(255, 180, 50)", stopOpacity: 0.7 }} />
            <stop offset="100%" style={{ stopColor: "rgb(255, 150, 0)", stopOpacity: 0.5 }} />
          </radialGradient>
          <linearGradient id={`bulbXLine1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(255, 240, 150)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(255, 200, 80)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(255, 180, 50)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`bulbXLine2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(255, 240, 150)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(255, 200, 80)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(255, 180, 50)", stopOpacity: 1 }} />
          </linearGradient>
          <filter id={`bulbGlassX-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.8" specularExponent="20" lightingColor="#ffffff" result="specOut">
              <fePointLight x="-5000" y="-10000" z="30000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <g>
          <motion.ellipse 
            cx="35" cy="35" rx="18" ry="22" 
            fill={`url(#bulbGlow-${uniqueId})`} 
            filter={`url(#bulbGlassX-${uniqueId})`}
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.8, 0.3] }}
            transition={{ duration: 0.4, times: [0, 0.5, 1], delay: 0.3 }}
          />
          <motion.ellipse 
            cx="65" cy="35" rx="18" ry="22" 
            fill={`url(#bulbGlow-${uniqueId})`} 
            filter={`url(#bulbGlassX-${uniqueId})`}
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.8, 0.3] }}
            transition={{ duration: 0.4, times: [0, 0.5, 1], delay: 0.5 }}
          />
          <motion.ellipse 
            cx="35" cy="65" rx="18" ry="22" 
            fill={`url(#bulbGlow-${uniqueId})`} 
            filter={`url(#bulbGlassX-${uniqueId})`}
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.8, 0.3] }}
            transition={{ duration: 0.4, times: [0, 0.5, 1], delay: 0.7 }}
          />
          <motion.ellipse 
            cx="65" cy="65" rx="18" ry="22" 
            fill={`url(#bulbGlow-${uniqueId})`} 
            filter={`url(#bulbGlassX-${uniqueId})`}
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.8, 0.3] }}
            transition={{ duration: 0.4, times: [0, 0.5, 1], delay: 0.9 }}
          />
        </g>

        <motion.path d="M 20 20 L 80 80" stroke={`url(#bulbXLine1-${uniqueId})`} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ transform: "translate(3px, 3px)" }} />
        <motion.path d="M 80 20 L 20 80" stroke={`url(#bulbXLine2-${uniqueId})`} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} style={{ transform: "translate(3px, 3px)" }} />
        <motion.path d="M 20 20 L 80 80" stroke={`url(#bulbXLine1-${uniqueId})`} strokeWidth="14" strokeLinecap="round" fill="none" filter={`url(#bulbGlassX-${uniqueId})`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} />
        <motion.path d="M 80 20 L 20 80" stroke={`url(#bulbXLine2-${uniqueId})`} strokeWidth="14" strokeLinecap="round" fill="none" filter={`url(#bulbGlassX-${uniqueId})`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} />

        <g>
          <motion.circle 
            cx="35" cy="35" r="2" 
            fill="rgb(255, 255, 255)" 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.4 }}
          />
          <motion.circle 
            cx="65" cy="35" r="2" 
            fill="rgb(255, 255, 255)" 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.6 }}
          />
          <motion.circle 
            cx="35" cy="65" r="2" 
            fill="rgb(255, 255, 255)" 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.8 }}
          />
          <motion.circle 
            cx="65" cy="65" r="2" 
            fill="rgb(255, 255, 255)" 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 0.2, delay: 1.0 }}
          />
        </g>

        <path d="M 33 12 L 33 18 M 37 12 L 37 18" stroke="rgb(180, 180, 180)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M 63 12 L 63 18 M 67 12 L 67 18" stroke="rgb(180, 180, 180)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M 33 82 L 33 88 M 37 82 L 37 88" stroke="rgb(180, 180, 180)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M 63 82 L 63 88 M 67 82 L 67 88" stroke="rgb(180, 180, 180)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    </motion.div>
  );
}

function BulbO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
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
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <radialGradient id={`bulbOGlow-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(255, 230, 230)", stopOpacity: 1 }} />
            <stop offset="30%" style={{ stopColor: "rgb(255, 150, 150)", stopOpacity: 0.95 }} />
            <stop offset="60%" style={{ stopColor: "rgb(255, 100, 100)", stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: "rgb(220, 50, 50)", stopOpacity: 0.6 }} />
          </radialGradient>
          <radialGradient id={`bulbOStroke-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(255, 200, 200)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(255, 120, 120)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(220, 60, 60)", stopOpacity: 1 }} />
          </radialGradient>
          <filter id={`bulbGlassO-${uniqueId}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.8" specularExponent="20" lightingColor="#ffffff" result="specOut">
              <fePointLight x="-5000" y="-10000" z="30000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>

        <g>
          <motion.ellipse 
            cx="50" cy="50" rx="35" ry="40" 
            fill={`url(#bulbOGlow-${uniqueId})`} 
            filter={`url(#bulbGlassO-${uniqueId})`}
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.8, 0.3] }}
            transition={{ duration: 0.6, times: [0, 0.6, 1], delay: 0.3 }}
          />
        </g>

        <motion.circle cx="50" cy="50" r="32" stroke={`url(#bulbOStroke-${uniqueId})`} strokeWidth="18" fill="none" opacity="0.4" initial={{ pathLength: 0, rotate: -90 }} animate={{ pathLength: 1, rotate: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ originX: "50%", originY: "50%", transform: "translate(3px, 3px)" }} />
        <motion.circle cx="50" cy="50" r="32" stroke={`url(#bulbOStroke-${uniqueId})`} strokeWidth="14" fill="none" filter={`url(#bulbGlassO-${uniqueId})`} initial={{ pathLength: 0, rotate: -90 }} animate={{ pathLength: 1, rotate: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ originX: "50%", originY: "50%" }} />

        <g>
          <motion.circle 
            cx="50" cy="50" r="44" 
            fill="none" 
            stroke="rgba(255, 150, 150, 0.3)" 
            strokeWidth="3"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3] }}
            transition={{ duration: 0.5, times: [0, 0.7, 1], delay: 0.4 }}
          />
        </g>

        <g>
          <motion.circle 
            cx="50" cy="30" r="2.5" 
            fill="rgb(255, 255, 255)" 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          />
          <motion.circle 
            cx="35" cy="42" r="2" 
            fill="rgb(255, 255, 255)" 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          />
          <motion.circle 
            cx="65" cy="42" r="2" 
            fill="rgb(255, 255, 255)" 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          />
        </g>

        <path d="M 48 13 L 48 19 M 52 13 L 52 19" stroke="rgb(180, 180, 180)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <path d="M 48 81 L 48 87 M 52 81 L 52 87" stroke="rgb(180, 180, 180)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <rect x="45" y="10" width="10" height="4" rx="1" fill="rgb(150, 150, 150)" opacity="0.6" />
        <rect x="45" y="86" width="10" height="4" rx="1" fill="rgb(150, 150, 150)" opacity="0.6" />
      </svg>
    </motion.div>
  );
}

function MoonStarX({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 3px 10px rgba(168, 85, 247, 0.5))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <linearGradient id={`moonGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgb(196, 181, 253)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(168, 85, 247)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(126, 34, 206)", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id={`starGradient-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(253, 224, 71)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(234, 179, 8)", stopOpacity: 0.8 }} />
          </radialGradient>
        </defs>

        {/* X lines forming the base */}
        <motion.path
          d="M 20 20 L 80 80"
          stroke={`url(#moonGradient-${uniqueId})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        <motion.path
          d="M 80 20 L 20 80"
          stroke={`url(#moonGradient-${uniqueId})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
        />

        {/* Crescent Moon */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <path
            d="M 30 50 Q 30 30, 45 25 Q 40 40, 40 50 Q 40 60, 45 75 Q 30 70, 30 50 Z"
            fill={`url(#moonGradient-${uniqueId})`}
            opacity="0.9"
          />
        </motion.g>

        {/* Twinkling Stars */}
        <motion.g
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 60 20 L 62 25 L 67 26 L 63 30 L 64 35 L 60 32 L 56 35 L 57 30 L 53 26 L 58 25 Z"
            fill={`url(#starGradient-${uniqueId})`}
            opacity="0.9"
          />
        </motion.g>

        <motion.g
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.8,
            delay: 0.3,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 70 45 L 71.5 48 L 74.5 48.5 L 72 51 L 72.5 54 L 70 52.5 L 67.5 54 L 68 51 L 65.5 48.5 L 68.5 48 Z"
            fill={`url(#starGradient-${uniqueId})`}
            opacity="0.85"
          />
        </motion.g>

        <motion.g
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            delay: 0.6,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 55 65 L 56.5 68 L 59.5 68.5 L 57 71 L 57.5 74 L 55 72.5 L 52.5 74 L 53 71 L 50.5 68.5 L 53.5 68 Z"
            fill={`url(#starGradient-${uniqueId})`}
            opacity="0.8"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function MoonStarO({ className = "", uniqueId }: { className?: string; uniqueId: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotate: 180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ 
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ 
          filter: "drop-shadow(0 3px 10px rgba(236, 72, 153, 0.5))",
          transformStyle: "preserve-3d"
        }}
      >
        <defs>
          <radialGradient id={`moonOGradient-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(251, 207, 232)", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(219, 39, 119)", stopOpacity: 1 }} />
          </radialGradient>
          <radialGradient id={`starOGradient-${uniqueId}`}>
            <stop offset="0%" style={{ stopColor: "rgb(253, 224, 71)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgb(234, 179, 8)", stopOpacity: 0.8 }} />
          </radialGradient>
        </defs>

        {/* O circle base */}
        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke={`url(#moonOGradient-${uniqueId})`}
          strokeWidth="14"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />

        {/* Crescent Moon */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <path
            d="M 65 50 Q 65 35, 73 32 Q 70 43, 70 50 Q 70 57, 73 68 Q 65 65, 65 50 Z"
            fill={`url(#moonOGradient-${uniqueId})`}
            opacity="0.9"
          />
        </motion.g>

        {/* Twinkling Stars */}
        <motion.g
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 28 25 L 30 29 L 34 30 L 30.5 33 L 31 37 L 28 35 L 25 37 L 25.5 33 L 22 30 L 26 29 Z"
            fill={`url(#starOGradient-${uniqueId})`}
            opacity="0.9"
          />
        </motion.g>

        <motion.g
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.8,
            delay: 0.3,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 20 55 L 21.5 58 L 24.5 58.5 L 22 61 L 22.5 64 L 20 62.5 L 17.5 64 L 18 61 L 15.5 58.5 L 18.5 58 Z"
            fill={`url(#starOGradient-${uniqueId})`}
            opacity="0.85"
          />
        </motion.g>

        <motion.g
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            delay: 0.6,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 35 70 L 36.5 73 L 39.5 73.5 L 37 76 L 37.5 79 L 35 77.5 L 32.5 79 L 33 76 L 30.5 73.5 L 33.5 73 Z"
            fill={`url(#starOGradient-${uniqueId})`}
            opacity="0.8"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}
