import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles } from 'lucide-react';

interface BuildingModelProps {
  buildings: {
    hasVilla: boolean;
    hasBuilding: boolean;
    hasHotel: boolean;
    isLandmark: boolean;
  };
  ownerColor: string;
  isSpecialLand?: boolean;
}

export const BuildingModel: React.FC<BuildingModelProps> = ({
  buildings,
  ownerColor,
  isSpecialLand
}) => {
  const { hasVilla, hasBuilding, hasHotel, isLandmark } = buildings;

  if (!hasVilla && !hasBuilding && !hasHotel && !isLandmark) {
    return null;
  }

  // 1. 랜드마크 (LANDMARK): 거대한 황금 첨탑과 소유주 깃발이 펄럭이는 웅장한 기념비
  if (isLandmark) {
    return (
      <div className="relative flex flex-col items-center justify-end w-full h-full pb-0.5 pointer-events-none z-10">
        <motion.div
          initial={{ scale: 0, y: -25, rotateY: 90 }}
          animate={{ scale: 1, y: 0, rotateY: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 220 }}
          className="relative flex flex-col items-center"
        >
          {/* 소유주 깃발 & 왕관 */}
          <div className="absolute -top-4 flex items-center justify-center z-20">
            <motion.div
              animate={{ rotate: [-4, 4, -4], y: [0, -1, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex items-center gap-0.5 px-1 py-0.5 rounded-full shadow-md border border-amber-200"
              style={{ backgroundColor: ownerColor }}
            >
              <Crown className="w-2.5 h-2.5 text-yellow-200 fill-yellow-300" />
            </motion.div>
          </div>

          {/* 빛나는 스파클 */}
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="absolute -top-2 right-1 text-amber-300 pointer-events-none"
          >
            <Sparkles className="w-2.5 h-2.5" />
          </motion.div>

          {/* 랜드마크 첨탑 (3D Isometric Tower) */}
          <div className="relative flex flex-col items-center">
            {/* 상단 금빛 피라미드 지붕 */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[9px] border-b-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
            
            {/* 본체 타워 (황금빛 + 소유주 컬러 액센트) */}
            <div 
              className="w-4 h-5 sm:w-5 sm:h-6 rounded-[2px] border border-amber-300/90 shadow-[0_3px_6px_rgba(0,0,0,0.5)] flex flex-col items-center justify-between p-[1.5px] relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, #ffd700 0%, ${ownerColor} 60%, #b45309 100%)`,
                boxShadow: `0 2px 8px ${ownerColor}99, 0 0 10px #fbbf2488`
              }}
            >
              {/* 창문 그리드 */}
              <div className="w-full flex justify-around mt-0.5">
                <div className="w-1 h-1 bg-cyan-200 rounded-[0.5px] shadow-sm animate-pulse" />
                <div className="w-1 h-1 bg-cyan-200 rounded-[0.5px] shadow-sm animate-pulse" />
              </div>
              <div className="w-2.5 h-1.5 bg-amber-100/90 rounded-[1px] border border-amber-400/80 flex items-center justify-center">
                <div className="w-1 h-0.5 bg-amber-800 rounded-[0.5px]" />
              </div>
            </div>

            {/* 석조 기단 (Base Pedestal) */}
            <div className="w-6 h-1 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-800 rounded-sm shadow-md border-t border-amber-300/80" />
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. 일반 건물들 (별장 🏡, 빌딩 🏢, 호텔 🏨)
  // 실제 브루마블 보드처럼 타일 부지 위에 각각의 미니어처 플라스틱 장난감 말처럼 나란히 세워집니다!
  return (
    <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full h-full pb-0.5 pointer-events-none z-10">
      {/* 1) 별장 (VILLA) - 아늑한 빨간 삼각 지붕 펜션 & 굴뚝 미니어처 */}
      {hasVilla && (
        <motion.div
          initial={{ scale: 0, y: -20, rotate: -15 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', damping: 11, stiffness: 240 }}
          className="relative flex flex-col items-center"
          title="별장"
        >
          {/* 지붕 + 굴뚝 */}
          <div className="relative flex items-center justify-center">
            {/* 굴뚝 */}
            <div className="absolute -top-1 -right-0.5 w-0.5 h-1 bg-amber-800 rounded-t-[0.5px]" />
            {/* 빨간 삼각 박공지붕 */}
            <div 
              className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              style={{ borderBottomColor: '#dc2626' }}
            />
          </div>
          {/* 하얀 벽체 & 문/창문 */}
          <div 
            className="w-3 h-2.5 bg-amber-50 border border-slate-700/60 rounded-[1px] shadow-[0_2px_3px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between p-[1px] relative"
            style={{ borderBottom: `1.5px solid ${ownerColor}` }}
          >
            <div className="w-1.5 h-1 bg-cyan-500 rounded-[0.5px] shadow-inner" />
            <div className="w-1 h-1 bg-amber-900 rounded-t-[0.5px]" />
          </div>
        </motion.div>
      )}

      {/* 2) 빌딩 (BUILDING) - 파란색 다층 오피스 빌딩 미니어처 */}
      {hasBuilding && (
        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 11, stiffness: 240, delay: 0.05 }}
          className="relative flex flex-col items-center"
          title="빌딩"
        >
          {/* 옥상 안테나 */}
          <div className="w-0.5 h-1 bg-slate-400 rounded-t-full -mb-[0.5px]" />
          {/* 빌딩 본체 */}
          <div 
            className="w-3.5 h-4 sm:h-4.5 rounded-t-[1.5px] border border-blue-900 shadow-[0_2px_4px_rgba(0,0,0,0.45)] flex flex-col justify-around items-center p-[1px] relative overflow-hidden"
            style={{
              background: `linear-gradient(to bottom, #2563eb, #1e3a8a)`,
              borderBottom: `2px solid ${ownerColor}`
            }}
          >
            {/* 푸른 유리창 레이어 */}
            <div className="w-2.5 h-0.5 bg-cyan-200 rounded-[0.5px] shadow-sm" />
            <div className="w-2.5 h-0.5 bg-cyan-200 rounded-[0.5px] shadow-sm" />
            <div className="w-2.5 h-0.5 bg-cyan-200 rounded-[0.5px] shadow-sm" />
          </div>
        </motion.div>
      )}

      {/* 3) 호텔 (HOTEL) - 웅장한 주황/금빛 대형 럭셔리 호텔 미니어처 */}
      {hasHotel && (
        <motion.div
          initial={{ scale: 0, y: -20, rotate: 15 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', damping: 11, stiffness: 240, delay: 0.1 }}
          className="relative flex flex-col items-center"
          title="호텔"
        >
          {/* 호텔 옥상 금빛 돔 */}
          <div className="w-2 h-1 bg-amber-400 rounded-t-full border-t border-yellow-200 shadow-sm" />
          {/* 호텔 본체 */}
          <div 
            className="w-4 h-5 sm:h-5.5 rounded-[1px] border border-amber-600 shadow-[0_3px_5px_rgba(0,0,0,0.5)] flex flex-col justify-between items-center p-[1px] relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #ea580c 0%, #b45309 50%, #78350f 100%)`,
              borderBottom: `2px solid ${ownerColor}`
            }}
          >
            {/* 호텔 간판 & 창문 */}
            <div className="w-3 h-0.5 bg-yellow-300 rounded-[0.5px] shadow-sm" />
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-yellow-100 rounded-[0.5px]" />
              <div className="w-1 h-1 bg-yellow-100 rounded-[0.5px]" />
            </div>
            <div className="w-2 h-1.5 bg-amber-200 rounded-t-[1px] border-t border-amber-400" />
          </div>
        </motion.div>
      )}
    </div>
  );
};
