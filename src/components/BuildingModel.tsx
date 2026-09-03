import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles } from 'lucide-react';
import { CityLandmarkIcon } from './CityLandmarks';

interface BuildingModelProps {
  buildings: {
    hasVilla: boolean;
    hasBuilding: boolean;
    hasHotel: boolean;
    isLandmark: boolean;
  };
  ownerColor: string;
  spaceId?: number;
  cityName?: string;
  isSpecialLand?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * 🏡 실제 부루마블 3D 플라스틱 미니어처 모델 (image2.png 완벽 재현)
 */

// 1. 별장 (Villa / House): 빨간 삼각 박공 지붕과 기와 골, 굴뚝이 있는 단독 주택 미니어처
export const VillaMiniature: React.FC<{ color: string; size?: 'sm' | 'md' }> = ({ color, size = 'md' }) => {
  const isSm = size === 'sm';
  const width = isSm ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className={`relative ${width} flex items-end justify-center filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]`}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <defs>
          <linearGradient id={`villa-roof-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="30%" stopColor={color} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={`villa-wall-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* 굴뚝 (Chimney) */}
        <rect x="5" y="4" width="2.5" height="5" fill={color} stroke="#000000" strokeWidth="0.5" />
        <rect x="4.5" y="3.5" width="3.5" height="1" fill="#ffffff" opacity="0.6" />

        {/* 삼각 박공 지붕 본체 */}
        <polygon
          points="12,3 2,13 22,13"
          fill={`url(#villa-roof-${color.replace('#', '')})`}
          stroke="#000000"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />

        {/* 지붕 수평 기와 굴곡 라인 (image2.png의 기와 골 디테일) */}
        <line x1="5" y1="10" x2="19" y2="10" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        <line x1="7.5" y1="7.5" x2="16.5" y2="7.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        <line x1="10" y1="5.2" x2="14" y2="5.2" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />

        {/* 하단 벽체 */}
        <rect
          x="3.5"
          y="13"
          width="17"
          height="8.5"
          fill={`url(#villa-wall-${color.replace('#', '')})`}
          stroke="#000000"
          strokeWidth="0.6"
          rx="0.5"
        />

        {/* 문 & 창문 몰딩 */}
        <rect x="9.5" y="15" width="5" height="6.5" fill="#000000" opacity="0.3" rx="0.5" />
        <rect x="10.5" y="16" width="3" height="5.5" fill="#ffffff" opacity="0.8" />
        <rect x="5" y="14.5" width="3" height="3" fill="#ffffff" opacity="0.85" rx="0.3" />
        <rect x="16" y="14.5" width="3" height="3" fill="#ffffff" opacity="0.85" rx="0.3" />
      </svg>
    </div>
  );
};

