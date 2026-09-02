import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SpaceData, CellState, Player } from '../types';
import { calculateToll } from '../data/boardData';
import { CountryFlag, CITY_COUNTRY_CODES } from './CountryFlag';
import { 
  Building2, 
  Home, 
  Landmark, 
  Hotel, 
  Check, 
  X, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  Flag,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export interface UpgradeableCityInfo {
  space: SpaceData;
  cell: CellState;
  currentBuildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean };
  currentToll: number;
  nextUpgradeType: 'villa' | 'building' | 'hotel' | 'landmark';
  nextUpgradeLabel: string;
  nextUpgradeIcon: string;
  nextUpgradeCost: number;
  nextBuildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean };
  nextToll: number;
  tollDiff: number;
  canAfford: boolean;
}

interface StartUpgradeModalProps {
  spaces: SpaceData[];
  cells: Record<number, CellState>;
  player: Player;
  onConfirmUpgrade: (spaceId: number, newBuildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean }, cost: number) => void;
  onSkip: () => void;
}

export function getUpgradeableCities(
  spaces: SpaceData[],
  cells: Record<number, CellState>,
  player: Player
): UpgradeableCityInfo[] {
  const result: UpgradeableCityInfo[] = [];

  spaces.forEach((space) => {
    if (space.type !== 'city') return;
    const cell = cells[space.id];
    if (!cell || cell.owner !== player.id) return;
    if (cell.buildings.isLandmark) return; // Already fully upgraded

    const basePrice = space.price || (space.isSpecialLand ? 20 : 10);
    const villaCost = space.villaPrice || Math.round(basePrice * 0.5);
    const buildingCost = space.buildingPrice || basePrice;
    const hotelCost = space.hotelPrice || Math.round(basePrice * 1.5);
    const landmarkCost = space.landmarkPrice || Math.round(basePrice * 2.5);

    const b = cell.buildings;
    let nextType: 'villa' | 'building' | 'hotel' | 'landmark';
    let nextLabel: string;
    let nextIcon: string;
    let nextCost: number;
    let nextB: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean };

    if (space.isSpecialLand) {
      // Special lands jump directly to Landmark
      nextType = 'landmark';
      nextLabel = '👑 랜드마크 건설';
      nextIcon = '👑';
      nextCost = landmarkCost;
      nextB = { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: true };
    } else if (!b.hasVilla) {
      nextType = 'villa';
      nextLabel = '🏡 별장 추가 증축';
      nextIcon = '🏡';
      nextCost = villaCost;
      nextB = { hasVilla: true, hasBuilding: false, hasHotel: false, isLandmark: false };
    } else if (!b.hasBuilding) {
      nextType = 'building';
      nextLabel = '🏢 빌딩 추가 증축';
      nextIcon = '🏢';
      nextCost = buildingCost;
      nextB = { hasVilla: true, hasBuilding: true, hasHotel: false, isLandmark: false };
    } else if (!b.hasHotel) {
      nextType = 'hotel';
      nextLabel = '🏨 호텔 추가 증축';
      nextIcon = '🏨';
      nextCost = hotelCost;
      nextB = { hasVilla: true, hasBuilding: true, hasHotel: true, isLandmark: false };
    } else {
      nextType = 'landmark';
      nextLabel = '👑 랜드마크 건설';
      nextIcon = '👑';
      nextCost = landmarkCost;
      nextB = { hasVilla: true, hasBuilding: true, hasHotel: true, isLandmark: true };
    }

    const currentToll = cell.currentToll || calculateToll(space, b);
    const nextToll = calculateToll(space, nextB);
    const tollDiff = nextToll - currentToll;
    const canAfford = player.money >= nextCost;

    result.push({
      space,
      cell,
      currentBuildings: b,
      currentToll,
      nextUpgradeType: nextType,
      nextUpgradeLabel: nextLabel,
      nextUpgradeIcon: nextIcon,
      nextUpgradeCost: nextCost,
      nextBuildings: nextB,
      nextToll,
      tollDiff,
      canAfford
    });
  });

  return result;
}

