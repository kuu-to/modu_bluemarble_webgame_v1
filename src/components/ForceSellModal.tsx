import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SpaceData, CellState, Player } from '../types';
import { CountryFlag, CITY_COUNTRY_CODES } from './CountryFlag';
import { AlertCircle, Building2, Landmark, Check } from 'lucide-react';

export type ForceSellTargetBuilding = 'villa' | 'building' | 'hotel' | 'landmark';

interface ForceSellModalProps {
  mode: 'land' | 'building';
  player: Player;
  spaces: SpaceData[];
  cells: Record<number, CellState>;
  onConfirmSellLand: (spaceId: number, refundAmount: number) => void;
  onConfirmSellBuilding: (spaceId: number, buildingType: ForceSellTargetBuilding, refundAmount: number) => void;
}

export const ForceSellModal: React.FC<ForceSellModalProps> = ({
  mode,
  player,
  spaces,
  cells,
  onConfirmSellLand,
  onConfirmSellBuilding
}) => {
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<ForceSellTargetBuilding | null>(null);

  // Filter player's properties based on mode
  const ownedSpaces = spaces.filter(space => {
    const cell = cells[space.id];
    if (!cell || cell.owner !== player.id) return false;

    if (mode === 'land') {
      return true; // Any owned land
    } else {
      // Must have at least one building
      const b = cell.buildings;
      return b.hasVilla || b.hasBuilding || b.hasHotel || b.isLandmark;
    }
  });

  // Calculate refund amount for land sale (land price + all buildings)
  const getLandRefund = (space: SpaceData): number => {
    const cell = cells[space.id];
    if (!cell) return space.price || 0;
    let total = space.price || 0;
    if (cell.buildings.isLandmark) {
      total += space.landmarkPrice || Math.round(total * 1.5);
    } else {
      if (cell.buildings.hasVilla) total += space.villaPrice || Math.round((space.price || 0) * 0.5);
      if (cell.buildings.hasBuilding) total += space.buildingPrice || (space.price || 0);
      if (cell.buildings.hasHotel) total += space.hotelPrice || Math.round((space.price || 0) * 1.5);
    }
    return total;
  };

  // Get available buildings for selected space in building mode
  const getAvailableBuildings = (spaceId: number): { type: ForceSellTargetBuilding; name: string; refund: number }[] => {
    const space = spaces.find(s => s.id === spaceId);
    const cell = cells[spaceId];
    if (!space || !cell) return [];

    const list: { type: ForceSellTargetBuilding; name: string; refund: number }[] = [];
    if (cell.buildings.isLandmark) {
      list.push({
        type: 'landmark',
        name: '👑 랜드마크',
        refund: space.landmarkPrice || Math.round((space.price || 0) * 1.5)
      });
    } else {
      if (cell.buildings.hasHotel) {
        list.push({
          type: 'hotel',
          name: '🏨 호텔',
          refund: space.hotelPrice || Math.round((space.price || 0) * 1.5)
        });
      }
      if (cell.buildings.hasBuilding) {
        list.push({
          type: 'building',
          name: '🏢 빌딩',
          refund: space.buildingPrice || (space.price || 0)
        });
      }
      if (cell.buildings.hasVilla) {
        list.push({
          type: 'villa',
          name: '🏡 별장',
          refund: space.villaPrice || Math.round((space.price || 0) * 0.5)
        });
      }
    }
    return list;
  };

  const handleConfirm = () => {
    if (selectedSpaceId === null) return;

    if (mode === 'land') {
      const space = spaces.find(s => s.id === selectedSpaceId);
      if (!space) return;
      const refund = getLandRefund(space);
      onConfirmSellLand(selectedSpaceId, refund);
    } else {
      if (!selectedBuildingType) return;
      const bList = getAvailableBuildings(selectedSpaceId);
      const targetB = bList.find(b => b.type === selectedBuildingType);
      if (!targetB) return;
      onConfirmSellBuilding(selectedSpaceId, selectedBuildingType, targetB.refund);
    }
  };

  const isConfirmDisabled = mode === 'land'
    ? selectedSpaceId === null
    : selectedSpaceId === null || selectedBuildingType === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#1a1c29] to-slate-950 rounded-2xl border-2 border-amber-500/70 shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-4 sm:p-5 flex items-center gap-3 text-slate-950 shadow-md">
          <div className="p-2.5 rounded-xl bg-slate-950/20 text-white">
            {mode === 'land' ? <AlertCircle className="w-6 h-6 text-amber-200" /> : <Building2 className="w-6 h-6 text-amber-200" />}
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-950/80">
              황금열쇠 즉시 발동
            </div>
            <h2 className="text-lg sm:text-xl font-black font-display text-slate-950">
              {mode === 'land' ? '자신의 땅 1개 강제 매각' : '자신의 건물 1개 강제 매각 철거'}
            </h2>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-5 pt-4 pb-2 text-xs sm:text-sm text-slate-300">
          <p className="leading-relaxed">
            {mode === 'land'
              ? '매각할 땅을 하나 선택하세요. 은행에 매각되어 토지와 건물 환급금을 전액 돌려받습니다.'
              : '건물을 매각할 도시와 건물을 선택하세요. 건설 비용을 환급받고 토지는 소유로 유지됩니다.'}
          </p>
        </div>

        {/* Selection List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {ownedSpaces.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              매각 가능한 {mode === 'land' ? '토지' : '건물'}가 없습니다.
            </div>
          ) : (
            ownedSpaces.map(space => {
              const cell = cells[space.id];
              const isSelected = selectedSpaceId === space.id;
              const refund = getLandRefund(space);

              return (
                <div
                  key={space.id}
                  onClick={() => {
                    setSelectedSpaceId(space.id);
                    if (mode === 'building') {
                      const avail = getAvailableBuildings(space.id);
                      if (avail.length > 0) {
                        setSelectedBuildingType(avail[0].type);
                      }
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                      : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {CITY_COUNTRY_CODES[space.id] ? (
                        <CountryFlag spaceId={space.id} size="md" />
                      ) : (
                        <span className="text-2xl">{space.icon}</span>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{space.name}</span>
                          {cell?.buildings.isLandmark && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black flex items-center gap-0.5">
                              <Landmark className="w-2.5 h-2.5" /> 랜드마크
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {mode === 'land' ? (
                            <span>매각 환급금: <strong className="text-emerald-400 font-num">+{refund}만 원</strong></span>
                          ) : (
                            <span className="flex items-center gap-1">
                              보유:
                              {cell?.buildings.isLandmark && ' 👑랜드마크'}
                              {cell?.buildings.hasHotel && ' 🏨호텔'}
                              {cell?.buildings.hasBuilding && ' 🏢빌딩'}
                              {cell?.buildings.hasVilla && ' 🏡별장'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {mode === 'land' && (
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-300 font-num">+{refund}만</span>
                        </div>
                      )}
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  {/* If building mode and this space is selected, show building choices */}
                  {mode === 'building' && isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                      {getAvailableBuildings(space.id).map(b => {
                        const isBSelected = selectedBuildingType === b.type;
                        return (
                          <button
                            key={b.type}
                            type="button"
                            onClick={() => setSelectedBuildingType(b.type)}
                            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                              isBSelected
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <div className="font-bold text-xs">{b.name}</div>
                            <div className="text-[11px] text-emerald-400 font-num mt-1 font-semibold">
                              환급 +{b.refund}만
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {player.name} (보유 잔액: <span className="text-amber-400 font-num font-bold">{player.money}만</span>)
          </div>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
            className={`py-2.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all ${
              isConfirmDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 active:scale-95 cursor-pointer font-black'
            }`}
          >
            {mode === 'land' ? '선택 토지 매각 확정' : '선택 건물 매각 확정'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
