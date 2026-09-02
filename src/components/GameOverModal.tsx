import React from 'react';
import { motion } from 'motion/react';
import { Player } from '../types';
import { AirplanePiece } from './AirplanePiece';
import { Trophy, Crown, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  winner: Player;
  rankings: Player[];
  reason: string;
  onRestart: () => void;
  onExitToLobby?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  rankings,
  reason,
  onRestart,
  onExitToLobby
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.7, opacity: 0 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#1c1809] via-[#0d1633] to-slate-950 rounded-3xl border-2 border-amber-400 shadow-[0_0_80px_rgba(251,191,36,0.4)] overflow-hidden text-slate-100"
      >
        {/* Victory Ribbon Header */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-5 sm:p-6 text-slate-950 text-center relative overflow-hidden">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-slate-950 text-amber-400 flex items-center justify-center mb-2 shadow-2xl border-2 border-amber-300"
          >
            <Trophy className="w-8 h-8 sm:w-9 sm:h-9 animate-bounce" />
          </motion.div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            승리 축하합니다!
          </h2>
          <p className="text-xs font-bold text-amber-950 uppercase tracking-wider mt-0.5">
            {reason}
          </p>
        </div>

        {/* Winner Highlight */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-900 border border-amber-400/40 text-center relative">
            <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow">
              <Crown className="w-3 h-3" /> 최종 우승자
            </div>

            <div className="my-2">
              <AirplanePiece colorId={winner.airplaneColor || 'red'} size="xl" animate={true} />
            </div>
            <div className="text-2xl font-bold text-white">{winner.name}</div>
            <div className="text-xs text-amber-300 mt-1">
              최종 총자산: <strong className="text-lg font-bold font-num text-amber-400">{winner.totalAssets}만 원</strong>
            </div>
          </div>

          {/* Leaderboard Rankings */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>최종 순위표</span>
              <span className="text-[10px] text-slate-500">총 자산 기준</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {rankings.map((p, index) => {
                const isWinner = p.id === winner.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      isWinner
                        ? 'bg-amber-500/10 border-amber-400/50 text-amber-200 font-bold'
                        : p.isBankrupt
                        ? 'bg-rose-950/20 border-rose-900/40 text-slate-400 opacity-70'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        index === 0 ? 'bg-amber-400 text-slate-950' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {index + 1}
                      </span>
                      <AirplanePiece colorId={p.airplaneColor || 'red'} size="xs" />
                      <span className="font-semibold">{p.name}</span>
                      {p.isBankrupt && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-300 border border-rose-600">
                          파산
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-num">
                      <span className="text-slate-400">도시 {p.ownedCityCount}개</span>
                      <span className={`font-bold ${isWinner ? 'text-amber-300' : 'text-slate-200'}`}>
                        {p.totalAssets}만 원
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
          {onExitToLobby && (
            <button
              onClick={onExitToLobby}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>시작 화면으로 이동</span>
            </button>
          )}

          <button
            id="restart-game-button"
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-lg border border-amber-200 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>이 설정으로 다시하기</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
