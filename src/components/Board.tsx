import React from 'react';
import { SpaceData, CellState, Player } from '../types';
import { TileCell } from './TileCell';
import { DiceRoller } from './DiceRoller';
import { Sparkles, Key, Rocket } from 'lucide-react';

interface BoardProps {
  spaces: SpaceData[];
  cells: Record<number, CellState>;
  players: Player[];
  activePlayerIndex: number;
  onRollDice: (d1: number, d2: number) => void;
  isRolling: boolean;
  isDiceDisabled: boolean;
  lastDice: [number, number] | null;
  isDouble: boolean;
  highlightedCellId: number | null;
  onCellClick?: (spaceId: number) => void;
  isDestinationSelectionActive?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  spaces,
  cells,
  players,
  activePlayerIndex,
  onRollDice,
  isRolling,
  isDiceDisabled,
  lastDice,
  isDouble,
  highlightedCellId,
  onCellClick,
  isDestinationSelectionActive
}) => {
  const activePlayer = players[activePlayerIndex] || players[0];

  return (
    <div className="relative w-full aspect-square max-w-[720px] mx-auto p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-[#1b3815] via-[#244b1c] to-[#162f11] border-4 border-[#3e6b2f] shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(0,0,0,0.5)] select-none">
      {/* Brass / Gold Corner Brackets for authentic physical board look */}
      <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-amber-300/80 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-amber-300/80 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-amber-300/80 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-amber-300/80 rounded-br-sm pointer-events-none" />

      {/* 11x11 Grid Board */}
      <div className="w-full h-full grid grid-cols-11 grid-rows-11 gap-[1.5px] sm:gap-[2px] relative rounded-xl overflow-hidden bg-[#24451a] border border-[#3b682b]">
        {/* Render the 40 perimeter tiles */}
        {spaces.map((space) => {
          const cellState = cells[space.id] || {
            owner: null,
            buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
            currentToll: 0
          };

          return (
            <TileCell
              key={space.id}
              space={space}
              cellState={cellState}
              players={players}
              activePlayerId={activePlayer.id}
              highlighted={highlightedCellId === space.id}
              isDestinationSelectable={isDestinationSelectionActive && (space.type === 'city' || space.type === 'start')}
              onClick={() => onCellClick && onCellClick(space.id)}
            />
          );
        })}

        {/* 🌿 Center Board Canvas (행 2~10, 열 2~10) - 실제 부루마블 보드 중앙 연두색 필드 🌿 */}
        <div
          style={{
            gridRow: '2 / 11',
            gridColumn: '2 / 11'
          }}
          className="relative flex flex-col items-center justify-between p-2 sm:p-4 bg-[#8ebf63] rounded-lg border-2 border-[#689843] overflow-hidden shadow-inner"
        >
          {/* 부루마블 특유의 접이식 보드 종이 질감 & 세로 접힘선 */}
          <div className="absolute inset-0 bg-[radial-gradient(#97cc6b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black/10 shadow-xs pointer-events-none" />

          {/* 🌟 1. 상단 좌측: 클래식 [황금열쇠 놓는 곳] 은색 트레이 🌟 */}
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 -rotate-12 pointer-events-none opacity-85 hidden xs:block">
            <div className="w-24 sm:w-32 h-16 sm:h-20 rounded border-2 border-slate-400/90 bg-[#83b558]/80 p-1 flex flex-col items-center justify-center shadow-md relative">
              {/* 모서리 리벳 볼트 */}
              <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-slate-300 border border-slate-500 shadow-xs" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-slate-300 border border-slate-500 shadow-xs" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-slate-300 border border-slate-500 shadow-xs" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-slate-300 border border-slate-500 shadow-xs" />

              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm sm:text-base">🔑</span>
                <span className="text-[9px] sm:text-[11px] font-black text-amber-950 font-display">
                  황금열쇠 카드
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold text-amber-900/80 bg-amber-200/60 px-1 py-0.5 rounded">
                놓는 곳
              </span>
            </div>
          </div>

          {/* 🌟 2. 상단 우측: 클래식 [우주정거장 & 우주선 (콜롬비아호)] 일러스트 🌟 */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 rotate-6 pointer-events-none opacity-85 hidden xs:block">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-sky-600/60 flex items-center justify-center bg-sky-400/20 shadow-inner relative">
                <span className="text-2xl sm:text-3xl animate-pulse">🛸</span>
                <div className="absolute -top-1 -right-1 text-sm sm:text-base">🚀</div>
              </div>
              <span className="text-[8px] sm:text-[9px] font-black text-sky-950 font-display mt-0.5">
                우주정거장 콜롬비아
              </span>
            </div>
          </div>

          {/* 🌟 3. 중앙 정통 [부루마블 게임] 입체 로고 & 지구본 🌟 */}
          <div className="flex flex-col items-center text-center z-10 mt-1 sm:mt-2">
            {/* 지구본 (Earth Globe) */}
            <div className="relative mb-[-12px] sm:mb-[-18px] z-10 flex items-center justify-center">
              <div className="w-12 h-12 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full border-2 border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.35)] overflow-hidden flex items-center justify-center bg-sky-500">
                <span className="text-2xl sm:text-4xl md:text-5xl animate-spin" style={{ animationDuration: '40s' }}>
                  🌍
                </span>
              </div>
            </div>

            {/* 정통 3D 부루마블 게임 타이포그래피 (Blue 3D Layered Font) */}
            <div className="relative z-20">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-display text-[#00b4d8] tracking-tight leading-none drop-shadow-[0_3px_0_#0077b6] [text-shadow:_0_2px_0_#023e8a,_0_4px_0_#03045e,_0_6px_8px_rgba(0,0,0,0.5)]">
                부루마블
              </h1>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-lg sm:text-2xl md:text-3xl font-black font-display text-[#48cae4] drop-shadow-[0_2px_0_#0077b6]">
                  게임
                </span>
                <span className="text-[8px] sm:text-[10px] md:text-[11px] font-black text-sky-950 tracking-wider bg-white/70 px-1.5 py-0.5 rounded shadow-xs">
                  BLUE MARBLE GAME
                </span>
              </div>
            </div>
          </div>

          {/* 🌟 4. 중앙 주사위 롤러 컨트롤 스테이지 🌟 */}
          <div className="w-full max-w-xs z-20 my-auto">
            <DiceRoller
              onRoll={onRollDice}
              isRolling={isRolling}
              disabled={isDiceDisabled}
              currentTurnPlayerName={activePlayer.name}
              isAI={activePlayer.isAI}
              lastDice={lastDice}
              isDouble={isDouble}
            />
          </div>

          {/* 🌟 5. 하단 턴 안내 배너 🌟 */}
          <div className="w-full text-center z-10 bg-emerald-950/85 py-1.5 px-3 rounded-xl border border-emerald-500/40 text-[11px] sm:text-xs flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: activePlayer.color }} />
              <span className="font-display text-sm" style={{ color: activePlayer.color }}>{activePlayer.name}</span>
              <span className="text-slate-200">차례</span>
            </div>

            <span className="text-emerald-200 font-num font-semibold">
              {activePlayer.isAI ? '🤖 컴퓨터 연산 중...' : '🎲 주사위를 굴려주세요!'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
