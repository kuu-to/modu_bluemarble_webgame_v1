import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SpaceData, CellState, Player, ForceSellTargetBuilding, PropertySalePlan } from '../types';
import { calculateSpaceValue } from '../data/boardData';
import { 
  AlertTriangle, 
  CreditCard, 
  Store, 
  Skull, 
  Check, 
  Landmark,
  Building2,
  Home,
  MapPin
} from 'lucide-react';
import { CountryFlag } from './CountryFlag';

export const getBuildingRefundAmount = (space: SpaceData, type: ForceSellTargetBuilding): number => {
  if (type === 'landmark') return space.landmarkPrice || Math.round((space.price || 0) * 1.5);
  if (type === 'hotel') return space.hotelPrice || Math.round((space.price || 0) * 1.5);
  if (type === 'building') return space.buildingPrice || (space.price || 0);
  if (type === 'villa') return space.villaPrice || Math.round((space.price || 0) * 0.5);
  return 0;
};

interface EmergencyDebtModalProps {
  payer: Player;
  debtAmount: number; // Deficit amount needed to pay (requiredTotal - payer.money)
  totalRequiredAmount?: number; // Total amount needed to pay (e.g. toll, tax, golden key fine)
  recipient: Player | null; // Person or bank/tax recipient
  reasonText: string;
  spaces: SpaceData[];
  cells: Record<number, CellState>;
  onTakeLoan: (loanAmount: number) => void;
  onSellProperties: (salePlans: PropertySalePlan[], totalRecoveredMoney: number) => void;
  onBankrupt: () => void;
}

