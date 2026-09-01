import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SpaceData, CellState, Player } from '../types';
import { calculateSpaceValue } from '../data/boardData';
import { 
  AlertTriangle, 
  CreditCard, 
  Store, 
  Skull, 
  Check, 
  DollarSign, 
  ShieldAlert, 
  Coins,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { CountryFlag } from './CountryFlag';

interface EmergencyDebtModalProps {
  payer: Player;
  debtAmount: number; // Deficit amount needed to pay (e.g. toll - payer.money)
  recipient: Player | null; // Person or bank/tax recipient
  reasonText: string;
  spaces: SpaceData[];
  cells: Record<number, CellState>;
  onTakeLoan: (loanAmount: number) => void;
  onSellProperties: (soldSpaceIds: number[], totalRecoveredMoney: number) => void;
  onBankrupt: () => void;
}

export const EmergencyDebtModal: React.FC<EmergencyDebtModalProps> = ({
  payer,
  debtAmount,
  recipient,
  reasonText,
  spaces,
  cells,
  onTakeLoan,
  onSellProperties,
  onBankrupt
}) => {
  const [selectedAction, setSelectedAction] = useState<'loan' | 'sell' | null>(
    !payer.hasUsedLoan ? 'loan' : 'sell'
  );
  
  // Selected lands to sell: spaceId[]
  const [selectedSellSpaces, setSelectedSellSpaces] = useState<number[]>([]);

  // Find all properties owned by payer
  const ownedProperties = (Object.entries(cells) as [string, CellState][])
    .filter(([_, cell]) => cell.owner === payer.id)
    .map(([idStr, cell]) => {
      const spaceId = Number(idStr);
      const space = spaces[spaceId];
      const spaceVal = space ? calculateSpaceValue(space, cell.buildings) : 0;
      // Sale recovery price (100% of base land + building value)
      const sellPrice = spaceVal;
      return {
        spaceId,
        space,
        cell,
        sellPrice
      };
    });

  // Calculate total money recovered from selected properties
  const totalRecoveredMoney = selectedSellSpaces.reduce((sum, id) => {
    const prop = ownedProperties.find(p => p.spaceId === id);
    return sum + (prop ? prop.sellPrice : 0);
  }, 0);

  const canAffordWithSell = (payer.money + totalRecoveredMoney) >= debtAmount;

  const toggleSelectProperty = (spaceId: number) => {
    setSelectedSellSpaces(prev => 
      prev.includes(spaceId) ? prev.filter(id => id !== spaceId) : [...prev, spaceId]
    );
  };

  const handleConfirmAction = () => {
    if (selectedAction === 'loan' && !payer.hasUsedLoan) {
      // Loan amount is exactly the deficit needed: debtAmount
      onTakeLoan(debtAmount);
    } else if (selectedAction === 'sell') {
      if (canAffordWithSell) {
        onSellProperties(selectedSellSpaces, totalRecoveredMoney);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#220a0a] via-[#1a0c1e] to-slate-950 rounded-3xl border-2 border-rose-500/70 shadow-[0_0_50px_rgba(244,63,94,0.4)] overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-800 via-red-600 to-rose-900 p-4 sm:p-5 flex items-center justify-between text-white shadow-md">
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
            <span className="text-[11px] text-rose-200">부족 금액</span>
            <div className="text-2xl font-black font-num text-yellow-300">
              {debtAmount}만 원
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">발생 사유</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{reasonText}</div>
              {recipient && (
                <div className="text-xs text-cyan-300 mt-0.5">
                  수취인: <strong>{recipient.name}</strong>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">현재 보유 현금</div>
              <div className="text-base font-bold text-amber-400 font-num">
                {payer.money}만 원
              </div>
            </div>
          </div>

          {/* Action Tabs: [1. 대출하기 (최초 1회)] vs [2. 땅 & 건물 판매] */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Option 1: Loan */}
            <button
              type="button"
              disabled={payer.hasUsedLoan}
              onClick={() => setSelectedAction('loan')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                payer.hasUsedLoan
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed text-slate-500'
                  : selectedAction === 'loan'
                  ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    payer.hasUsedLoan ? 'bg-slate-800 text-slate-500' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {payer.hasUsedLoan ? '사용 완료' : '최초 1회 가능'}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-100">긴급 구제 대출</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  부족한 {debtAmount}만 원을 빚으로 대출하여 즉시 지불합니다.
                </div>
              </div>

              {!payer.hasUsedLoan && (
                <div className="mt-2 text-[11.5px] font-bold text-indigo-300 font-num">
                  + {debtAmount}만 원 대출
                </div>
              )}
            </button>

            {/* Option 2: Sell Land & Buildings */}
            <button
              type="button"
              disabled={ownedProperties.length === 0}
              onClick={() => setSelectedAction('sell')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                ownedProperties.length === 0
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed text-slate-500'
                  : selectedAction === 'sell'
                  ? 'bg-gradient-to-b from-amber-950/80 to-slate-900 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400'
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
                <div className="font-bold text-sm text-slate-100">부동산 매각</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  내 소유 도시와 건물을 매각하여 부족금을 마련합니다.
                </div>
              </div>

              <div className="mt-2 text-[11.5px] font-bold text-amber-300 font-num">
                {ownedProperties.length > 0 ? `선택: +${totalRecoveredMoney}만 원` : '매각 가능한 도시 없음'}
              </div>
            </button>
          </div>

          {/* Sub-view: When Sell is selected, show property selector */}
          {selectedAction === 'sell' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">매각할 도시 선택 ({selectedSellSpaces.length}개 선택됨)</span>
                <span className="font-num font-bold text-amber-300">
                  확보 금액: {totalRecoveredMoney}만 원 / 필요: {debtAmount - payer.money}만 원
                </span>
              </div>

              {ownedProperties.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  매각할 수 있는 소유 도시가 없습니다.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {ownedProperties.map(({ spaceId, space, cell, sellPrice }) => {
                    const isSelected = selectedSellSpaces.includes(spaceId);
                    return (
                      <div
                        key={spaceId}
                        onClick={() => toggleSelectProperty(spaceId)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] text-amber-100'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CountryFlag spaceId={spaceId} size="sm" />
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>{space?.name || `도시 #${spaceId}`}</span>
                              {cell.buildings.isLandmark && <span className="text-[10px] text-amber-400 font-bold">👑 랜드마크</span>}
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-num">
                              매각 환급가: <strong className="text-amber-300">{sellPrice}만 원</strong>
                            </div>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                          isSelected ? 'bg-amber-500 border-amber-300 text-slate-950 font-bold' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
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
                • 대출은 <strong>최초 1회</strong>만 승인되며, 부족한 <strong>{debtAmount}만 원</strong>의 빚이 발생하여 상대방에게 즉시 송금됩니다.
              </p>
              <p className="text-[11.5px] leading-relaxed text-indigo-200/90">
                • 빚은 게임 진행 중 <strong>[빚 갚기]</strong> 버튼으로 언제든 상환할 수 있으며, 시간 종료 시 최종 재산(총자산 - 빚) 계산에 반영됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex gap-2.5">
          {/* Bankrupt Button */}
          <button
            onClick={onBankrupt}
            className="py-3 px-3 sm:px-4 rounded-xl bg-slate-900 hover:bg-rose-950 border border-rose-900/60 text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="모든 구제를 포기하고 즉시 파산합니다"
          >
            <Skull className="w-4 h-4" />
            <span>파산 (기권)</span>
          </button>

          {/* Action Confirm Button */}
          <button
            onClick={handleConfirmAction}
            disabled={
              selectedAction === null ||
              (selectedAction === 'loan' && payer.hasUsedLoan) ||
              (selectedAction === 'sell' && !canAffordWithSell)
            }
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              (selectedAction === 'loan' && !payer.hasUsedLoan) || (selectedAction === 'sell' && canAffordWithSell)
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-600/30 border border-emerald-300'
                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            {selectedAction === 'loan' && (
              <>
                <CreditCard className="w-4 h-4" />
                <span>{debtAmount}만 원 대출 실행하기</span>
              </>
            )}
            {selectedAction === 'sell' && (
              <>
                <Store className="w-4 h-4" />
                <span>
                  {canAffordWithSell
                    ? `선택 도시 매각 후 ${debtAmount}만 지불`
                    : `매각액 부족 (+${totalRecoveredMoney}/${debtAmount - payer.money}만)`}
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