// 2. 빌딩 (Building): 상단 층계형 턱과 전면 4개 수직 세로 홈(Flutes)이 조각된 고층 빌딩 미니어처 (image2.png 완벽 재현)
export const BuildingMiniature: React.FC<{ color: string; size?: 'sm' | 'md' }> = ({ color, size = 'md' }) => {
  const isSm = size === 'sm';
  const width = isSm ? 'w-4 h-5' : 'w-5 h-6';

  return (
    <div className={`relative ${width} flex items-end justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]`}>
      <svg viewBox="0 0 24 28" className="w-full h-full">
        <defs>
          <linearGradient id={`bld-grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="30%" stopColor={color} />
            <stop offset="70%" stopColor={color} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 상단 옥상 턱 (Stepped Bevel Top) */}
        <rect x="8" y="1" width="8" height="2" fill="#ffffff" opacity="0.8" rx="0.5" />
        <rect x="6" y="3" width="12" height="2" fill={color} stroke="#000000" strokeWidth="0.5" />

        {/* 본체 타워 */}
        <rect
          x="4"
          y="5"
          width="16"
          height="21"
          fill={`url(#bld-grad-${color.replace('#', '')})`}
          stroke="#000000"
          strokeWidth="0.6"
          rx="0.5"
        />

        {/* 4개의 전면 수직 립(Fluting Ribs) & 중앙 홈 */}
        <rect x="6" y="6" width="2" height="18" fill="#ffffff" opacity="0.5" />
        <rect x="9.5" y="6" width="2" height="18" fill="#ffffff" opacity="0.6" />
        <rect x="13" y="6" width="2" height="18" fill="#ffffff" opacity="0.6" />
        <rect x="16.5" y="6" width="2" height="18" fill="#ffffff" opacity="0.3" />

        {/* 세로 음영 구분선 */}
        <line x1="8.5" y1="6" x2="8.5" y2="24" stroke="#000000" strokeWidth="0.6" opacity="0.5" />
        <line x1="12" y1="6" x2="12" y2="24" stroke="#000000" strokeWidth="0.7" opacity="0.6" />
        <line x1="15.5" y1="6" x2="15.5" y2="24" stroke="#000000" strokeWidth="0.6" opacity="0.5" />

        {/* 기단 받침대 */}
        <rect x="3" y="25" width="18" height="2" fill="#000000" opacity="0.4" rx="0.3" />
      </svg>
    </div>
  );
};

// 3. 호텔 (Hotel): 원추형/팔각형 기둥에 굵은 수직 홈과 상단 원형 림(Rim)이 있는 럭셔리 호텔 미니어처 (image2.png 완벽 재현)
export const HotelMiniature: React.FC<{ color: string; size?: 'sm' | 'md' }> = ({ color, size = 'md' }) => {
  const isSm = size === 'sm';
  const width = isSm ? 'w-4 h-5' : 'w-5 h-6';

  return (
    <div className={`relative ${width} flex items-end justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]`}>
      <svg viewBox="0 0 24 28" className="w-full h-full">
        <defs>
          <linearGradient id={`hotel-grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="25%" stopColor={color} />
            <stop offset="75%" stopColor={color} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* 옥상 원형 크라운 림 & 오목한 소켓 (Circular Rim with Center Recess) */}
        <ellipse cx="12" cy="3.5" rx="7" ry="2.2" fill={color} stroke="#000000" strokeWidth="0.6" />
        <ellipse cx="12" cy="3" rx="6" ry="1.7" fill="#ffffff" opacity="0.6" />
        <ellipse cx="12" cy="3" rx="3" ry="1" fill="#000000" opacity="0.4" />

        {/* 사다리꼴 테이퍼 바디 (Tapered Fluted Column) */}
        <polygon
          points="5,3.5 19,3.5 21,24 3,24"
          fill={`url(#hotel-grad-${color.replace('#', '')})`}
          stroke="#000000"
          strokeWidth="0.6"
        />

        {/* 호텔 특유의 굵은 6줄 수직 기둥 홈 (Deep Fluted Ribs) */}
        <line x1="6" y1="4" x2="4.5" y2="23" stroke="#ffffff" strokeWidth="0.9" opacity="0.5" />
        <line x1="8.5" y1="4" x2="7.5" y2="23" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
        <line x1="11" y1="4" x2="10.5" y2="23" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
        <line x1="13.5" y1="4" x2="14" y2="23" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
        <line x1="16" y1="4" x2="17" y2="23" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
        <line x1="18" y1="4" x2="19.5" y2="23" stroke="#000000" strokeWidth="0.8" opacity="0.4" />

        {/* 하단 기단 받침대 */}
        <rect x="2" y="24" width="20" height="2.5" fill="#000000" opacity="0.45" rx="0.5" />
      </svg>
    </div>
  );
};

export const BuildingModel: React.FC<BuildingModelProps> = ({
  buildings,
  ownerColor,
  spaceId = 0,
  cityName = '',
  isSpecialLand,
  orientation = 'horizontal'
}) => {
  const { hasVilla, hasBuilding, hasHotel, isLandmark } = buildings;

  // 1. 랜드마크 (LANDMARK):
  if (isLandmark) {
    return (
      <div className="relative flex items-center justify-center w-full h-full pointer-events-none z-10 p-0.5">
        <motion.div
          initial={{ scale: 0, y: -20, rotateY: 90 }}
          animate={{ scale: 1, y: 0, rotateY: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 260 }}
          className="relative flex flex-col items-center justify-center w-full h-full"
        >
          {/* 황금빛 랜드마크 받침대 & 외곽 테두리 (Gold Pedestal & Halo) */}
          <div className="absolute inset-0 rounded-sm bg-amber-400/25 border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.85)] pointer-events-none" />

          {/* 소유주 엠블럼 & 황금 왕관 */}
          <div className="absolute -top-3 z-20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [-4, 4, -4], y: [0, -1, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex items-center gap-0.5 px-1 py-0.2 rounded-full shadow-lg border border-amber-300 bg-amber-950/90 text-amber-200"
            >
              <Crown className="w-2.5 h-2.5 text-yellow-300 fill-yellow-400 drop-shadow" />
              <span className="text-[6.5px] font-black tracking-tighter text-amber-200">LM</span>
            </motion.div>
          </div>

          {/* 반짝이는 별빛 효과 */}
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-1.5 right-0 text-amber-300 pointer-events-none"
          >
            <Sparkles className="w-3 h-3 drop-shadow" />
          </motion.div>

          {/* 도시별 실제 랜드마크 3D 모델 (더 크고 굵은 외곽선으로 선명화) */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center filter drop-shadow-[0_0_2px_#fbbf24] drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
            <CityLandmarkIcon
              spaceId={spaceId}
              cityName={cityName}
              color={ownerColor}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. 일반 건물들 (별장 🏡, 빌딩 🏢, 호텔 🏨)
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`flex ${
        isVertical
          ? 'flex-col items-center justify-around py-0.5 gap-0.5'
          : 'flex-row items-end justify-center px-0.5 gap-0.5 sm:gap-1'
      } w-full h-full pointer-events-none z-10`}
    >
      {/* 슬롯 1: 별장 자리 */}
      <div className="flex-1 flex items-center justify-center min-w-0 min-h-0">
        {hasVilla ? (
          <motion.div
            initial={{ scale: 0, y: -15, rotate: -10 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 260 }}
            className="flex items-center justify-center"
            title="별장"
          >
            <VillaMiniature color={ownerColor} size="sm" />
          </motion.div>
        ) : (
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/60 flex items-center justify-center opacity-40" />
        )}
      </div>

      {/* 슬롯 2: 빌딩 자리 */}
      <div className="flex-1 flex items-center justify-center min-w-0 min-h-0">
        {hasBuilding ? (
          <motion.div
            initial={{ scale: 0, y: -15 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 260, delay: 0.04 }}
            className="flex items-center justify-center"
            title="빌딩"
          >
            <BuildingMiniature color={ownerColor} size="sm" />
          </motion.div>
        ) : (
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/60 flex items-center justify-center opacity-40" />
        )}
      </div>

      {/* 슬롯 3: 호텔 자리 */}
      <div className="flex-1 flex items-center justify-center min-w-0 min-h-0">
        {hasHotel ? (
          <motion.div
            initial={{ scale: 0, y: -15, rotate: 10 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 260, delay: 0.08 }}
            className="flex items-center justify-center"
            title="호텔"
          >
            <HotelMiniature color={ownerColor} size="sm" />
          </motion.div>
        ) : (
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/60 flex items-center justify-center opacity-40" />
        )}
      </div>
    </div>
  );
};
