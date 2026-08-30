import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BoardBroadcastMessage } from '../types';
import { Sparkles, AlertTriangle, Building2, Coins, Key, Rocket, Palmtree, ArrowRight } from 'lucide-react';

interface BoardBroadcastHUDProps {
  broadcast: BoardBroadcastMessage | null;
  activePlayerName: string;
  activePlayerColor: string;
  isAI: boolean;
}

export const BoardBroadcastHUD: React.FC<BoardBroadcastHUDProps> = ({
  broadcast,
  activePlayerName,
  activePlayerColor,
  isAI
}) => {
  // Category-specific color schemes and styles
  const getCategoryStyles = (category?: string) => {
    switch (category) {
      case 'toll_due':
      case 'toll_paid':
      case 'tax':
      case 'bankrupt':
        return {
          bg: 'bg-gradient-to-r from-rose-950/95 via-rose-900/90 to-red-950/95',
          border: 'border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.4)]',
          badgeBg: 'bg-rose-500 text-white',
          titleColor: 'text-rose-200',
          textColor: 'text-rose-100',
          icon: <Coins className="w-4 h-4 text-rose-300 animate-pulse" />
        };
      case 'purchase':
      case 'takeover':
      case 'salary':
      case 'fund':
        return {
          bg: 'bg-gradient-to-r from-emerald-950/95 via-teal-900/90 to-emerald-950/95',
          border: 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
          badgeBg: 'bg-emerald-500 text-slate-950 font-bold',
          titleColor: 'text-emerald-200',
          textColor: 'text-emerald-100',
          icon: <Building2 className="w-4 h-4 text-emerald-300" />
        };
      case 'golden_key':
        return {
          bg: 'bg-gradient-to-r from-amber-950/95 via-yellow-900/90 to-amber-950/95',
          border: 'border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.45)]',
          badgeBg: 'bg-amber-400 text-slate-950 font-black',
          titleColor: 'text-amber-200',
          textColor: 'text-amber-100',
          icon: <Key className="w-4 h-4 text-amber-300 animate-bounce" />
        };
      case 'space_travel':
        return {
          bg: 'bg-gradient-to-r from-indigo-950/95 via-purple-900/90 to-indigo-950/95',
          border: 'border-purple-400/90 shadow-[0_0_25px_rgba(168,85,247,0.4)]',
          badgeBg: 'bg-purple-500 text-white font-bold',
          titleColor: 'text-purple-200',
          textColor: 'text-purple-100',
          icon: <Rocket className="w-4 h-4 text-purple-300 animate-pulse" />
        };
      case 'island':
        return {
          bg: 'bg-gradient-to-r from-sky-950/95 via-blue-900/90 to-sky-950/95',
          border: 'border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.4)]',
          badgeBg: 'bg-sky-500 text-slate-950 font-bold',
          titleColor: 'text-sky-200',
          textColor: 'text-sky-100',
          icon: <Palmtree className="w-4 h-4 text-sky-300" />
        };
      case 'arrive':
        return {
          bg: 'bg-gradient-to-r from-slate-950/95 via-cyan-950/90 to-slate-950/95',
          border: 'border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.35)]',
          badgeBg: 'bg-cyan-500 text-slate-950 font-bold',
          titleColor: 'text-cyan-200',
          textColor: 'text-slate-200',
          icon: <ArrowRight className="w-4 h-4 text-cyan-300" />
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95',
          border: 'border-emerald-500/50 shadow-[0_0_15px_rgba(0,0,0,0.5)]',
          badgeBg: 'bg-emerald-600 text-white',
          titleColor: 'text-slate-100',
          textColor: 'text-slate-300',
          icon: <Sparkles className="w-4 h-4 text-amber-300" />
        };
    }
  };

  const style = getCategoryStyles(broadcast?.category);

  return (
    <div className="w-full max-w-[360px] sm:max-w-[460px] mx-auto min-h-[62px] sm:min-h-[72px] flex items-center justify-center relative z-30">
      <AnimatePresence mode="wait">
        {broadcast ? (
          <motion.div
            key={broadcast.id}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`w-full py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl backdrop-blur-md border ${style.border} ${style.bg} flex flex-col justify-center relative overflow-hidden shadow-lg`}
          >
            {/* Top row: Actor Badge + Category Badge */}
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span
                  className="w-2 h-2 rounded-full shrink-0 animate-ping"
                  style={{ backgroundColor: broadcast.playerColor }}
                />
                <span
                  className="font-bold text-[11px] sm:text-xs truncate max-w-[140px] sm:max-w-[180px]"
                  style={{ color: broadcast.playerColor }}
                >
                  {broadcast.isAI ? `🤖 ${broadcast.playerName} (AI)` : `👤 ${broadcast.playerName}`}
                </span>
              </div>

              {broadcast.badge && (
                <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded font-black tracking-tight shrink-0 shadow-xs ${style.badgeBg}`}>
                  {broadcast.badge}
                </span>
              )}
            </div>

            {/* Middle row: Action Title */}
            <div className="flex items-center gap-1.5">
              {style.icon}
              <h4 className={`text-xs sm:text-sm font-black font-display tracking-tight leading-snug drop-shadow-xs break-keep ${style.titleColor}`}>
                {broadcast.title}
              </h4>
            </div>

            {/* Bottom row: Detailed subtext */}
            {broadcast.detail && (
              <p className={`text-[10.5px] sm:text-[11.5px] font-medium leading-normal mt-0.5 pl-5.5 break-keep ${style.textColor}`}>
                {broadcast.detail}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/80 flex items-center justify-between text-slate-300 text-xs shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePlayerColor }} />
              <span className="font-bold" style={{ color: activePlayerColor }}>
                {isAI ? `🤖 ${activePlayerName} (AI)` : `👤 ${activePlayerName}`}
              </span>
              <span className="text-slate-400">차례</span>
            </div>
            <span className="text-emerald-300 font-semibold text-[11px]">
              {isAI ? '컴퓨터 차례 진행 중...' : '🎲 주사위를 굴려주세요'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