export const EmergencyDebtModal: React.FC<EmergencyDebtModalProps> = ({
  payer,
  debtAmount,
  totalRequiredAmount,
  recipient,
  reasonText,
  spaces,
  cells,
  onTakeLoan,
  onSellProperties,
  onBankrupt
}) => {
  const fullRequiredAmount = totalRequiredAmount || (payer.money + debtAmount);
  // Loan is permitted if player has no existing debt (debt === 0). If debt remains, loan is blocked.
  const canTakeLoan = (payer.debt || 0) === 0;

  // Find all properties owned by payer and their sellable assets
  const ownedProperties = (Object.entries(cells) as [string, CellState][])
    .filter(([_, cell]) => cell.owner === payer.id)
    .map(([idStr, cell]) => {
      const spaceId = Number(idStr);
      const space = spaces[spaceId];
      const landPrice = space ? (space.price || 0) : 0;

      const availableBuildings: {
        type: ForceSellTargetBuilding;
        name: string;
        icon: string;
        refund: number;
      }[] = [];

      if (space) {
        if (cell.buildings.isLandmark) {
          availableBuildings.push({
            type: 'landmark',
            name: '랜드마크',
            icon: '👑',
            refund: getBuildingRefundAmount(space, 'landmark')
          });
        }
        if (cell.buildings.hasHotel) {
          availableBuildings.push({
            type: 'hotel',
            name: '호텔',
            icon: '🏨',
            refund: getBuildingRefundAmount(space, 'hotel')
          });
        }
        if (cell.buildings.hasBuilding) {
          availableBuildings.push({
            type: 'building',
            name: '빌딩',
            icon: '🏢',
            refund: getBuildingRefundAmount(space, 'building')
          });
        }
        if (cell.buildings.hasVilla) {
          availableBuildings.push({
            type: 'villa',
            name: '별장',
            icon: '🏡',
            refund: getBuildingRefundAmount(space, 'villa')
          });
        }
      }

      const totalCityRefund = space ? calculateSpaceValue(space, cell.buildings) : 0;

      return {
        spaceId,
        space,
        cell,
        landPrice,
        availableBuildings,
        totalCityRefund
      };
    });

  const [selectedAction, setSelectedAction] = useState<'loan' | 'sell' | null>(
    canTakeLoan ? 'loan' : (ownedProperties.length > 0 ? 'sell' : null)
  );
  
  // Set of spaceIds where the land itself (and whole property) is marked for sale
  const [selectedLandSpaces, setSelectedLandSpaces] = useState<number[]>([]);

  // Set of keys in format `${spaceId}:${buildingType}` for buildings specifically marked for sale
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);

  // Toggle building sale
  const toggleBuilding = (spaceId: number, bType: ForceSellTargetBuilding) => {
    const key = `${spaceId}:${bType}`;
    const isCurrentlySelected = selectedBuildings.includes(key);

    if (isCurrentlySelected) {
      setSelectedBuildings(prev => prev.filter(k => k !== key));
      // If land was marked for sale, unmark land because keeping a building requires keeping the land
      setSelectedLandSpaces(prev => prev.filter(id => id !== spaceId));
    } else {
      setSelectedBuildings(prev => [...prev, key]);
    }
  };

  // Toggle land sale (selling land liquidates the land and all buildings on it)
  const toggleLand = (spaceId: number) => {
    const prop = ownedProperties.find(p => p.spaceId === spaceId);
    if (!prop) return;

    const isLandSelected = selectedLandSpaces.includes(spaceId);

    if (isLandSelected) {
      setSelectedLandSpaces(prev => prev.filter(id => id !== spaceId));
    } else {
      setSelectedLandSpaces(prev => [...prev, spaceId]);
      // Also mark all available buildings on this space
      setSelectedBuildings(prev => {
        const next = [...prev];
        prop.availableBuildings.forEach(b => {
          const k = `${spaceId}:${b.type}`;
          if (!next.includes(k)) next.push(k);
        });
        return next;
      });
    }
  };

  // Calculate total money recovered from selected land & buildings
  const totalRecoveredMoney = ownedProperties.reduce((sum, prop) => {
    if (selectedLandSpaces.includes(prop.spaceId)) {
      return sum + prop.totalCityRefund;
    } else {
      const buildingSum = prop.availableBuildings.reduce((bSum, b) => {
        if (selectedBuildings.includes(`${prop.spaceId}:${b.type}`)) {
          return bSum + b.refund;
        }
        return bSum;
      }, 0);
      return sum + buildingSum;
    }
  }, 0);

  // Generate sale plans
  const salePlans: PropertySalePlan[] = ownedProperties
    .map(prop => {
      const isLandSold = selectedLandSpaces.includes(prop.spaceId);
      if (isLandSold) {
        return {
          spaceId: prop.spaceId,
          sellLand: true,
          soldBuildings: prop.availableBuildings.map(b => b.type),
          refundAmount: prop.totalCityRefund
        };
      }

      const soldB = prop.availableBuildings.filter(b => 
        selectedBuildings.includes(`${prop.spaceId}:${b.type}`)
      );

      if (soldB.length > 0) {
        const refund = soldB.reduce((s, b) => s + b.refund, 0);
        return {
          spaceId: prop.spaceId,
          sellLand: false,
          soldBuildings: soldB.map(b => b.type),
          refundAmount: refund
        };
      }

      return null;
    })
    .filter((plan): plan is PropertySalePlan => plan !== null);

  // Since debtAmount is the deficit, total recovered money must be >= debtAmount to cover the gap
  const canAffordWithSell = totalRecoveredMoney >= debtAmount;
  const remainingCashAfterSale = (payer.money + totalRecoveredMoney) - fullRequiredAmount;

  // Total counts for user overview
  const totalSoldLandsCount = salePlans.filter(p => p.sellLand).length;
  const totalSoldBuildingsCount = salePlans.reduce((sum, p) => sum + (p.sellLand ? 0 : p.soldBuildings.length), 0);

  const handleConfirmAction = () => {
    if (selectedAction === 'loan' && canTakeLoan) {
      onTakeLoan(debtAmount);
    } else if (selectedAction === 'sell') {
      if (canAffordWithSell && salePlans.length > 0) {
        onSellProperties(salePlans, totalRecoveredMoney);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-xl bg-gradient-to-b from-[#240808] via-[#1a0a1c] to-slate-950 rounded-3xl border-2 border-rose-500/70 shadow-[0_0_50px_rgba(244,63,94,0.45)] overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-800 via-red-600 to-rose-900 p-4 sm:p-5 flex items-center justify-between text-white shadow-md border-b border-rose-400/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-yellow-300 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-200 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-400/40">
                자금 부족 구제 위원회
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-display drop-shadow mt-0.5">
                지불 자금 부족 경고!
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-rose-200 font-bold">부족 금액</span>
            <div className="text-2xl font-black font-num text-yellow-300">
              {debtAmount}만 원
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">발생 사유</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5 leading-snug">{reasonText}</div>
              <div className="text-xs text-rose-300 mt-1 flex items-center gap-2">
                <span>총 청구액: <strong className="font-num text-white">{fullRequiredAmount}만 원</strong></span>
                <span>•</span>
                {recipient ? (
                  <span className="text-cyan-300">수취인: <strong>{recipient.name}</strong></span>
                ) : (
                  <span className="text-amber-300">납부처: <strong>국세청 / 복지기금 / 공공금고</strong></span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] text-slate-400 font-semibold">현재 보유 현금</div>
              <div className="text-lg font-black text-amber-400 font-num">
                {payer.money}만 원
              </div>
            </div>
          </div>

          {/* Action Tabs: [1. 대출하기] vs [2. 땅 & 건물 개별 매각] */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Option 1: Loan */}
            <button
              id="emergency-loan-tab-btn"
              type="button"
              disabled={!canTakeLoan}
              onClick={() => setSelectedAction('loan')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                !canTakeLoan
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-60 cursor-not-allowed text-slate-500'
                  : selectedAction === 'loan'
                  ? 'bg-gradient-to-b from-indigo-950/90 to-slate-900 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    !canTakeLoan ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {!canTakeLoan ? `빚 ${payer.debt}만 보유 (대출 불가)` : '대출 가능 (빚 0원)'}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-100">긴급 구제 대출</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {canTakeLoan ? (
                    <span>부족한 <strong className="text-yellow-300 font-num">{debtAmount}만 원</strong>을 대출받아 즉시 완납합니다.</span>
                  ) : (
                    <span className="text-rose-300/90">갚지 않은 빚({payer.debt}만 원)이 있어 추가 대출 불가</span>
                  )}
                </div>
              </div>

              {canTakeLoan && (
                <div className="mt-2 text-[11.5px] font-bold text-indigo-300 font-num">
                  + {debtAmount}만 원 대출 실행
                </div>
              )}
            </button>

            {/* Option 2: Sell Land & Buildings Separately */}
            <button
              id="emergency-sell-tab-btn"
              type="button"
              disabled={ownedProperties.length === 0}
              onClick={() => setSelectedAction('sell')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                ownedProperties.length === 0
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed text-slate-500'
                  : selectedAction === 'sell'
                  ? 'bg-gradient-to-b from-amber-950/90 to-slate-900 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    보유 도시 {ownedProperties.length}개
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-100">땅 / 건물 선택 매각</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  별장, 빌딩, 호텔, 땅을 원하는 대로 골라 매각합니다.
                </div>
              </div>

              <div className="mt-2 text-[11.5px] font-bold text-amber-300 font-num">
                {ownedProperties.length > 0 ? `선택 확보: +${totalRecoveredMoney}만 원` : '매각 가능한 도시 없음'}
              </div>
            </button>
          </div>

          {/* Sub-view: When Sell is selected, show property selector with granular building choices */}
          {selectedAction === 'sell' && (
            <div className="space-y-3 pt-1">
              {/* Header Status of Sale */}
              <div className="p-2.5 rounded-xl bg-slate-900/95 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-300">매각 확보액:</span>
                  <span className="font-num font-black text-amber-300 text-sm">
                    +{totalRecoveredMoney}만 원
                  </span>
                  <span className="text-slate-500 text-[11px]">/ 필요 {debtAmount}만 원</span>
                </div>

                <div className="text-[11px] text-slate-400 font-medium">
                  {totalSoldLandsCount > 0 && <span className="text-rose-300 mr-1.5">대지 {totalSoldLandsCount}개</span>}
                  {totalSoldBuildingsCount > 0 && <span className="text-amber-300">건물 {totalSoldBuildingsCount}개</span>}
                  {totalSoldLandsCount === 0 && totalSoldBuildingsCount === 0 && (
                    <span className="text-slate-500">매각할 항목을 선택하세요</span>
                  )}
                </div>
              </div>

              {canAffordWithSell && (totalSoldLandsCount > 0 || totalSoldBuildingsCount > 0) && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <span className="font-semibold">✅ 완납 가능! 지불 후 잔여 현금:</span>
                  <span className="font-black text-amber-300 font-num text-sm">+{remainingCashAfterSale}만 원</span>
                </div>
              )}

              {ownedProperties.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  매각할 수 있는 소유 도시가 없습니다.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                  {ownedProperties.map(prop => {
                    const isLandSelected = selectedLandSpaces.includes(prop.spaceId);
                    const selectedBuildingsOnThisCity = prop.availableBuildings.filter(b => 
                      selectedBuildings.includes(`${prop.spaceId}:${b.type}`)
                    );
                    const hasAnySelection = isLandSelected || selectedBuildingsOnThisCity.length > 0;

                    return (
                      <div
                        key={prop.spaceId}
                        className={`p-3 rounded-2xl border transition-all ${
                          isLandSelected
                            ? 'bg-rose-950/30 border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                            : hasAnySelection
                            ? 'bg-amber-950/30 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Card Header: Flag, City Name, Total Asset Value, Current Status Badge */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2.5">
                            <CountryFlag spaceId={prop.spaceId} size="md" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-slate-100">
                                  {prop.space?.name || `도시 #${prop.spaceId}`}
                                </span>
                                {prop.cell.buildings.isLandmark && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                                    👑 랜드마크
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                대지 기본가: <span className="font-num text-slate-300 font-semibold">{prop.landPrice}만 원</span>
                                {' • '}
                                도시 총자산: <span className="font-num text-amber-300 font-semibold">{prop.totalCityRefund}만 원</span>
                              </div>
                            </div>
                          </div>

                          {/* Selection status badge */}
                          <div>
                            {isLandSelected ? (
                              <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                                ⚠️ 도시 전체 매각 (+{prop.totalCityRefund}만)
                              </span>
                            ) : selectedBuildingsOnThisCity.length > 0 ? (
                              <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                ✨ 건물 {selectedBuildingsOnThisCity.length}개 매각 (대지 유지)
                              </span>
                            ) : (
                              <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                보유 유지
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Selectable Items: Buildings & Land */}
                        <div className="mt-2.5 space-y-2">
                          {/* Individual Building Choices (Villa, Building, Hotel, Landmark) */}
                          {prop.availableBuildings.length > 0 && (
                            <div>
                              <div className="text-[10.5px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                                <span>건물 개별 매각 (대지 소유권 유지)</span>
                                <span className="text-[10px] text-slate-500">원하는 건물만 선택 매각</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {prop.availableBuildings.map(b => {
                                  const isBSelected = selectedBuildings.includes(`${prop.spaceId}:${b.type}`);
                                  return (
                                    <button
                                      key={b.type}
                                      type="button"
                                      onClick={() => toggleBuilding(prop.spaceId, b.type)}
                                      className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                        isBSelected
                                          ? 'bg-amber-500/25 border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/60'
                                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs flex items-center gap-1">
                                          <span>{b.icon}</span>
                                          <span>{b.name}</span>
                                        </span>
                                        <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                          isBSelected ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold' : 'border-slate-700'
                                        }`}>
                                          {isBSelected && '✓'}
                                        </div>
                                      </div>
                                      <div className="mt-1 flex items-center justify-between text-[11px]">
                                        <span className="text-slate-400 text-[10px]">환급</span>
                                        <span className="font-num font-bold text-amber-300">+{b.refund}만</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Land (대지) Selling Option */}
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() => toggleLand(prop.spaceId)}
                              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                isLandSelected
                                  ? 'bg-rose-950/50 border-rose-400 text-rose-100 ring-1 ring-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                  isLandSelected ? 'bg-rose-500 border-rose-300 text-white font-bold' : 'border-slate-700'
                                }`}>
                                  {isLandSelected && '✓'}
                                </div>
                                <span className="font-bold text-xs">
                                  ⛳ {prop.availableBuildings.length > 0 ? '대지 및 도시 전체 매각' : '대지(토지) 매각'}
                                </span>
                                <span className="text-[10.5px] text-slate-500">
                                  (도시 소유권 반납)
                                </span>
                              </div>
                              <div className="font-num font-bold text-xs text-rose-300">
                                +{prop.totalCityRefund}만 원
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-view: When Loan is selected, show explanation */}
          {selectedAction === 'loan' && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5 text-xs text-indigo-200">
              <div className="font-bold flex items-center gap-1 text-indigo-300">
                <CreditCard className="w-4 h-4" />
                <span>긴급 구제 대출 안내</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-indigo-200/90">
                • 빚이 없는 상태라면 <strong>횟수 제한 없이</strong> 언제든 부족한 금액을 대출받을 수 있습니다. (현재 갚지 않은 빚이 남아있는 경우 완납 전까지 추가 대출 불가)
              </p>
              <p className="text-[11.5px] leading-relaxed text-indigo-200/90">
                • 대출 실행 시 부족한 <strong>{debtAmount}만 원</strong>의 빚이 발생하며 {recipient ? `${recipient.name}님에게` : '세금/비용으로'} 즉시 완납 처리됩니다.
              </p>
              <p className="text-[11.5px] leading-relaxed text-indigo-200/90">
                • 빚은 게임 진행 중 우측 상단의 <strong>[빚 갚기]</strong> 버튼으로 언제든 전액 상환할 수 있으며, 상환을 완료하면 추후 다시 대출을 이용할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex gap-2.5">
          {/* Bankrupt Button */}
          <button
            id="emergency-bankrupt-btn"
            type="button"
            onClick={onBankrupt}
            className="py-3 px-3 sm:px-4 rounded-xl bg-slate-900 hover:bg-rose-950 border border-rose-900/60 text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="모든 구제를 포기하고 즉시 파산합니다"
          >
            <Skull className="w-4 h-4" />
            <span>파산 (기권)</span>
          </button>

          {/* Action Confirm Button */}
          <button
            id="emergency-confirm-action-btn"
            type="button"
            onClick={handleConfirmAction}
            disabled={
              selectedAction === null ||
              (selectedAction === 'loan' && !canTakeLoan) ||
              (selectedAction === 'sell' && (!canAffordWithSell || salePlans.length === 0))
            }
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              (selectedAction === 'loan' && canTakeLoan) || (selectedAction === 'sell' && canAffordWithSell && salePlans.length > 0)
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-600/30 border border-emerald-300'
                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            {selectedAction === 'loan' && (
              <>
                <CreditCard className="w-4 h-4" />
                <span>{debtAmount}만 원 대출받고 완납하기</span>
              </>
            )}
            {selectedAction === 'sell' && (
              <>
                <Store className="w-4 h-4" />
                <span>
                  {canAffordWithSell && salePlans.length > 0
                    ? `선택 항목 매각 후 ${fullRequiredAmount}만 원 완납 (+${totalRecoveredMoney}만 확보)`
                    : `매각액 부족 (+${totalRecoveredMoney}/${debtAmount}만 원)`}
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
