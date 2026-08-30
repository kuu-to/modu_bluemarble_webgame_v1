import React from 'react';
import { SpaceData, CellState, Player } from '../types';
import { BuildingModel } from './BuildingModel';
import { Crown, Navigation } from 'lucide-react';
import { CountryFlag, CITY_COUNTRY_CODES } from './CountryFlag';

interface TileCellProps {
  space: SpaceData;
  cellState: CellState;
  players: Player[];
  activePlayerId: number;
  highlighted?: boolean;
  onClick?: () => void;
  isDestinationSelectable?: boolean;
}

export const TileCell: React.FC<TileCellProps> = ({
  space,
  cellState,
  players,
  activePlayerId,
  highlighted,
  onClick,
  isDestinationSelectable
}) => {
  const isCorner = space.type === 'start' || space.type === 'island' || space.type === 'space' || space.type === 'fund';
  const owner = cellState.owner !== null ? players[cellState.owner] : null;

  // 11x11 Grid Position calculation
  const i = space.id;
  let row = 1;
  let col = 1;

  if (i === 0) { row = 11; col = 11; }
  else if (i < 10) { row = 11; col = 11 - i; }
  else if (i === 10) { row = 11; col = 1; }
  else if (i < 20) { row = 11 - (i - 10); col = 1; }
  else if (i === 20) { row = 1; col = 1; }
  else if (i < 30) { row = 1; col = 1 + (i - 20); }
  else if (i === 30) { row = 1; col = 11; }
  else { row = 1 + (i - 30); col = 11; }

  // Check players on this tile
  const playersOnThisCell = players.filter(p => p.pos === space.id);

  // Check if any building is constructed
  const hasAnyBuilding = cellState.buildings.hasVilla || cellState.buildings.hasBuilding || cellState.buildings.hasHotel || cellState.buildings.isLandmark;

  // Tile Background & Border Styles
  let borderStyle = 'border-slate-300';
  let bgStyle = 'bg-[#ffffff] text-slate-900';
  let customStyle: React.CSSProperties = {};

  if (owner) {
    customStyle = {
      borderColor: cellState.buildings.isLandmark ? owner.glowColor : owner.color,
      boxShadow: cellState.buildings.isLandmark 
        ? `0 0 10px ${owner.glowColor}, inset 0 0 8px ${owner.color}33` 
        : `inset 0 0 6px ${owner.color}25, 0 1px 3px rgba(0,0,0,0.15)`,
      background: `linear-gradient(to bottom, ${owner.color}15, #ffffff)`
    };
  }

  if (highlighted) {
    borderStyle = 'border-amber-500 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.9)] z-20';
  }

  if (isDestinationSelectable) {
    borderStyle = 'border-emerald-500 ring-2 ring-emerald-400 animate-pulse cursor-pointer hover:scale-105 z-30';
    bgStyle = 'bg-emerald-50 text-emerald-950';
  }

  return (
    <div
      id={`cell-${space.id}`}
      onClick={onClick}
      style={{
        gridRow: row,
        gridColumn: col,
        ...customStyle
      }}
      className={`relative flex flex-col justify-between items-center border ${borderStyle} ${bgStyle} transition-all duration-200 select-none overflow-hidden ${
        isCorner ? 'aspect-square' : ''
      }`}
    >
      {/* 1. Corner Cells Special Presentation */}
      {isCorner ? (
        <div className="w-full h-full flex flex-col items-center justify-between text-center p-1 relative overflow-hidden bg-gradient-to-br from-[#fbfdf9] to-[#edf3e4]">
          {/* 출발점 (START) */}
          {space.type === 'start' && (
            <div className="w-full h-full flex flex-col items-center justify-between py-1">
              <div className="flex flex-col items-center">
                <span className="font-bold text-xs sm:text-sm text-emerald-800 tracking-tight leading-none">
                  출발점
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-rose-600">
                  LET'S GO
                </span>
              </div>
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-bounce my-auto">
                <Navigation className="w-3 h-3 sm:w-4 sm:h-4 rotate-45" />
              </div>
              <span className="text-[8.5px] sm:text-[10px] font-bold text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded border border-amber-400">
                +20만원
              </span>
            </div>
          )}

          {/* 무인도 (ISLAND) */}
          {space.type === 'island' && (
            <div className="w-full h-full flex flex-col items-center justify-between py-1 bg-sky-50/80">
              <span className="font-bold text-xs sm:text-sm text-sky-950 tracking-tight">
                무인도
              </span>
              <div className="text-xl sm:text-2xl drop-shadow my-auto">🏝️</div>
              <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-sky-800 bg-sky-100 px-1 py-0.5 rounded">
                3턴 조난
              </span>
            </div>
          )}

          {/* 우주여행 (SPACE TRAVEL) */}
          {space.type === 'space' && (
            <div className="w-full h-full flex flex-col items-center justify-between py-1 bg-indigo-50/80">
              <span className="font-bold text-[11px] sm:text-xs text-indigo-950 tracking-tight">
                우주여행
              </span>
              <div className="text-xl sm:text-2xl drop-shadow my-auto">🛸</div>
              <span className="text-[8px] sm:text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1 py-0.5 rounded">
                원하는곳 이동
              </span>
            </div>
          )}

          {/* 사회복지기금 (SOCIAL FUND) */}
          {space.type === 'fund' && (
            <div className="w-full h-full flex flex-col items-center justify-between py-1 bg-amber-50/80">
              <span className="font-bold text-[10px] sm:text-xs text-amber-950 leading-tight">
                사회복지기금
              </span>
              <div className="text-xl sm:text-2xl drop-shadow my-auto">🏦</div>
              <span className="text-[8px] sm:text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded">
                기금 수령처
              </span>
            </div>
          )}
        </div>
      ) : space.type === 'golden_key' ? (
        // 황금열쇠 (GOLDEN KEY) Cell
        <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-amber-100 via-amber-50 to-amber-100 p-1 border-amber-200">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm">
            <span className="text-xs sm:text-sm">🔑</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-amber-950">
            황금열쇠
          </span>
          <span className="text-[7.5px] sm:text-[8.5px] font-semibold text-amber-800 bg-amber-200/70 px-1 rounded">
            CARD
          </span>
        </div>
      ) : space.type === 'tax' ? (
        // 국세청 (TAX) Cell
        <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-rose-100 to-rose-50 p-1">
          <span className="text-base sm:text-lg">💰</span>
          <span className="text-[10px] sm:text-xs font-bold text-rose-950">
            국세청
          </span>
          <span className="text-[8px] sm:text-[9px] text-rose-800 font-bold bg-rose-200/80 px-1 rounded">
            세금 10%
          </span>
        </div>
      ) : (
        // 일반 도시 / 관광지 / 특수지 타일 (Standard City Space)
        <>
          {/* 상단 컬러 바 (헤더 스트립) */}
          <div
            className="w-full h-2.5 sm:h-3 flex items-center justify-between px-1 shadow-xs"
            style={{
              backgroundColor: space.colorHex || '#64748b'
            }}
          >
            {owner ? (
              <div
                className="w-2 h-2 rounded-full border border-white shadow-xs flex items-center justify-center text-[7px] font-black text-white"
                style={{ backgroundColor: owner.color }}
              >
                ✓
              </div>
            ) : <div />}

            {cellState.buildings.isLandmark && (
              <Crown className="w-2.5 h-2.5 text-yellow-200 fill-yellow-300 ml-auto drop-shadow-xs" />
            )}
          </div>

          {/* 도시 이름 및 국기 (가독성 높은 글씨체 & 국기 이미지) */}
          <div className="w-full text-center px-0.5 pt-0.5 flex flex-col items-center justify-center">
            <span className="font-bold text-[9px] sm:text-[10.5px] text-slate-900 tracking-tight leading-none block truncate max-w-full">
              {space.name}
            </span>
          </div>

          {/* 건물 부지 및 국기 (가운데 영역) */}
          <div className="relative w-full flex-1 flex items-center justify-center px-0.5 min-h-[16px] sm:min-h-[20px]">
            {/* 부지 배경 */}
            <div className={`w-full h-full max-h-[22px] rounded flex items-center justify-center ${
              hasAnyBuilding 
                ? 'bg-emerald-50/80' 
                : 'bg-slate-50/70 border border-dashed border-slate-200/80'
            }`}>
              {!hasAnyBuilding && (
                CITY_COUNTRY_CODES[space.id] ? (
                  <CountryFlag spaceId={space.id} size="sm" />
                ) : (
                  <span className="text-[9px] sm:text-[11px] opacity-70">
                    {space.icon || '📍'}
                  </span>
                )
              )}

              {/* 실제 세워진 3D 건물 모델 */}
              {owner && hasAnyBuilding && (
                <BuildingModel
                  buildings={cellState.buildings}
                  ownerColor={owner.color}
                  isSpecialLand={space.isSpecialLand}
                />
              )}
            </div>
          </div>

          {/* 🌟 하단 가격/통행료 (항상 100% 또렷하게 보이는 고대비 뱃지) 🌟 */}
          <div className="w-full px-1 pb-1 pt-0.5">
            {owner ? (
              <div 
                className="w-full rounded py-0.5 text-center font-bold text-[8.5px] sm:text-[10px] tracking-tight border shadow-xs"
                style={{
                  backgroundColor: owner.color,
                  borderColor: owner.glowColor,
                  color: '#ffffff'
                }}
              >
                료 {cellState.currentToll}만
              </div>
            ) : (
              <div className="w-full rounded py-0.5 text-center font-bold text-[8.5px] sm:text-[10px] tracking-tight bg-slate-900 text-amber-300 border border-slate-700 shadow-xs">
                {space.price}만원
              </div>
            )}
          </div>
        </>
      )}

      {/* 플레이어 말 (3D 입체 토큰) */}
      {playersOnThisCell.length > 0 && (
        <div className="absolute inset-0 flex flex-wrap items-center justify-center content-center gap-0.5 sm:gap-1 pointer-events-none z-30 p-0.5 bg-black/10 backdrop-blur-[0.5px]">
          {playersOnThisCell.map((p) => {
            const isActive = p.id === activePlayerId;
            return (
              <div
                key={p.id}
                className={`relative flex items-center justify-center transition-transform duration-300 ${
                  isActive ? 'animate-bounce scale-110 sm:scale-125 z-40' : 'scale-90 sm:scale-100'
                }`}
              >
                {isActive && (
                  <div
                    className="absolute -inset-1 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: p.color }}
                  />
                )}
                <div
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] sm:text-[11px] md:text-xs font-bold text-white shadow-lg"
                  style={{
                    backgroundColor: p.color,
                    boxShadow: `0 2px 8px ${p.color}, 0 0 10px rgba(0,0,0,0.3)`
                  }}
                >
                  {p.avatar}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
