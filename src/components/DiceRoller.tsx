import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Sparkles, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface DiceRollerProps {
  onRoll: (d1: number, d2: number) => void;
  isRolling: boolean;
  disabled: boolean;
  currentTurnPlayerName: string;
  isAI: boolean;
  lastDice: [number, number] | null;
  isDouble: boolean;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  onRoll,
  isRolling,
  disabled,
  currentTurnPlayerName,
  isAI,
  lastDice,
  isDouble
}) => {
  const [animDice, setAnimDice] = useState<[number, number]>([1, 1]);

  const triggerRoll = () => {
    if (disabled || isRolling) return;

    soundManager.playDiceRoll();

    // Roll random numbers
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    // Simulate tumbling dice ticks
    let count = 0;
    const interval = setInterval(() => {
      setAnimDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setAnimDice([d1, d2]);
        onRoll(d1, d2);
      }
    }, 70);
  };

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
      <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 sm:w-12 sm:h-12 p-1.5 bg-gradient-to-br from-white via-slate-50 to-slate-200 rounded-xl shadow-[0_6px_15px_rgba(0,0,0,0.4),inset_0_2px_2px_rgba(255,255,255,1)] border-2 border-slate-300">
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

  const displayDice = isRolling ? animDice : lastDice || [3, 4];
  const diceSum = displayDice[0] + displayDice[1];

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

      {/* Dice Visual Showcase */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 my-1">
        <motion.div
          animate={isRolling ? { rotateX: [0, 360, 720], rotateY: [0, 360, 720], scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {renderDiceFace(displayDice[0])}
        </motion.div>

        <span className="text-xl font-bold text-emerald-300 font-num">+</span>

        <motion.div
          animate={isRolling ? { rotateX: [0, -360, -720], rotateY: [0, -360, -720], scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {renderDiceFace(displayDice[1])}
        </motion.div>

        <div className="flex flex-col items-center justify-center ml-1">
          <span className="text-[10px] text-emerald-300 font-bold">합계</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 font-num leading-none drop-shadow-md">
            {diceSum}
          </span>
        </div>
      </div>

      {/* Roll Trigger Button */}
      <div className="w-full mt-1.5">
        {isAI ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 border border-slate-700 text-center text-slate-300 text-xs font-semibold flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{currentTurnPlayerName} (AI) 주사위 생각 중...</span>
          </div>
        ) : (
          <button
            id="roll-dice-button"
            onClick={triggerRoll}
            disabled={disabled || isRolling}
            className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-display text-sm sm:text-base font-black flex items-center justify-center gap-2 transition-all transform duration-150 ${
              disabled || isRolling
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-yellow-300'
            }`}
          >
            <Dices className="w-5 h-5 animate-pulse text-slate-950" />
            <span>{isRolling ? '주사위 굴리는 중...' : '주사위 굴리기 (ROLL)'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
