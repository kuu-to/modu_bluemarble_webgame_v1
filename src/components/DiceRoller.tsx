import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Sparkles, Zap, Compass, AlertTriangle } from 'lucide-react';
import { GameSpeed } from '../types';

interface DiceRollerProps {
  onRoll: () => void;
  isRolling: boolean;
  isTumbling: boolean;
  disabled: boolean;
  currentTurnPlayerName: string;
  isAI: boolean;
  currentDice: [number, number];
  isDouble: boolean;
  gameSpeed?: GameSpeed;
  islandTurnsLeft?: number;
  hasIslandEscapeCard?: number;
  onOpenIslandModal?: () => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  onRoll,
  isRolling,
  isTumbling,
  disabled,
  currentTurnPlayerName,
  isAI,
  currentDice,
  isDouble,
  islandTurnsLeft = 0,
  hasIslandEscapeCard = 0,
  onOpenIslandModal
}) => {
  const renderDiceFace = (val: number) => {
    const dotPositions: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };

    const activeDots = dotPositions[val] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-11 h-11 sm:w-13 sm:h-13 p-1.5 bg-gradient-to-br from-white via-slate-50 to-slate-200 rounded-xl shadow-[0_6px_16px_rgba(0,0,0,0.45),inset_0_2px_2px_rgba(255,255,255,1)] border-2 border-slate-300">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <div key={idx} className="flex items-center justify-center">
            {activeDots.includes(idx) && (
              <div
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-inner ${
                  val === 1 && idx === 4 ? 'bg-rose-600 ring-2 ring-rose-300' : 'bg-slate-900'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const diceSum = currentDice[0] + currentDice[1];
  const isTrappedInIsland = islandTurnsLeft > 0;

  return (
    <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 shadow-xl relative">
      {/* Double Bonus Notification */}
      <AnimatePresence>
        {isDouble && !isRolling && (
          <motion.div
            initial={{ scale: 0, y: -10, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute -top-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-display font-black px-3 py-0.5 rounded-full text-xs shadow-lg flex items-center gap-1 border border-amber-200 z-30"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>DOUBLE! 한번 더 굴리기</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trapped in Island Alert Banner */}
      {isTrappedInIsland && !isRolling && !isAI && (
        <div className="w-full mb-1.5 p-1.5 rounded-xl bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-purple-950/90 border border-emerald-400/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-200 font-bold">
            <span>🏝️</span>
            <span>무인도 조난 ({islandTurnsLeft}턴)</span>
          </div>

          {onOpenIslandModal && (
            <button
              type="button"
              onClick={onOpenIslandModal}
              className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-[10.5px] shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Compass className="w-3 h-3" />
              <span>탈출 옵션 {hasIslandEscapeCard > 0 ? `(카드 ${hasIslandEscapeCard}장)` : ''}</span>
            </button>
          )}
        </div>
      )}

      {/* Dice Visual Showcase */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 my-1">
        <motion.div
          animate={
            isTumbling
              ? {
                  rotate: [0, 90, 180, 270, 360],
                  scale: [1, 1.18, 0.92, 1.15, 1],
                  y: [0, -14, -2, -10, 0]
                }
              : { rotate: 0, scale: 1, y: 0 }
          }
          transition={
            isTumbling
              ? { repeat: Infinity, duration: 0.32, ease: "linear" }
              : { duration: 0.25, ease: "easeOut" }
          }
        >
          {renderDiceFace(currentDice[0])}
        </motion.div>

        <span className="text-xl font-bold text-emerald-300 font-num">+</span>

        <motion.div
          animate={
            isTumbling
              ? {
                  rotate: [0, -90, -180, -270, -360],
                  scale: [1, 1.18, 0.92, 1.15, 1],
                  y: [0, -10, -14, -4, 0]
                }
              : { rotate: 0, scale: 1, y: 0 }
          }
          transition={
            isTumbling
              ? { repeat: Infinity, duration: 0.32, ease: "linear" }
              : { duration: 0.25, ease: "easeOut" }
          }
        >
          {renderDiceFace(currentDice[1])}
        </motion.div>

        <div className="flex flex-col items-center justify-center ml-1 min-w-[42px]">
          <span className="text-[10px] text-emerald-300 font-bold">합계</span>
          <motion.span
            key={diceSum}
            initial={{ scale: 1.3, color: '#f59e0b' }}
            animate={{ scale: 1, color: '#fbbf24' }}
            transition={{ duration: 0.2 }}
            className="text-2xl sm:text-3xl font-black text-amber-400 font-num leading-none drop-shadow-md"
          >
            {diceSum}
          </motion.span>
        </div>
      </div>

      {/* Roll Trigger Button */}
      <div className="w-full mt-1.5">
        {isAI ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 border border-slate-700 text-center text-slate-300 text-xs font-semibold flex items-center justify-center gap-2">
            <Zap className={`w-4 h-4 text-cyan-400 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? `${currentTurnPlayerName} 주사위 굴리는 중...` : `${currentTurnPlayerName} (AI) 주사위 생각 중...`}</span>
          </div>
        ) : (
          <button
            id="roll-dice-button"
            onClick={onRoll}
            disabled={disabled || isRolling}
            className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-display text-sm sm:text-base font-black flex items-center justify-center gap-2 transition-all transform duration-150 ${
              disabled || isRolling
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : isTrappedInIsland
                ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-emerald-300'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-yellow-300'
            }`}
          >
            <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : 'animate-pulse'} text-slate-950`} />
            <span>
              {isTumbling
                ? '주사위 굴리는 중...'
                : isRolling
                ? '이동 중...'
                : isTrappedInIsland
                ? '더블 탈출 주사위 굴리기 (ROLL)'
                : '주사위 굴리기 (ROLL)'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