export const StartUpgradeModal: React.FC<StartUpgradeModalProps> = ({
  spaces,
  cells,
  player,
  onConfirmUpgrade,
  onSkip
}) => {
  const upgradeableList = getUpgradeableCities(spaces, cells, player);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(() => {
    const firstAffordable = upgradeableList.find(item => item.canAfford);
    return firstAffordable ? firstAffordable.space.id : (upgradeableList[0]?.space.id ?? null);
  });

  const selectedItem = upgradeableList.find(item => item.space.id === selectedSpaceId);

  const handleConfirm = () => {
    if (!selectedItem || !selectedItem.canAfford) return;
    onConfirmUpgrade(selectedItem.space.id, selectedItem.nextBuildings, selectedItem.nextUpgradeCost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-950/95 border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#103816] to-teal-950 p-4 sm:p-5 border-b border-emerald-500/30 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl shadow-inner">
                🏁
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    시작점 완착 보너스
                  </span>
                  <span className="text-xs text-slate-300">첫 턴 이후 도착 특전</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-teal-200 mt-0.5">
                  내 도시 원격 추가 증축 찬스
                </h2>
              </div>
            </div>

            {/* Player Cash Display */}
            <div className="text-right">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end font-semibold">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>보유 현금</span>
              </div>
              <div className="text-base sm:text-lg font-black text-amber-400 font-num">
                {player.money}만 원
              </div>
            </div>
          </div>

          <p className="text-xs text-emerald-200/80 mt-2 leading-relaxed">
            시작점에 정확히 안착했습니다! 보유한 도시 중 <strong>1곳을 선택하여</strong> 건물을 추가 증축할 수 있습니다.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {upgradeableList.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
              <div className="text-4xl mb-2">🏙️</div>
              <div className="font-bold text-slate-200 text-sm">
                현재 추가 증축할 수 있는 보유 도시가 없습니다.
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                보유한 도시가 없거나, 모든 보유 도시가 이미 최고 등급인 👑 랜드마크까지 완공된 상태입니다.
              </p>
            </div>
          ) : (
            <>
              {/* City Selection List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>증축할 도시 선택 (보유 도시 {upgradeableList.length}곳 중 1곳 선택)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    선택 후 아래에서 건설 확정
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {upgradeableList.map((item) => {
                    const isSelected = selectedSpaceId === item.space.id;
                    const countryCode = CITY_COUNTRY_CODES[item.space.name];

                    return (
                      <button
                        key={item.space.id}
                        type="button"
                        onClick={() => setSelectedSpaceId(item.space.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-950/80 to-teal-950/70 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400'
                            : item.canAfford
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                            : 'bg-slate-900/40 border-slate-800/60 opacity-60 hover:opacity-80 text-slate-400'
                        }`}
                      >
                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9.5px] font-extrabold rounded-bl-xl flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>선택됨</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl shrink-0">{item.space.icon || '🏙️'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {countryCode && (
                                <CountryFlag
                                  countryCode={countryCode}
                                  alt={item.space.name}
                                  size="sm"
                                  className="rounded shadow-xs shrink-0"
                                />
                              )}
                              <span className="font-bold text-sm text-white truncate">
                                {item.space.name}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>현재:</span>
                              {item.currentBuildings.hasHotel ? (
                                <span className="text-purple-300 font-semibold">별장+빌딩+호텔</span>
                              ) : item.currentBuildings.hasBuilding ? (
                                <span className="text-blue-300 font-semibold">별장+빌딩</span>
                              ) : item.currentBuildings.hasVilla ? (
                                <span className="text-emerald-300 font-semibold">별장 1채</span>
                              ) : (
                                <span className="text-amber-300 font-semibold">대지 (건물 없음)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Upgrade Detail Badge */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-emerald-300">
                              {item.nextUpgradeLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 font-num">
                            <span className={`font-extrabold ${item.canAfford ? 'text-amber-300' : 'text-rose-400'}`}>
                              {item.nextUpgradeCost}만 원
                            </span>
                            {!item.canAfford && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-600/40">
                                부족
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected City Upgrade Summary Card */}
              {selectedItem && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedItem.space.icon || '🏙️'}</span>
                      <div>
                        <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                          증축 대상 도시
                        </div>
                        <div className="text-base font-extrabold text-white">
                          [{selectedItem.space.name}] {selectedItem.nextUpgradeLabel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10.5px] text-slate-400">필요 건설 비용</div>
                      <div className="text-base sm:text-lg font-black text-amber-400 font-num">
                        {selectedItem.nextUpgradeCost}만 원
                      </div>
                    </div>
                  </div>

                  {/* Toll Comparison Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">현재 통행료</div>
                      <div className="text-sm font-bold text-slate-300 font-num mt-0.5">
                        {selectedItem.currentToll}만 원
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>증축 후 통행료</span>
                      </div>
                      <div className="text-sm font-black text-emerald-300 font-num mt-0.5">
                        {selectedItem.nextToll}만 원
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30">
                      <div className="text-[10px] text-amber-400 font-bold">통행료 상승</div>
                      <div className="text-sm font-extrabold text-amber-300 font-num mt-0.5">
                        +{selectedItem.tollDiff}만 원
                      </div>
                    </div>
                  </div>

                  {/* Balance after build */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>건설 후 잔여 자금:</span>
                    <span className={`font-bold font-num ${
                      player.money - selectedItem.nextUpgradeCost >= 0 ? 'text-slate-200' : 'text-rose-400'
                    }`}>
                      {player.money - selectedItem.nextUpgradeCost}만 원
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="py-3 px-4 sm:px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>다음에 하기 (건너뛰기)</span>
          </button>

          {upgradeableList.length > 0 && selectedItem && (
            <button
              type="button"
              disabled={!selectedItem.canAfford}
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 sm:px-6 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                selectedItem.canAfford
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {selectedItem.canAfford
                  ? `[${selectedItem.space.name}] ${selectedItem.nextUpgradeLabel} 확정 (-${selectedItem.nextUpgradeCost}만)`
                  : '현금 부족으로 건설 불가'}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
