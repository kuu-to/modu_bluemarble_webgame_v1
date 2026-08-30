import React from 'react';
import { motion } from 'motion/react';
import { SpaceData, CellState, Player } from '../types';
import { Rocket, MapPin, Sparkles } from 'lucide-react';
import { CountryFlag, CITY_COUNTRY_CODES } from './CountryFlag';

interface SpaceTravelModalProps {
  spaces: SpaceData[];
  cells: Record<number, CellState>;
  player: Player;
  onSelectDestination: (destPos: number) => void;
}

export const SpaceTravelModal: React.FC<SpaceTravelModalProps> = ({
  spaces,
  cells,
  player,
  onSelectDestination
}) => {
  // Filter selectable spots (cities and start)
  const selectableSpaces = spaces.filter(s => s.type === 'city' || s.type === 'start');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-xl max-h-[85vh] bg-gradient-to-b from-[#130924] via-[#0d1530] to-slate-950 rounded-2xl border-2 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.35)] overflow-hidden text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 p-4 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Rocket className="w-6 h-6 text-purple-200 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-purple-200 uppercase tracking-widest font-semibold">
                WARP DRIVE ACTIVATED
              </div>
              <h2 className="text-xl font-black font-display">
                🛸 우주여행 목적지 선택
              </h2>
            </div>
          </div>
          <span className="text-xs bg-purple-950/60 border border-purple-400/40 px-3 py-1 rounded-full font-bold text-purple-300">
            {player.name}
          </span>
        </div>

        <div className="p-3 bg-purple-950/40 border-b border-purple-500/20 text-xs text-purple-200 text-center">
          워프하고 싶은 도시 또는 출발점을 선택하세요. 즉시 이동하여 건물을 짓거나 효과를 발동합니다!
        </div>

        {/* City list grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {selectableSpaces.map((space) => {
            const cell = cells[space.id];
            const isOwned = cell && cell.owner !== null;
            const isMine = cell && cell.owner === player.id;

            return (
              <div
                key={space.id}
                onClick={() => onSelectDestination(space.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isMine
                    ? 'bg-blue-950/40 border-blue-500/60 hover:bg-blue-900/60'
                    : isOwned
                    ? 'bg-rose-950/40 border-rose-500/60 hover:bg-rose-900/60'
                    : 'bg-slate-900/80 border-slate-700 hover:border-purple-400 hover:bg-purple-950/40 hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  {CITY_COUNTRY_CODES[space.id] ? (
                    <CountryFlag spaceId={space.id} size="md" />
                  ) : (
                    <span className="text-xl">{space.icon}</span>
                  )}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                    backgroundColor: space.colorHex ? `${space.colorHex}33` : '#334155',
                    color: space.colorHex || '#94a3b8'
                  }}>
                    {isMine ? '내 도시' : isOwned ? '상대 도시' : '빈 토지'}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-sm text-slate-100">{space.name}</div>
                  <div className="text-xs text-slate-400 font-num">
                    {space.price ? `${space.price}만 원` : '월급 +20만'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
