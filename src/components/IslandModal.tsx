import React from 'react';
import { motion } from 'motion/react';
import { Player } from '../types';
import { Compass, Dices, Coins, ShieldCheck, Sparkles, AlertCircle, X } from 'lucide-react';

interface IslandModalProps {
  player: Player;
  onPayEscapeFee: () => void;
  onUseEscapeCard: () => void;
  onTryDouble: () => void;
  onClose?: () => void;
}

export const IslandModal: React.FC<IslandModalProps> = ({
  player,
  onPayEscapeFee,
  onUseEscapeCard,
  onTryDouble,
  onClose
}) => {
  const canPayFee = player.money >= 20;
  const hasCard = player.hasIslandEscapeCard > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#071d15] via-[#0b1f28] to-slate-950 rounded-3xl border-2 border-emerald-500/60 shadow-[0_0_50px_rgba(16,185,129,0.35)] overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-emerald-400/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl shadow-inner">
              🏝️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  ISLAND RESCUE
                </span>
                <span className="text-xs text-emerald-100/80">격리 {player.islandTurnsLeft}턴 남음</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-display mt-0.5">
                무인도 조난 탈출 작전
              </h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-emerald-200/80 font-semibold">보유 현금</div>
            <div className="text-base sm:text-lg font-black text-amber-300 font-num">
              {player.money}만 원
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/20 text-xs text-slate-300 flex items-center gap-2.5">
            <span className="text-xl shrink-0">🛶</span>
            <p className="leading-relaxed">
              <strong className="text-white">[{player.name}]</strong>님은 현재 무인도에 표류 중입니다.
              보관 중인 <strong>탈출권 사용</strong>, <strong>보석금 지불</strong>, 또는 <strong>더블 주사위 시도</strong> 중 원하는 탈출 방식을 선택하세요!
            </p>
          </div>

          {/* Option 1: Use Escape Card (Top Priority if owned) */}
          <button
            type="button"
            onClick={onUseEscapeCard}
            disabled={!hasCard}
            className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center justify-between group ${
              hasCard
                ? 'bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-purple-900/80 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:border-purple-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ring-1 ring-purple-400/60'
                : 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed text-slate-500'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl border ${
                hasCard ? 'bg-purple-500/20 border-purple-400/40 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm sm:text-base ${hasCard ? 'text-white' : 'text-slate-400'}`}>
                    🛶 무인도 탈출권 사용 (보관 아이템)
                  </span>
                  {hasCard && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500 text-slate-950 flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      강력 추천
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {hasCard
                    ? `보유 중인 탈출권 1장을 소모하여 즉시 무료 탈출 (보유: ${player.hasIslandEscapeCard}장)`
                    : '보유한 탈출권이 없습니다. (황금열쇠 칸에서 획득 가능)'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                hasCard
                  ? 'bg-purple-500/30 text-purple-200 border-purple-400/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}>
                {hasCard ? `${player.hasIslandEscapeCard}장 보유` : '미보유'}
              </span>
            </div>
          </button>

          {/* Option 2: Pay Bail Fee */}
          <button
            type="button"
            onClick={onPayEscapeFee}
            disabled={!canPayFee}
            className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
              canPayFee
                ? 'bg-slate-900/90 hover:bg-slate-850 border-amber-500/40 hover:border-amber-400 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                : 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed text-slate-500'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base text-white">
                  💰 탈출 보석금 지불 (20만 원)
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  현금 20만 원을 납부하고 즉시 무인도를 탈출합니다.
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-sm font-black font-num ${canPayFee ? 'text-amber-400' : 'text-slate-500'}`}>
                20만 원
              </span>
              <div className="text-[10px] text-slate-400">
                {canPayFee ? `지불 후: ${player.money - 20}만` : '현금 부족'}
              </div>
            </div>
          </button>

          {/* Option 3: Roll Double */}
          <button
            type="button"
            onClick={onTryDouble}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 hover:from-emerald-900/70 hover:to-teal-900/70 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 group-hover:scale-110 transition-transform">
                <Dices className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>🎲 주사위 더블 굴려 탈출 시도</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    무료
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  주사위 2개가 같은 눈(더블)이 나오면 즉시 탈출하여 주사위 눈만큼 전진! (실패 시 1턴 대기)
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-300">
                주사위 굴리기 ➔
              </span>
            </div>
          </button>
        </div>

        {/* Footer */}
        {onClose && (
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * 탈출 성공 시 즉시 주사위를 굴려 이동합니다.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>닫기</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
