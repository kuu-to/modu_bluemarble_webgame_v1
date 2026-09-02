import React from 'react';
import { SpaceData, CellState, Player } from '../types';
import { BuildingModel } from './BuildingModel';
import { AirplanePiece } from './AirplanePiece';
import { Crown, Navigation } from 'lucide-react';
import { CountryFlag, CITY_COUNTRY_CODES } from './CountryFlag';

const getCityNameClasses = (name: string) => {
  if (name === '퀸엘리자베스호' || name.length >= 7) {
    return 'text-[6px] sm:text-[7px] font-black text-slate-900 tracking-tighter leading-none whitespace-nowrap font-display';
  }
  if (name.length >= 5) {
    return 'text-[9px] sm:text-[10.5px] font-black text-slate-900 tracking-tight leading-none whitespace-nowrap font-display';
  }
  return 'text-[11px] sm:text-[12.5px] font-black text-slate-900 tracking-tight leading-none whitespace-nowrap font-display';
};

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

  // Edge classifications for directional layout optimization
  const isSouth = i > 0 && i < 10;
  const isWest = i > 10 && i < 20;
  const isNorth = i > 20 && i < 30;
  const isEast = i > 30 && i < 40;

  // Check players currently on this tile
  const playersOnThisCell = players.filter(p => p.pos === space.id);

  // Check if any building is constructed
  const { hasVilla, hasBuilding, hasHotel, isLandmark } = cellState.buildings;
  const hasAnyBuilding = hasVilla || hasBuilding || hasHotel || isLandmark;

  // Tile Outline & Highlighting Styles
  let borderStyle = 'border-slate-300';
  let bgStyle = 'bg-[#fcfdfd] text-slate-900';
  let customStyle: React.CSSProperties = {};

  if (owner) {
    customStyle = {
      borderColor: isLandmark ? (owner.glowColor || '#ffd700') : owner.color,
      boxShadow: isLandmark
        ? `0 0 8px ${owner.glowColor || '#fbbf24'}88, inset 0 0 6px ${owner.color}25`
        : `inset 0 0 4px ${owner.color}20, 0 1px 2px rgba(0,0,0,0.12)`,
    };
  }

  if (highlighted) {
    borderStyle = 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.9)] z-20';
  }

  if (isDestinationSelectable) {
    borderStyle = 'border-emerald-500 ring-2 ring-emerald-400 animate-pulse cursor-pointer hover:scale-105 z-30';
    bgStyle = 'bg-emerald-50 text-emerald-950';
  }

  // Plot background color (초록색 기본 -> 매입/구매 시 소유주 플레이어 색상으로 전환)
  const defaultPlotColor = '#15803d'; // Classic Blue Marble Tabletop Lawn Green
  const plotBgColor = isLandmark
    ? `linear-gradient(135deg, ${owner?.color || '#3b82f6'}, #1e1b4b)`
    : owner
    ? owner.color
    : defaultPlotColor;
  const plotBorderColor = isLandmark
    ? '#fcd34d'
    : owner
    ? (owner.glowColor || '#ffffff')
    : '#166534';

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
      {/* 🌟 1. 4개 코너 구역 (출발점, 무인도, 우주여행, 사회복지기금) - 정사각형 규격 🌟 */}
      {isCorner ? (
        <div className="w-full h-full flex flex-col items-center justify-between text-center p-1 sm:p-1.5 relative overflow-hidden bg-gradient-to-br from-[#fbfdf9] via-[#ffffff] to-[#eef5e6]">
          {/* 출발점 (START) */}
          {space.type === 'start' && (
            <div className="w-full h-full flex flex-col items-center justify-between py-1">
              <div className="flex flex-col items-center">
                <span className="font-black text-xs sm:text-sm text-emerald-900 tracking-tight leading-none font-display">
                  출발점
                </span>
                <span className="text-[8.5px] sm:text-[10px] font-black text-rose-600 tracking-wider">
                  LET'S GO
                </span>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md animate-bounce my-auto border-2 border-rose-300">
                <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-45" />
              </div>
              <span className="text-[8px] sm:text-[9.5px] font-black text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded border border-amber-400 shadow-xs">
                월급 +20만
              </span>
            </div>
          )}

          {/* 무인도 (ISLAND) */}
          {space.type === 'island' && (
            <div className="w-full h-full flex flex-col items-center justify-between py-1 bg-sky-50/80">
              <span className="font-black text-xs sm:text-sm text-sky-950 tracking-tight font-display">
                무인도
              </span>
              <div className="text-2xl sm:text-3xl drop-shadow my-auto">🏝️</div>
              <span className="text-[8px] sm:text-[9px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200">
                3턴 조난
              </span>
            </div>
          )}

          {/* 우주여행 (SPACE TRAVEL) */}
          {space.type === 'space' && (
            <div className="w-full h-full flex flex-col items-center justify-between py-1 bg-indigo-50/80">
              <span className="font-black text-[11px] sm:text-xs text-indigo-950 tracking-tight font-display">
                우주여행
              </span>
              <div className="text-2xl sm:text-3xl drop-shadow my-auto">🛸</div>
              <span className="text-[8px] sm:text-[9px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                원하는곳 이동
              </span>
            </div>
          )}

          {/* 사회복지기금 (SOCIAL FUND) */}
          {space.type === 'fund' && (
            <div className="w-full h-full flex flex-col items-center justify-between py-1 bg-amber-50/80">
              <span className="font-black text-[10.5px] sm:text-xs text-amber-950 leading-tight font-display">
                사회복지기금
              </span>
              <div className="text-2xl sm:text-3xl drop-shadow my-auto">🏦</div>
              <span className="text-[8px] sm:text-[9px] font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300">
                기금 수령처
              </span>
            </div>
          )}
        </div>
      ) : space.type === 'golden_key' ? (
        // 🌟 2. 황금열쇠 (GOLDEN KEY) 타일 - 방향별 최적화 🌟
        isWest ? (
          <div className="w-full h-full flex flex-row items-center justify-between text-center bg-gradient-to-r from-[#fef08a] via-[#fde047] to-[#eab308] p-1 border border-amber-300 shadow-inner overflow-hidden">
            <span className="text-[7px] sm:text-[8px] font-extrabold text-amber-900 tracking-wider bg-amber-300/90 px-0.5 py-0.5 rounded transform rotate-90 whitespace-nowrap">
              CARD
            </span>
            <div className="flex items-center justify-center">
              <span className="text-[9px] sm:text-[10px] font-black text-amber-950 font-display leading-tight transform rotate-90 whitespace-nowrap">
                황금열쇠
              </span>
            </div>
            <div className="w-5 h-5 rounded-full bg-amber-500/80 text-amber-950 flex items-center justify-center shadow-xs border border-amber-600/60 transform rotate-90 shrink-0">
              <span className="text-xs">🔑</span>
            </div>
          </div>
        ) : isEast ? (
          <div className="w-full h-full flex flex-row items-center justify-between text-center bg-gradient-to-r from-[#eab308] via-[#fde047] to-[#fef08a] p-1 border border-amber-300 shadow-inner overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-amber-500/80 text-amber-950 flex items-center justify-center shadow-xs border border-amber-600/60 transform -rotate-90 shrink-0">
              <span className="text-xs">🔑</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-[9px] sm:text-[10px] font-black text-amber-950 font-display leading-tight transform -rotate-90 whitespace-nowrap">
                황금열쇠
              </span>
            </div>
            <span className="text-[7px] sm:text-[8px] font-extrabold text-amber-900 tracking-wider bg-amber-300/90 px-0.5 py-0.5 rounded transform -rotate-90 whitespace-nowrap">
              CARD
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#fef08a] via-[#fde047] to-[#eab308] p-1 border border-amber-300 shadow-inner">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500/80 text-amber-950 flex items-center justify-center shadow-xs border border-amber-600/60 mt-0.5">
              <span className="text-xs sm:text-sm">🔑</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9.5px] sm:text-[11px] font-black text-amber-950 font-display leading-tight">
                황금열쇠
              </span>
              <span className="text-[7px] sm:text-[8px] font-extrabold text-amber-900/90 tracking-widest bg-amber-300/80 px-1 rounded">
                CARD
              </span>
            </div>
            <div className="w-full h-1 bg-amber-600/30 rounded-full" />
          </div>
        )
      ) : space.type === 'tax' ? (
        // 🌟 3. 국세청 (TAX) 타일 - 방향별 최적화 🌟
        isEast ? (
          <div className="w-full h-full flex flex-row items-center justify-between text-center bg-gradient-to-r from-rose-100 via-rose-50 to-rose-100 p-1 border border-rose-300 overflow-hidden">
            <span className="text-base sm:text-lg transform -rotate-90 shrink-0">💰</span>
            <span className="text-[9.5px] sm:text-[11px] font-black text-rose-950 font-display transform -rotate-90 whitespace-nowrap">
              국세청
            </span>
            <span className="text-[7px] sm:text-[8px] text-rose-900 font-bold bg-rose-200/90 px-0.5 py-0.5 rounded border border-rose-300 transform -rotate-90 whitespace-nowrap">
              세금 10%
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-rose-100 via-rose-50 to-rose-100 p-1 border border-rose-300">
            <span className="text-lg sm:text-xl">💰</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] sm:text-xs font-black text-rose-950 font-display">
                국세청
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] text-rose-900 font-bold bg-rose-200/90 px-1 rounded border border-rose-300 mt-0.5">
                세금 10%
              </span>
            </div>
            <div className="w-full h-1 bg-rose-500/30 rounded-full" />
          </div>
        )
      ) : isWest ? (
        // 🌟 4-A. 서쪽 (WEST) 타일: [좌측: 가격/통행료] | [중앙: 국기+도시명 (시계방향 90도)] | [우측: 컴팩트 건물 부지] 🌟
        <div className="w-full h-full flex flex-row justify-between items-stretch relative overflow-hidden bg-white">
          {/* 1. 좌측 (외곽): 가격 / 통행료 네이비 세로 뱃지 (시계방향 90도 회전) */}
          <div className="w-[20%] min-w-[16px] sm:min-w-[18px] flex items-center justify-center p-0.5 border-r border-slate-200">
            {owner ? (
              <div
                className="w-full h-full rounded-[2px] flex items-center justify-center font-black text-[7.5px] sm:text-[9px] tracking-tight border shadow-xs"
                style={{
                  backgroundColor: owner.color,
                  borderColor: owner.glowColor || '#ffffff',
                  color: owner.airplaneColor === 'white' ? '#0f172a' : '#ffffff'
                }}
              >
                <span className="whitespace-nowrap transform rotate-90 font-num">
                  료 {cellState.currentToll}만
                </span>
              </div>
            ) : (
              <div className="w-full h-full rounded-[2px] flex items-center justify-center font-bold text-[7.5px] sm:text-[9px] tracking-tight bg-[#0f2942] text-amber-300 border border-slate-800 shadow-xs font-num">
                <span className="whitespace-nowrap transform rotate-90">
                  {space.price}만원
                </span>
              </div>
            )}
          </div>

          {/* 2. 중앙: 국기 + 도시 이름 (전체 컨테이너를 시계방향 90도 회전하여 북/남과 완벽히 동일한 자간 및 국기 정렬) */}
          <div className="flex-1 flex items-center justify-center p-0.5 text-center min-w-0 bg-white overflow-visible">
            <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 transform rotate-90 shrink-0 select-none">
              <span className={getCityNameClasses(space.name)}>
                {space.name}
              </span>
              <div className="flex items-center justify-center shrink-0">
                {CITY_COUNTRY_CODES[space.id] ? (
                  <CountryFlag spaceId={space.id} size="sm" />
                ) : (
                  <span className="text-[11px] sm:text-[13px] leading-none">{space.icon || '📍'}</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. 우측 (보드 안쪽): 컴팩트 건물 부지 영역 (세로 3슬롯) */}
          <div
            className="w-[24%] min-w-[18px] sm:min-w-[22px] h-full flex flex-col items-center justify-around p-0.5 relative transition-colors duration-300 shadow-xs border-l"
            style={{
              backgroundColor: plotBgColor,
              borderColor: plotBorderColor
            }}
          >
            {/* 소유주 체크 엠블럼 또는 랜드마크 왕관 */}
            {owner && (
              <div className="absolute top-0.5 left-0.5 z-20 flex items-center gap-0.5">
                <div
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-xs flex items-center justify-center text-[7px] font-black text-white"
                  style={{ backgroundColor: owner.color }}
                >
                  ✓
                </div>
              </div>
            )}

            {isLandmark && (
              <div className="absolute top-0.5 right-0.5 z-20">
                <Crown className="w-2.5 h-2.5 text-yellow-200 fill-yellow-300 drop-shadow" />
              </div>
            )}

            {/* 건물 모델 (별장, 빌딩, 호텔 수직 3슬롯 또는 랜드마크) */}
            {owner && hasAnyBuilding ? (
              <BuildingModel
                buildings={cellState.buildings}
                ownerColor={owner.color}
                spaceId={space.id}
                cityName={space.name}
                isSpecialLand={space.isSpecialLand}
                orientation="vertical"
              />
            ) : (
              <div className="flex flex-col items-center justify-around gap-0.5 w-full h-full opacity-50 py-0.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/80" title="별장 자리" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/80" title="빌딩 자리" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/80" title="호텔 자리" />
              </div>
            )}
          </div>
        </div>
      ) : isEast ? (
        // 🌟 4-B. 동쪽 (EAST) 타일: [좌측: 컴팩트 건물 부지] | [중앙: 도시명+국기 (반시계방향 90도)] | [우측: 가격/통행료] 🌟
        <div className="w-full h-full flex flex-row justify-between items-stretch relative overflow-hidden bg-white">
          {/* 1. 좌측 (보드 안쪽): 컴팩트 건물 부지 영역 (세로 3슬롯) */}
          <div
            className="w-[24%] min-w-[18px] sm:min-w-[22px] h-full flex flex-col items-center justify-around p-0.5 relative transition-colors duration-300 shadow-xs border-r"
            style={{
              backgroundColor: plotBgColor,
              borderColor: plotBorderColor
            }}
          >
            {/* 소유주 체크 엠블럼 또는 랜드마크 왕관 */}
            {owner && (
              <div className="absolute top-0.5 left-0.5 z-20 flex items-center gap-0.5">
                <div
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-xs flex items-center justify-center text-[7px] font-black text-white"
                  style={{ backgroundColor: owner.color }}
                >
                  ✓
                </div>
              </div>
            )}

            {isLandmark && (
              <div className="absolute top-0.5 right-0.5 z-20">
                <Crown className="w-2.5 h-2.5 text-yellow-200 fill-yellow-300 drop-shadow" />
              </div>
            )}

            {/* 건물 모델 (별장, 빌딩, 호텔 수직 3슬롯 또는 랜드마크) */}
            {owner && hasAnyBuilding ? (
              <BuildingModel
                buildings={cellState.buildings}
                ownerColor={owner.color}
                spaceId={space.id}
                cityName={space.name}
                isSpecialLand={space.isSpecialLand}
                orientation="vertical"
              />
            ) : (
              <div className="flex flex-col items-center justify-around gap-0.5 w-full h-full opacity-50 py-0.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/80" title="별장 자리" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/80" title="빌딩 자리" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border border-dashed border-white/80" title="호텔 자리" />
              </div>
            )}
          </div>

          {/* 2. 중앙: 도시 이름 + 국기 (전체 컨테이너를 반시계방향 90도 회전하여 북/남과 완벽히 동일한 자간 및 국기 정렬) */}
          <div className="flex-1 flex items-center justify-center p-0.5 text-center min-w-0 bg-white overflow-visible">
            <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 transform -rotate-90 shrink-0 select-none">
              <span className={getCityNameClasses(space.name)}>
                {space.name}
              </span>
              <div className="flex items-center justify-center shrink-0">
                {CITY_COUNTRY_CODES[space.id] ? (
                  <CountryFlag spaceId={space.id} size="sm" />
                ) : (
                  <span className="text-[11px] sm:text-[13px] leading-none">{space.icon || '📍'}</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. 우측 (외곽): 가격 / 통행료 네이비 세로 뱃지 (반시계방향 90도 회전) */}
          <div className="w-[20%] min-w-[16px] sm:min-w-[18px] flex items-center justify-center p-0.5 border-l border-slate-200">
            {owner ? (
              <div
                className="w-full h-full rounded-[2px] flex items-center justify-center font-black text-[7.5px] sm:text-[9px] tracking-tight border shadow-xs"
                style={{
                  backgroundColor: owner.color,
                  borderColor: owner.glowColor || '#ffffff',
                  color: owner.airplaneColor === 'white' ? '#0f172a' : '#ffffff'
                }}
              >
                <span className="whitespace-nowrap transform -rotate-90 font-num">
                  료 {cellState.currentToll}만
                </span>
              </div>
            ) : (
              <div className="w-full h-full rounded-[2px] flex items-center justify-center font-bold text-[7.5px] sm:text-[9px] tracking-tight bg-[#0f2942] text-amber-300 border border-slate-800 shadow-xs font-num">
                <span className="whitespace-nowrap transform -rotate-90">
                  {space.price}만원
                </span>
              </div>
            )}
          </div>
        </div>
      ) : isNorth ? (
        // 🌟 4-C. 북쪽 (NORTH) 타일: [상단: 도시명 + 국기] | [중단: 가격/통행료] | [하단: 컴팩트 건물부지(가로3슬롯)] 🌟
        <div className="w-full h-full flex flex-col justify-between items-center relative overflow-hidden bg-white">
          {/* 1. 상단 (외곽): 도시 이름 & 국기 (여유로운 공간 확보로 겹침 방지 및 롱네임 대응) */}
          <div className="w-full flex-1 flex flex-col items-center justify-center px-0.5 pt-0.5 pb-0.5 text-center min-h-0 bg-white gap-1.5 sm:gap-2 overflow-hidden">
            <span className={getCityNameClasses(space.name)}>
              {space.name}
            </span>
            <div className="flex items-center justify-center shrink-0">
              {CITY_COUNTRY_CODES[space.id] ? (
                <CountryFlag spaceId={space.id} size="sm" />
              ) : (
                <span className="text-[11px] sm:text-[13px] leading-none">{space.icon || '📍'}</span>
              )}
            </div>
          </div>

          {/* 2. 중단: 가격 / 통행료 뱃지 (남색/소유주색) */}
          <div className="w-full px-0.5 py-0.5 border-y border-slate-200">
            {owner ? (
              <div
                className="w-full rounded-[2px] py-0.5 text-center font-black text-[8px] sm:text-[9.5px] tracking-tight border shadow-xs"
                style={{
                  backgroundColor: owner.color,
                  borderColor: owner.glowColor || '#ffffff',
                  color: owner.airplaneColor === 'white' ? '#0f172a' : '#ffffff'
                }}
              >
                료 {cellState.currentToll}만
              </div>
            ) : (
              <div className="w-full rounded-[2px] py-0.5 text-center font-bold text-[8px] sm:text-[9.5px] tracking-tight bg-[#0f2942] text-amber-300 border border-slate-800 shadow-xs font-num">
                {space.price}만원
              </div>
            )}
          </div>

          {/* 3. 하단 (보드 안쪽): 컴팩트 건물 부지 영역 (가로 3슬롯) */}
          <div
            className="w-full h-[28%] min-h-[16px] sm:min-h-[20px] flex items-center justify-center p-0.5 relative transition-colors duration-300 shadow-xs border-t"
            style={{
              backgroundColor: plotBgColor,
              borderColor: plotBorderColor
            }}
          >
            {/* 소유주 체크 엠블럼 또는 랜드마크 왕관 */}
            {owner && (
              <div className="absolute top-0.5 left-0.5 z-20 flex items-center gap-0.5">
                <div
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-xs flex items-center justify-center text-[7px] font-black text-white"
                  style={{ backgroundColor: owner.color }}
                >
                  ✓
                </div>
              </div>
            )}

            {isLandmark && (
              <div className="absolute top-0.5 right-0.5 z-20">
                <Crown className="w-2.5 h-2.5 text-yellow-200 fill-yellow-300 drop-shadow" />
              </div>
            )}

            {/* 건물 모델 */}
            {owner && hasAnyBuilding ? (
              <BuildingModel
                buildings={cellState.buildings}
                ownerColor={owner.color}
                spaceId={space.id}
                cityName={space.name}
                isSpecialLand={space.isSpecialLand}
                orientation="horizontal"
              />
            ) : (
              <div className="flex items-center justify-center gap-1 w-full h-full opacity-50 px-1">
                <div className="w-3 h-3 rounded-[1px] border border-dashed border-white/80" title="별장 자리" />
                <div className="w-3 h-3 rounded-[1px] border border-dashed border-white/80" title="빌딩 자리" />
                <div className="w-3 h-3 rounded-[1px] border border-dashed border-white/80" title="호텔 자리" />
              </div>
            )}
          </div>
        </div>
      ) : (
        // 🌟 4-D. 남쪽 (SOUTH) 타일: [상단: 컴팩트 건물부지(가로3슬롯)] | [중단: 도시명+국기] | [하단: 가격/통행료] 🌟
        <div className="w-full h-full flex flex-col justify-between items-center relative overflow-hidden bg-white">
          {/* 1. 상단 (보드 안쪽): 컴팩트 건물 부지 영역 (가로 3슬롯) */}
          <div
            className="w-full h-[28%] min-h-[16px] sm:min-h-[20px] flex items-center justify-center p-0.5 relative transition-colors duration-300 shadow-xs border-b"
            style={{
              backgroundColor: plotBgColor,
              borderColor: plotBorderColor
            }}
          >
            {/* 소유주 체크 엠블럼 또는 랜드마크 왕관 */}
            {owner && (
              <div className="absolute top-0.5 left-0.5 z-20 flex items-center gap-0.5">
                <div
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-xs flex items-center justify-center text-[7px] font-black text-white"
                  style={{ backgroundColor: owner.color }}
                >
                  ✓
                </div>
              </div>
            )}

            {isLandmark && (
              <div className="absolute top-0.5 right-0.5 z-20">
                <Crown className="w-2.5 h-2.5 text-yellow-200 fill-yellow-300 drop-shadow" />
              </div>
            )}

            {/* 건물 모델 */}
            {owner && hasAnyBuilding ? (
              <BuildingModel
                buildings={cellState.buildings}
                ownerColor={owner.color}
                spaceId={space.id}
                cityName={space.name}
                isSpecialLand={space.isSpecialLand}
                orientation="horizontal"
              />
            ) : (
              <div className="flex items-center justify-center gap-1 w-full h-full opacity-50 px-1">
                <div className="w-3 h-3 rounded-[1px] border border-dashed border-white/80" title="별장 자리" />
                <div className="w-3 h-3 rounded-[1px] border border-dashed border-white/80" title="빌딩 자리" />
                <div className="w-3 h-3 rounded-[1px] border border-dashed border-white/80" title="호텔 자리" />
              </div>
            )}
          </div>

          {/* 2. 중단: 도시 이름 & 국기 */}
          <div className="w-full flex-1 flex flex-col items-center justify-center px-0.5 pt-0.5 pb-0.5 text-center min-h-0 bg-white gap-1.5 sm:gap-2 overflow-hidden">
            <span className={getCityNameClasses(space.name)}>
              {space.name}
            </span>
            <div className="flex items-center justify-center shrink-0">
              {CITY_COUNTRY_CODES[space.id] ? (
                <CountryFlag spaceId={space.id} size="sm" />
              ) : (
                <span className="text-[11px] sm:text-[13px] leading-none">{space.icon || '📍'}</span>
              )}
            </div>
          </div>

          {/* 3. 하단 (외곽): 가격 / 통행료 뱃지 */}
          <div className="w-full px-0.5 pb-0.5">
            {owner ? (
              <div
                className="w-full rounded-[2px] py-0.5 text-center font-black text-[8px] sm:text-[9.5px] tracking-tight border shadow-xs"
                style={{
                  backgroundColor: owner.color,
                  borderColor: owner.glowColor || '#ffffff',
                  color: owner.airplaneColor === 'white' ? '#0f172a' : '#ffffff'
                }}
              >
                료 {cellState.currentToll}만
              </div>
            ) : (
              <div className="w-full rounded-[2px] py-0.5 text-center font-bold text-[8px] sm:text-[9.5px] tracking-tight bg-[#0f2942] text-amber-300 border border-slate-800 shadow-xs font-num">
                {space.price}만원
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✈️ 플레이어 비행기 말 (클래식 부루마블 입체 비행기 토큰) ✈️ */}
      {playersOnThisCell.length > 0 && (
        <div className="absolute inset-0 flex flex-wrap items-center justify-center content-center gap-0.5 pointer-events-none z-30 p-0.5 bg-black/10 backdrop-blur-[0.5px]">
          {playersOnThisCell.map((p) => {
            const isActive = p.id === activePlayerId;
            return (
              <div
                key={p.id}
                className={`relative flex items-center justify-center transition-transform duration-300 ${
                  isActive ? 'animate-bounce scale-110 sm:scale-120 z-40' : 'scale-90 sm:scale-95'
                }`}
              >
                {isActive && (
                  <div
                    className="absolute -inset-1.5 rounded-full animate-ping opacity-60 pointer-events-none"
                    style={{ backgroundColor: p.color }}
                  />
                )}
                <div
                  className="p-0.5 rounded-full flex items-center justify-center filter drop-shadow-md"
                  style={{
                    backgroundColor: `${p.color}33`,
                    border: `1.5px solid ${p.color}`
                  }}
                >
                  <AirplanePiece
                    colorId={p.airplaneColor || 'red'}
                    size="sm"
                    shadow={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 도착 타일 표시 뱃지 (Highlight Marker) */}
      {highlighted && (
        <div className="absolute top-0 inset-x-0 bg-amber-400 text-slate-950 text-[7px] sm:text-[8px] font-black text-center py-0.2 tracking-tighter shadow-md z-40 animate-pulse border-b border-amber-600">
          📍 도착
        </div>
      )}
    </div>
  );
};
