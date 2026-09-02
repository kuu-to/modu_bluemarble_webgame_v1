import React from 'react';
import { AirplaneColorId, AIRPLANE_CONFIGS } from '../utils/airplaneConfig';

interface AirplanePieceProps {
  colorId: AirplaneColorId | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  shadow?: boolean;
  animate?: boolean;
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24'
};

export const AirplanePiece: React.FC<AirplanePieceProps> = ({
  colorId,
  size = 'md',
  className = '',
  shadow = true,
  animate = false
}) => {
  const validColorId: AirplaneColorId = (['red', 'blue', 'white', 'yellow'].includes(colorId) 
    ? colorId 
    : 'red') as AirplaneColorId;
  
  const config = AIRPLANE_CONFIGS[validColorId] || AIRPLANE_CONFIGS.red;
  const isWhite = validColorId === 'white';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${SIZE_MAP[size]} ${className} ${
        animate ? 'animate-bounce' : ''
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md select-none pointer-events-none"
        style={{
          filter: shadow
            ? isWhite
              ? 'drop-shadow(0px 3px 4px rgba(0,0,0,0.5)) drop-shadow(0px 0px 2px rgba(0,0,0,0.8))'
              : `drop-shadow(0px 3px 5px rgba(0,0,0,0.5)) drop-shadow(0px 0px 6px ${config.primaryColor}88)`
            : undefined
        }}
      >
        <defs>
          {/* Main Fuselage Gradient */}
          <linearGradient id={`plane-body-${validColorId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isWhite ? '#ffffff' : config.glowColor} />
            <stop offset="50%" stopColor={config.primaryColor} />
            <stop offset="100%" stopColor={config.secondaryColor} />
          </linearGradient>

          {/* Left Wing Gradient */}
          <linearGradient id={`plane-wing-left-${validColorId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={config.primaryColor} />
            <stop offset="100%" stopColor={config.secondaryColor} />
          </linearGradient>

          {/* Right Wing Gradient */}
          <linearGradient id={`plane-wing-right-${validColorId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isWhite ? '#ffffff' : config.glowColor} />
            <stop offset="100%" stopColor={config.wingColor} />
          </linearGradient>

          {/* Glossy Plastic Specular Highlight */}
          <linearGradient id={`plane-specular-${validColorId}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Base Drop Shadow on Board */}
        <ellipse cx="50" cy="85" rx="30" ry="6" fill="#000000" opacity="0.25" />

        {/* 2. Swept Delta Wings (Main Aerodynamic Wing Structure) */}
        <path
          d="M 50 25 L 88 64 L 88 74 L 62 70 L 50 82 L 38 70 L 12 74 L 12 64 Z"
          fill={`url(#plane-wing-left-${validColorId})`}
          stroke={isWhite ? '#64748b' : config.secondaryColor}
          strokeWidth={isWhite ? '2' : '1.5'}
          strokeLinejoin="round"
        />

        {/* 3. Wingtip Vertical Stabilizer Fins (Classic Blue Marble airplane winglets) */}
        <path
          d="M 12 60 L 8 48 L 14 65 Z"
          fill={config.secondaryColor}
          stroke={isWhite ? '#475569' : '#00000033'}
          strokeWidth="1"
        />
        <path
          d="M 88 60 L 92 48 L 86 65 Z"
          fill={config.secondaryColor}
          stroke={isWhite ? '#475569' : '#00000033'}
          strokeWidth="1"
        />

        {/* 4. Sleek Jet Fuselage (Nose to Tail) */}
        <path
          d="M 50 6 C 54 18, 56 34, 56 60 C 56 75, 54 88, 50 92 C 46 88, 44 75, 44 60 C 44 34, 46 18, 50 6 Z"
          fill={`url(#plane-body-${validColorId})`}
          stroke={isWhite ? '#64748b' : config.secondaryColor}
          strokeWidth={isWhite ? '2' : '1.5'}
          strokeLinejoin="round"
        />

        {/* 5. Rear Horizontal Stabilizer & Jet Nozzle */}
        <path
          d="M 38 72 L 50 86 L 62 72 L 54 74 L 50 80 L 46 74 Z"
          fill={config.secondaryColor}
          opacity="0.9"
        />

        {/* 6. Cockpit Canopy Window (Aerodynamic Glass Ridge) */}
        <ellipse
          cx="50"
          cy="28"
          rx="3.5"
          ry="11"
          fill={isWhite ? '#1e293b' : '#ffffff'}
          stroke={isWhite ? '#0f172a' : config.secondaryColor}
          strokeWidth="1"
          opacity={isWhite ? '0.9' : '0.85'}
        />
        <ellipse
          cx="49"
          cy="25"
          rx="1.5"
          ry="6"
          fill="#ffffff"
          opacity={isWhite ? '0.7' : '0.95'}
        />

        {/* 7. Fuselage Glossy Ridge Reflection (Gives realistic 3D plastic shine) */}
        <path
          d="M 48 10 C 49.5 22, 50.5 40, 50.5 60 C 50.5 72, 49.5 82, 48 86 C 47 82, 46 72, 46 60 C 46 40, 47 22, 48 10 Z"
          fill={`url(#plane-specular-${validColorId})`}
        />

        {/* 8. Left & Right Wing Edge Highlights */}
        <line
          x1="50"
          y1="25"
          x2="84"
          y2="63"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1="50"
          y1="25"
          x2="16"
          y2="63"
          stroke={isWhite ? '#94a3b8' : config.secondaryColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
