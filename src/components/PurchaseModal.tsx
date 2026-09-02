import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SpaceData, CellState, Player } from '../types';
import { calculateToll } from '../data/boardData';
import { Home, Landmark, Check, X, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { CountryFlag, CITY_COUNTRY_CODES } from './CountryFlag';
import { VillaMiniature, BuildingMiniature, HotelMiniature } from './BuildingModel';
import { CityLandmarkIcon } from './CityLandmarks';

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

  const basePrice = space.price || (isSpecial ? 20 : 10);
  const villaCost = space.villaPrice || Math.round(basePrice * 0.5);
  const buildingCost = space.buildingPrice || basePrice;
  const hotelCost = space.hotelPrice || Math.round(basePrice * 1.5);
  const landmarkCost = space.landmarkPrice || Math.round(basePrice * 2.5);

  // Existing states
  const hasVilla = cellState.buildings.hasVilla;
  const hasBuilding = cellState.buildings.hasBuilding;
  const hasHotel = cellState.buildings.hasHotel;
  const hasLandmark = cellState.buildings.isLandmark;

  // STRICT HIERARCHY RULES:
  // 1. Initial purchase (isUnowned): Landmark CANNOT be built on first purchase for any normal city!
  // 2. Sequential hierarchy: Villa -> Building -> Hotel -> Landmark.
  //    Cannot build Building without Villa.
  //    Cannot build Hotel without Building (and Villa).
  //    Cannot build Landmark without Hotel (and Building, Villa) AND must already own the land.

  // Current selection states
  const [buyVilla, setBuyVilla] = useState<boolean>(() => {
    if (isSpecial || hasVilla || hasLandmark) return false;
    const required = (isUnowned ? basePrice : 0) + villaCost;
    return player.money >= required;
  });

  const [buyBuilding, setBuyBuilding] = useState<boolean>(() => {
    if (isSpecial || hasBuilding || hasLandmark) return false;
    const required = (isUnowned ? basePrice : 0) + (hasVilla ? 0 : villaCost) + buildingCost;
    // Auto select building only if villa is also affordable
    return player.money >= required;
  });

  const [buyHotel, setBuyHotel] = useState<boolean>(() => {
    if (isSpecial || hasHotel || hasLandmark) return false;
    const required = (isUnowned ? basePrice : 0) + (hasVilla ? 0 : villaCost) + (hasBuilding ? 0 : buildingCost) + hotelCost;
    return player.money >= required;
  });

  const [buyLandmark, setBuyLandmark] = useState<boolean>(() => {
    if (hasLandmark) return false;
    if (isSpecial) {
      return !isUnowned && player.money >= landmarkCost;
    }
    // Normal city: ONLY upgradable to Landmark if already owned and has all 3 (or not first purchase)
    if (isUnowned) return false; // STRICT RULE: Never on first purchase
    const alreadyHasAll3 = hasVilla && hasBuilding && hasHotel;
    return alreadyHasAll3 && player.money >= landmarkCost;
  });

  // Strict cascading hierarchy handlers
  const handleToggleVilla = () => {
    if (hasVilla || hasLandmark) return;
    if (buyVilla) {
      // Turning off villa MUST also turn off building and hotel (hierarchy)
      setBuyVilla(false);
      setBuyBuilding(false);
      setBuyHotel(false);
      setBuyLandmark(false);
    } else {
      setBuyVilla(true);
    }
  };

  const handleToggleBuilding = () => {
    if (hasBuilding || hasLandmark) return;
    if (buyBuilding) {
      // Turning off building MUST also turn off hotel and landmark
      setBuyBuilding(false);
      setBuyHotel(false);
      setBuyLandmark(false);
    } else {
      // Turning on building MUST also ensure Villa is built or bought
      if (!hasVilla) setBuyVilla(true);
      setBuyBuilding(true);
    }
  };

  const handleToggleHotel = () => {
    if (hasHotel || hasLandmark) return;
    if (buyHotel) {
      // Turning off hotel MUST also turn off landmark
      setBuyHotel(false);
      setBuyLandmark(false);
    } else {
      // Turning on hotel MUST also ensure Villa & Building are built or bought
      if (!hasVilla) setBuyVilla(true);
      if (!hasBuilding) setBuyBuilding(true);
      setBuyHotel(true);
    }
  };

  const handleToggleLandmark = () => {
    if (hasLandmark || isUnowned) return; // Unowned cannot build landmark
    if (isSpecial) {
      setBuyLandmark(!buyLandmark);
      return;
    }
    if (buyLandmark) {
      setBuyLandmark(false);
    } else {
      // Normal city: Landmark can only be built if all 3 exist or are being bought
      if (!hasVilla) setBuyVilla(true);
      if (!hasBuilding) setBuyBuilding(true);
      if (!hasHotel) setBuyHotel(true);
      setBuyLandmark(true);
    }
  };

  // Compute total cost
  let totalCost = 0;
  if (isUnowned) totalCost += basePrice;
  if (buyVilla && !hasVilla) totalCost += villaCost;
  if (buyBuilding && !hasBuilding) totalCost += buildingCost;
  if (buyHotel && !hasHotel) totalCost += hotelCost;
  if (buyLandmark && !hasLandmark) totalCost += landmarkCost;

  const simulatedBuildings = {
    hasVilla: hasVilla || buyVilla,
    hasBuilding: hasBuilding || buyBuilding,
    hasHotel: hasHotel || buyHotel,
    isLandmark: hasLandmark || buyLandmark
  };

  const estimatedToll = calculateToll({
    ...space,
    price: basePrice,
    villaPrice: villaCost,
    buildingPrice: buildingCost,
    hotelPrice: hotelCost,
    landmarkPrice: landmarkCost
  }, simulatedBuildings);

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
                <span>{isUnowned ? '부동산 최초 매입 & 건설' : '내 도시 건물 순차 증축'}</span>
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
          {/* Rule note badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>건물 건설 순서: <strong>별장 ➔ 빌딩 ➔ 호텔 ➔ 랜드마크</strong> (순차 준수)</span>
          </div>

          {/* Base Land item */}
          {isUnowned && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-200">기본 토지</div>
                  <div className="text-xs text-slate-400 font-num">{basePrice}만 원</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                기본 필수
              </span>
            </div>
          )}

          {isSpecial ? (
            // Special land (Jeju, etc.) only has Landmark upgrade option (cannot on unowned)
            <div
              onClick={() => !isUnowned && !hasLandmark && handleToggleLandmark()}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isUnowned
                  ? 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
                  : hasLandmark
                  ? 'bg-amber-950/30 border-amber-500/40 opacity-70 cursor-not-allowed'
                  : buyLandmark
                  ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 cursor-pointer'
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
                  <div className="text-xs text-slate-400 font-num">
                    {isUnowned ? '최초 매입 시 랜드마크 건설 불가 (재방문 시 증축)' : `비용: ${landmarkCost}만 원`}
                  </div>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                hasLandmark ? 'bg-amber-500 border-amber-300' : buyLandmark ? 'bg-cyan-500 border-cyan-300 text-white' : 'border-slate-600'
              }`}>
                {(hasLandmark || buyLandmark) && <Check className="w-4 h-4" />}
              </div>
            </div>
          ) : (
            // Normal City: Villa, Building, Hotel (Hierarchical order)
            <div className="grid grid-cols-3 gap-2">
              {/* 1. Villa (별장) */}
              <div
                onClick={handleToggleVilla}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                  hasVilla
                    ? 'bg-emerald-950/40 border-emerald-500/40 opacity-75'
                    : buyVilla
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-1">별장</div>
                <div className="my-1 h-6 flex items-center justify-center">
                  <VillaMiniature color={player.color} size="md" />
                </div>
                <div className="text-xs text-cyan-300 font-num font-bold">+{villaCost}만</div>
                <div className="mt-1.5 flex justify-center">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                    hasVilla || buyVilla ? 'bg-cyan-500 border-cyan-300 text-white' : 'border-slate-600'
                  }`}>
                    {(hasVilla || buyVilla) && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>

              {/* 2. Building (빌딩) - Requires Villa */}
              <div
                onClick={handleToggleBuilding}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                  hasBuilding
                    ? 'bg-emerald-950/40 border-emerald-500/40 opacity-75'
                    : buyBuilding
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-1">빌딩</div>
                <div className="my-1 h-6 flex items-center justify-center">
                  <BuildingMiniature color={player.color} size="md" />
                </div>
                <div className="text-xs text-cyan-300 font-num font-bold">+{buildingCost}만</div>
                <div className="mt-1.5 flex justify-center">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                    hasBuilding || buyBuilding ? 'bg-cyan-500 border-cyan-300 text-white' : 'border-slate-600'
                  }`}>
                    {(hasBuilding || buyBuilding) && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>

              {/* 3. Hotel (호텔) - Requires Building */}
              <div
                onClick={handleToggleHotel}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                  hasHotel
                    ? 'bg-emerald-950/40 border-emerald-500/40 opacity-75'
                    : buyHotel
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-1">호텔</div>
                <div className="my-1 h-6 flex items-center justify-center">
                  <HotelMiniature color={player.color} size="md" />
                </div>
                <div className="text-xs text-cyan-300 font-num font-bold">+{hotelCost}만</div>
                <div className="mt-1.5 flex justify-center">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                    hasHotel || buyHotel ? 'bg-cyan-500 border-cyan-300 text-white' : 'border-slate-600'
                  }`}>
                    {(hasHotel || buyHotel) && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Landmark Option for normal cities */}
          {/* Rule: Unowned land CANNOT build landmark. Must be second or third visit after full hotel build */}
          {!isSpecial && (
            <div
              onClick={() => !isUnowned && !hasLandmark && handleToggleLandmark()}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                isUnowned
                  ? 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
                  : hasLandmark
                  ? 'bg-amber-950/40 border-amber-500/40 opacity-80 cursor-not-allowed'
                  : buyLandmark
                  ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer'
                  : 'bg-slate-800/70 border-amber-500/40 cursor-pointer hover:border-amber-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/30 text-amber-400 border border-amber-400/40">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                    <span>👑 4단계: 랜드마크 건설 (인수 불가)</span>
                  </div>
                  <div className="text-xs text-slate-400 font-num">
                    {isUnowned
                      ? '최초 땅 구매 시에는 랜드마크 건설 불가 (재방문 시 증축 가능)'
                      : `비용: ${landmarkCost}만 원 (별장+빌딩+호텔 완공 후 가능)`}
                  </div>
                </div>
              </div>

              <div className={`w-5 h-5 rounded flex items-center justify-center border text-[10px] ${
                hasLandmark || buyLandmark ? 'bg-amber-500 border-amber-300 text-slate-950 font-bold' : 'border-slate-600'
              }`}>
                {(hasLandmark || buyLandmark) && <Check className="w-3.5 h-3.5" />}
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
