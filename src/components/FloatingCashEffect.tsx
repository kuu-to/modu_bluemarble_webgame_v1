import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FloatingEffect } from '../types';

interface FloatingCashEffectProps {
  effects: FloatingEffect[];
}

export const FloatingCashEffect: React.FC<FloatingCashEffectProps> = ({ effects }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {effects.map((fx) => (
          <motion.div
            key={fx.id}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.3, 1.1, 0.9], y: -80 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            style={{
              left: `${fx.x}%`,
              top: `${fx.y}%`
            }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 font-display font-black text-xl sm:text-2xl px-4 py-1.5 rounded-full shadow-2xl border-2 flex items-center gap-1.5 ${
              fx.isPositive
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.7)]'
                : 'bg-gradient-to-r from-rose-600 to-red-700 text-white border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.7)]'
            }`}
          >
            <span>{fx.isPositive ? '💰 +' : '💸 -'}</span>
            <span className="font-num">{Math.abs(fx.amount)}만 원</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
