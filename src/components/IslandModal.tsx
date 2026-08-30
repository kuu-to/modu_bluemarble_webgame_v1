import React from 'react';
import { motion } from 'motion/react';
import { Player } from '../types';
import { Compass, Dices, Coins, ShieldAlert } from 'lucide-react';

interface IslandModalProps {
  player: Player;
  onPayEscapeFee: () => void;
  onUseEscapeCard: () => void;
  onTryDouble: () => void;
}

export const IslandModal: React.FC<IslandModalProps> = ({
  player,
  onPayEscapeFee,
  onUseEscapeCard,
  onTryDouble
}) => {
  const canPayFee = player.money >= 20;
  const hasCard = player.hasIslandEscapeCard > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-md bg-gradient-to-b from-[#061b14] via-[#091e28] to-slate-950 rounded-2xl border-2 border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.3)] overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏝️</span>
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                ISLAND TRAPPED
              </div>
              <h2 className="text-xl font-black font-display">
                무인도 표류 중 ({player.islandTurnsLeft}턴 남음)
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3.5">
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            무인도에 갇혔습니다! 탈출하려면 주사위 더블을 굴리거나, 탈출비 20만 원을 지불하거나, 황금열쇠 탈출권을 사용할 수 있습니다.
          </p>

          {/* Option 1: Roll Double */}
          <button
            onClick={onTryDouble}
            className="w-full p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 flex items-center justify-between transition-all cursor-pointer hover:border-emerald-400 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30">
                <Dices className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-200">주사위 더블 굴려 탈출 시도</div>
                <div className="text-xs text-slate-400">같은 숫자가 나오면 즉시 탈출</div>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-bold">무료 시도</span>
          </button>

          {/* Option 2: Pay fee */}
          <button
            onClick={onPayEscapeFee}
            disabled={!canPayFee}
            className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all ${
              canPayFee
                ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/50 cursor-pointer'
                : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-200">탈출 보석금 지불 (20만 원)</div>
                <div className="text-xs text-slate-400">즉시 탈출 후 다음 턴부터 주사위 이동</div>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-bold font-num">20만 원</span>
          </button>

          {/* Option 3: Use Escape Card */}
          {hasCard && (
            <button
              onClick={onUseEscapeCard}
              className="w-full p-3.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/60 flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-purple-200">무인도 탈출권 사용</div>
                  <div className="text-xs text-slate-400">보유 수량: {player.hasIslandEscapeCard}장</div>
                </div>
              </div>
              <span className="text-xs text-purple-300 font-bold">카드 사용</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
