import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import { AirplanePiece } from './AirplanePiece';
import { Sparkles, Zap, Crown } from 'lucide-react';

interface TurnTransitionBannerProps {
  player: Player;
  turnCount: number;
  visible: boolean;
}

export const TurnTransitionBanner: React.FC<TurnTransitionBannerProps> = ({
  player,
  turnCount,
  visible
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -20 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div
            className="px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border-2 backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${player.color}ee 0%, #0f172a 100%)`,
              borderColor: player.secondaryColor || '#60a5fa',
              boxShadow: `0 0 25px ${player.color}aa, 0 10px 30px rgba(0,0,0,0.8)`
            }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="flex items-center justify-center p-1 bg-black/20 rounded-full"
            >
              <AirplanePiece colorId={player.airplaneColor || 'red'} size="lg" />
            </motion.div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-200/90 leading-none">
                ROUND TURN • {player.isAI ? 'AI 대전' : '플레이어'}
              </span>
              <div className="text-base sm:text-lg font-black font-display text-white drop-shadow flex items-center gap-1.5">
                <span>{player.name} 차례입니다!</span>
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
