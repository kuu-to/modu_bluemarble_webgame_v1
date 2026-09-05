import React from 'react';
import { motion } from 'motion/react';
import { SpaceData, CellState, Player } from '../types';
import { calculateSpaceValue } from '../data/boardData';
import { AlertTriangle, Coins, Building, ArrowRight, ShieldCheck, Sparkles, Ticket } from 'lucide-react';
import { CountryFlag, CITY_COUNTRY_CODES } from './CountryFlag';

interface TollModalProps {
  space: SpaceData;
  cellState: CellState;
  payer: Player;
  owner: Player;
  onPayToll: () => void;
  onTakeover: (takeoverCost: number) => void;
  onUseFreePass?: () => void;
  onFreePassAndTakeover?: (takeoverCost: number) => void;
}

export const TollModal: React.FC<TollModalProps> = ({
  space,
  cellState,
  payer,
  owner,
  onPayToll,
  onTakeover,
  onUseFreePass,
  onFreePassAndTakeover
}) => {
  const toll = cellState.currentToll;
  const isLandmark = cellState.buildings.isLandmark;
  const hasFreePass = (payer.freePassCards || 0) > 0;

  // Takeover cost = 2x space value
  const spaceValue = calculateSpaceValue(space, cellState.buildings);
  const takeoverCost = spaceValue * 2;
  const canTakeover = !isLandmark && payer.money >= (toll + takeoverCost);
  const canFreePassTakeover = !isLandmark && hasFreePass && payer.money >= takeoverCost;
  const canPayToll = payer.money >= toll;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 30 }}
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-[#180f24] to-slate-950 rounded-2xl border-2 border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.3)] overflow-hidden text-slate-100"
      >
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-800 p-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <AlertTriangle className="w-6 h-6 text-yellow-300 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-200">
                상대방 도시 도착
              </div>
              <h2 className="text-xl font-black font-display drop-shadow">
                통행료 지불 경고!
              </h2>
            </div>
          </div>

          {CITY_COUNTRY_CODES[space.id] ? (
            <div className="p-1.5 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center shadow-md">
              <CountryFlag spaceId={space.id} size="lg" />
            </div>
          ) : (
            <span className="text-3xl">{space.icon}</span>
          )}
        </div>

        {/* Details Content */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">방문 도시</div>
              <div className="text-lg font-bold text-slate-200">{space.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">소유자: <span className="font-bold text-cyan-400">{owner.name}</span></div>
            </div>
            <div className="text-right">
              <div className="text-xs text-rose-300 font-semibold">지불할 통행료</div>
              <div className="text-3xl font-black text-rose-400 font-num">
                {toll}만 원
              </div>
            </div>
          </div>

          {/* Player balance after toll */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-400">
            <span>{payer.name} 보유 잔액: <strong className="text-amber-400 font-num">{payer.money}만 원</strong></span>
            <span>지불 후 잔액: <strong className={`font-num ${payer.money - toll < 0 ? 'text-red-500' : 'text-slate-200'}`}>{payer.money - toll}만 원</strong></span>
          </div>

          {/* Free Pass Card (상대 땅 1회 무료 통과권) Banner */}
          {hasFreePass && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-purple-950/70 border-2 border-purple-500/60 flex items-center justify-between shadow-lg shadow-purple-900/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-200">
                    상대 땅 1회 무료 통과권 보유
                  </div>
                  <div className="text-[11px] text-purple-300/80 font-num">
                    잔여: <strong>{payer.freePassCards}장</strong> (통행료 전액 면제)
                  </div>
                </div>
              </div>

              {onUseFreePass && (
                <button
                  type="button"
                  onClick={onUseFreePass}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-display font-bold text-xs sm:text-sm shadow-md border border-purple-300 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>통과권 사용 (0원)</span>
                </button>
              )}
            </div>
          )}

          {/* Landmark Defense or Takeover Option */}
          {isLandmark ? (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center gap-3 text-amber-200 text-xs">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>👑 <strong>랜드마크 독점:</strong> 상대방의 랜드마크 도시는 인수가 불가능합니다.</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-cyan-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  도시 인수 (Takeover) 기회
                </span>
                <span className="text-xs text-amber-400 font-num font-bold">인수비용: {takeoverCost}만 원</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                통행료를 지불한 후 토지와 건물 가치의 2배를 지불하여 상대방의 도시를 즉시 내 소유로 빼앗을 수 있습니다!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex gap-3">
          <button
            id="pay-toll-button"
            onClick={onPayToll}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-display font-bold text-sm sm:text-base shadow-lg shadow-rose-600/30 border border-rose-400 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>통행료 {toll}만 지불</span>
          </button>

          {canTakeover && (
            <button
              id="takeover-button"
              onClick={() => onTakeover(takeoverCost)}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-display font-black text-sm sm:text-base shadow-lg shadow-amber-500/30 border border-amber-200 glow-gold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>도시 인수 ({takeoverCost}만)</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
