import React from 'react';
import { motion } from 'motion/react';
import { GoldenKeyCard } from '../types';
import { Sparkles, Key, CheckCircle } from 'lucide-react';

interface GoldenKeyModalProps {
  card: GoldenKeyCard;
  onConfirm: () => void;
}

export const GoldenKeyModal: React.FC<GoldenKeyModalProps> = ({ card, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ rotateY: 90, scale: 0.7, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        exit={{ rotateY: -90, scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 180 }}
        className="w-full max-w-sm bg-gradient-to-b from-[#241a05] via-[#1a1408] to-slate-950 rounded-2xl border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)] overflow-hidden text-slate-100 glow-gold"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 p-4 text-slate-950 text-center relative overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none"
          />
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Key className="w-5 h-5 text-slate-950" />
            <span className="font-display font-black text-sm tracking-widest uppercase">
              GOLDEN KEY
            </span>
          </div>
          <h2 className="text-2xl font-black font-display drop-shadow-sm">
            황금열쇠 찬스!
          </h2>
        </div>

        {/* Card Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 p-1 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 border-2 border-amber-300"
          >
            {card.icon}
          </motion.div>

          <div>
            <div className="text-xs text-amber-400 font-bold tracking-wide uppercase mb-1">
              {card.subtitle}
            </div>
            <h3 className="text-xl font-black text-white font-display mb-2">
              {card.title}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed px-2 bg-slate-900/60 p-3 rounded-xl border border-amber-500/20">
              {card.description}
            </p>
          </div>

          {card.amount && (
            <div className={`text-xl font-black font-num ${
              card.type === 'money_loss' || card.type === 'donation' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {card.type === 'money_loss' || card.type === 'donation' ? '-' : '+'}{card.amount}만 원
            </div>
          )}
        </div>

        {/* Button */}
        <div className="p-4 bg-slate-950/80 border-t border-amber-500/30">
          <button
            id="golden-key-confirm-button"
            onClick={onConfirm}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-display font-black text-base shadow-lg shadow-amber-500/30 border border-amber-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>카드 효과 적용하기</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
