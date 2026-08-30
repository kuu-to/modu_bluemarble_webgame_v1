import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SpaceData, CellState, Player } from '../types';
import { calculateToll } from '../data/boardData';
import { Building2, Home, Landmark, Hotel, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { CountryFlag, CITY_COUNTRY_CODES } from './CountryFlag';

interface PurchaseModalProps {
  space: SpaceData;
  cellState: CellState;
  player: Player;
  onConfirmPurchase: (buildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean }, totalCost: number) => void;
  onSkip: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  space,
  cellState,
  player,
  onConfirmPurchase,
  onSkip
}) => {
  const isUnowned = cellState.owner === null;
  const isSpecial = !!space.isSpecialLand;

  // Selected buildings to buy in this transaction
  const [buyLand, setBuyLand] = useState<boolean>(isUnowned);
  const [buyVilla, setBuyVilla] = useState<boolean>(!isSpecial && !cellState.buildings.hasVilla && !cellState.buildings.isLandmark);
  const [buyBuilding, setBuyBuilding] = useState<boolean>(!isSpecial && !cellState.buildings.hasBuilding && !cellState.buildings.isLandmark);
  const [buyHotel, setBuyHotel] = useState<boolean>(!isSpecial && !cellState.buildings.hasHotel && !cellState.buildings.isLandmark);
  const [buyLandmark, setBuyLandmark] = useState<boolean>(isSpecial ? !cellState.buildings.isLandmark : false);

  // Compute total cost
  let totalCost = 0;
  if (isUnowned && buyLand) totalCost += space.price || 0;
  if (buyVilla && !cellState.buildings.hasVilla) totalCost += space.villaPrice || 0;
  if (buyBuilding && !cellState.buildings.hasBuilding) totalCost += space.buildingPrice || 0;
  if (buyHotel && !cellState.buildings.hasHotel) totalCost += space.hotelPrice || 0;
  if (buyLandmark && !cellState.buildings.isLandmark) totalCost += space.landmarkPrice || 0;

  const simulatedBuildings = {
    hasVilla: cellState.buildings.hasVilla || buyVilla,
    hasBuilding: cellState.buildings.hasBuilding || buyBuilding,
    hasHotel: cellState.buildings.hasHotel || buyHotel,
    isLandmark: cellState.buildings.isLandmark || buyLandmark
  };

  const estimatedToll = calculateToll(space, simulatedBuildings);
  const canAfford = player.money >= totalCost && totalCost > 0;

  const handlePurchase = () => {
    if (!canAfford) return;
    onConfirmPurchase(simulatedBuildings, totalCost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-[#0c1836] to-slate-950 rounded-2xl border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden text-slate-100"
      >
        {/* Header with City name and color bar */}
        <div
          className="p-4 flex items-center justify-between relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${space.colorHex || '#3b82f6'} 0%, #0f172a 100%)`
          }}
        >
          <div className="flex items-center gap-3">
            {CITY_COUNTRY_CODES[space.id] ? (
              <div className="p-1.5 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center shadow-md">
                <CountryFlag spaceId={space.id} size="lg" />
              </div>
            ) : (
              <span className="text-3xl">{space.icon}</span>
            )}
            <div>
              <div className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <span>{isUnowned ? '부동산 매입 & 건설' : '내 도시 건물 증축'}</span>
                {CITY_COUNTRY_CODES[space.id] && (
                  <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10.5px] font-bold text-white">
                    {CITY_COUNTRY_CODES[space.id].countryName}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black font-display text-white drop-shadow">
                {space.name}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-300 font-medium">보유 자금</span>
            <div className="text-lg font-black text-amber-400 font-num">
              {player.money}만 원
            </div>
          </div>
        </div>

        {/* Construction Options List */}
        <div className="p-4 space-y-2.5">
          {/* Base Land item */}
          {isUnowned && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-200">기본 토지</div>
                  <div className="text-xs text-slate-400 font-num">{space.price}만 원</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                기본 필수
              </span>
            </div>
          )}

          {isSpecial ? (
            // Special land only has Landmark upgrade option
            <div
              onClick={() => !cellState.buildings.isLandmark && setBuyLandmark(!buyLandmark)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                cellState.buildings.isLandmark
                  ? 'bg-amber-950/30 border-amber-500/40 opacity-70 cursor-not-allowed'
                  : buyLandmark
                  ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/30 text-amber-400 border border-amber-400/40">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-amber-200 flex items-center gap-1.5">
                    <span>관광지 랜드마크</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  </div>
                  <div className="text-xs text-slate-400 font-num">비용: {space.landmarkPrice}만 원</div>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                cellState.buildings.isLandmark ? 'bg-amber-500 border-amber-300' : buyLandmark ? 'bg-cyan-500 border-cyan-300 text-white' : 'border-slate-600'
              }`}>
                {(cellState.buildings.isLandmark || buyLandmark) && <Check className="w-4 h-4" />}
              </div>
            </div>
          ) : (
            // Normal City: Villa, Building, Hotel, Landmark
            <div className="grid grid-cols-3 gap-2">
              {/* Villa */}
              <div
                onClick={() => !cellState.buildings.hasVilla && setBuyVilla(!buyVilla)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  cellState.buildings.hasVilla
                    ? 'bg-emerald-950/40 border-emerald-500/40 opacity-75'
                    : buyVilla
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-1">🏡 별장</div>
                <div className="text-xs text-cyan-300 font-num font-bold">+{space.villaPrice}만</div>
                <div className="mt-1.5 flex justify-center">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                    cellState.buildings.hasVilla || buyVilla ? 'bg-cyan-500 border-cyan-300 text-white' : 'border-slate-600'
                  }`}>
                    {(cellState.buildings.hasVilla || buyVilla) && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>

              {/* Building */}
              <div
                onClick={() => !cellState.buildings.hasBuilding && setBuyBuilding(!buyBuilding)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  cellState.buildings.hasBuilding
                    ? 'bg-emerald-950/40 border-emerald-500/40 opacity-75'
                    : buyBuilding
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-1">🏢 빌딩</div>
                <div className="text-xs text-cyan-300 font-num font-bold">+{space.buildingPrice}만</div>
                <div className="mt-1.5 flex justify-center">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                    cellState.buildings.hasBuilding || buyBuilding ? 'bg-cyan-500 border-cyan-300 text-white' : 'border-slate-600'
                  }`}>
                    {(cellState.buildings.hasBuilding || buyBuilding) && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>

              {/* Hotel */}
              <div
                onClick={() => !cellState.buildings.hasHotel && setBuyHotel(!buyHotel)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  cellState.buildings.hasHotel
                    ? 'bg-emerald-950/40 border-emerald-500/40 opacity-75'
                    : buyHotel
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-1">🏨 호텔</div>
                <div className="text-xs text-cyan-300 font-num font-bold">+{space.hotelPrice}만</div>
                <div className="mt-1.5 flex justify-center">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                    cellState.buildings.hasHotel || buyHotel ? 'bg-cyan-500 border-cyan-300 text-white' : 'border-slate-600'
                  }`}>
                    {(cellState.buildings.hasHotel || buyHotel) && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Landmark Option for normal cities if all 3 built or being built */}
          {!isSpecial && (
            <div
              onClick={() => {
                const canLandmark = (cellState.buildings.hasVilla || buyVilla) &&
                                    (cellState.buildings.hasBuilding || buyBuilding) &&
                                    (cellState.buildings.hasHotel || buyHotel);
                if (canLandmark && !cellState.buildings.isLandmark) {
                  setBuyLandmark(!buyLandmark);
                }
              }}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                cellState.buildings.isLandmark
                  ? 'bg-amber-950/40 border-amber-500/40 opacity-80'
                  : buyLandmark
                  ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : (cellState.buildings.hasVilla || buyVilla) && (cellState.buildings.hasBuilding || buyBuilding) && (cellState.buildings.hasHotel || buyHotel)
                  ? 'bg-slate-800/70 border-amber-500/40 cursor-pointer hover:border-amber-400'
                  : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/30 text-amber-400 border border-amber-400/40">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                    <span>👑 랜드마크 건설 (인수 불가)</span>
                  </div>
                  <div className="text-xs text-slate-400 font-num">
                    비용: {space.landmarkPrice}만 원 (별장+빌딩+호텔 필수)
                  </div>
                </div>
              </div>

              <div className={`w-5 h-5 rounded flex items-center justify-center border text-[10px] ${
                cellState.buildings.isLandmark || buyLandmark ? 'bg-amber-500 border-amber-300 text-slate-950 font-bold' : 'border-slate-600'
              }`}>
                {(cellState.buildings.isLandmark || buyLandmark) && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          )}

          {/* Toll Preview & Total Cost Info Box */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">예상 통행료</span>
              <div className="text-lg font-black text-rose-400 font-num">
                {estimatedToll}만 원
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">총 결제 금액</span>
              <div className="text-2xl font-black text-amber-400 font-num">
                {totalCost}만 원
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex gap-3">
          <button
            id="purchase-skip-button"
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors border border-slate-700"
          >
            취소 / 건너뛰기
          </button>

          <button
            id="purchase-confirm-button"
            onClick={handlePurchase}
            disabled={!canAfford}
            className={`flex-2 py-3 rounded-xl font-display font-bold text-base flex items-center justify-center gap-2 transition-all ${
              canAfford
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300 glow-gold cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>{totalCost > 0 ? `${totalCost}만 원 결제` : '선택 필요'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
