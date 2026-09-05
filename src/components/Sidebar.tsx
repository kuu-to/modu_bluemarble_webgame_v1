import React, { useRef, useEffect, useState } from 'react';
import { Player, GameLogEntry, GameModeConfig, GameSpeed } from '../types';
import { AirplanePiece } from './AirplanePiece';
import { 
  Users, 
  Bot, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  Coins, 
  ScrollText, 
  TrendingUp,
  LogOut,
  AlertCircle,
  Gauge,
  Clock,
  FastForward,
  Timer,
  CreditCard,
  Building
} from 'lucide-react';

interface SidebarProps {
  players: Player[];
  activePlayerIndex: number;
  gameLogs: GameLogEntry[];
  gameConfig: GameModeConfig;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExitToLobby: () => void;
  onChangeSpeed?: (speed: GameSpeed) => void;
  socialFund: number;
  currentTurnCount: number;
  remainingSeconds?: number | null; // Time limit countdown
  onRepayDebt?: (playerId: number) => void; // Optional debt repayment
}

export const Sidebar: React.FC<SidebarProps> = ({
  players,
  activePlayerIndex,
  gameLogs,
  gameConfig,
  soundEnabled,
  onToggleSound,
  onExitToLobby,
  onChangeSpeed,
  socialFund,
  currentTurnCount,
  remainingSeconds = null,
  onRepayDebt
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const currentSpeed: GameSpeed = gameConfig.speed || 'normal';

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameLogs]);

  // Mode badge label
  const getModeLabel = () => {
    if (gameConfig.humanCount === 2) {
      return gameConfig.aiCount === 0 ? '인간 2인 대전' : gameConfig.aiCount === 1 ? '인간 2인 + AI 1' : '인간 2인 + AI 2';
    }
    if (gameConfig.humanCount === 3) {
      return gameConfig.aiCount === 0 ? '인간 3인 대전' : '인간 3인 + AI 1';
    }
    return '인간 4인 대전';
  };

  const cycleSpeed = () => {
    if (!onChangeSpeed) return;
    const nextSpeed: Record<GameSpeed, GameSpeed> = {
      slow: 'normal',
      normal: 'fast',
      fast: 'slow'
    };
    onChangeSpeed(nextSpeed[currentSpeed]);
  };

  // Format time remaining MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-3 select-none">
      {/* Top Status & Controls Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl glass-panel border border-slate-800">
        {/* Match Info & In-game Speed Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 shadow-xs">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{getModeLabel()}</span>
          </div>

          {/* Speed Toggle Button */}
          {onChangeSpeed && (
            <button
              onClick={cycleSpeed}
              className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                currentSpeed === 'slow'
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                  : currentSpeed === 'normal'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
              }`}
              title="게임 속도 변경 (클릭하여 전환)"
            >
              {currentSpeed === 'slow' && <Clock className="w-3 h-3 text-amber-400" />}
              {currentSpeed === 'normal' && <Gauge className="w-3 h-3 text-emerald-400" />}
              {currentSpeed === 'fast' && <FastForward className="w-3 h-3 text-cyan-400" />}
              <span>{currentSpeed === 'slow' ? '느림' : currentSpeed === 'normal' ? '보통' : '빠름'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800/80 border-slate-700 text-emerald-400 hover:text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Safe Exit to Lobby with Confirmation */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="게임 종료 후 시작 화면으로"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>나가기</span>
          </button>
        </div>
      </div>

      {/* Time Limit Countdown Bar (if configured) */}
      {remainingSeconds !== null && (
        <div className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
          remainingSeconds < 300
            ? 'bg-rose-950/60 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
            : 'bg-indigo-950/50 border-indigo-500/40'
        }`}>
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${remainingSeconds < 300 ? 'text-rose-400' : 'text-indigo-400'}`} />
            <div>
              <div className="text-[10px] font-bold text-slate-300 uppercase">남은 게임 시간</div>
              <div className="text-[10.5px] text-slate-400">종료 시 총자산 1위 승리</div>
            </div>
          </div>
          <div className={`text-lg font-black font-num ${
            remainingSeconds < 300 ? 'text-rose-300' : 'text-indigo-300'
          }`}>
            {formatTime(remainingSeconds)}
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="p-3 rounded-2xl bg-rose-950/90 border border-rose-500/60 shadow-xl flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>게임을 종료하고 시작 화면으로 돌아갈까요?</span>
          </div>
          <p className="text-[11px] text-rose-300/80">현재 진행 중인 보드게임 데이터는 초기화됩니다.</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              onClick={() => setShowExitConfirm(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={() => {
                setShowExitConfirm(false);
                onExitToLobby();
              }}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
            >
              종료하기
            </button>
          </div>
        </div>
      )}

      {/* Player Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-0.5">
        {players.map((p, idx) => {
          const isActive = idx === activePlayerIndex;

          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                p.isBankrupt
                  ? 'bg-slate-950/60 border border-rose-950/60 opacity-50'
                  : isActive
                  ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 shadow-lg ring-1'
                  : 'bg-slate-900/80 border border-slate-800/80 opacity-90 hover:opacity-100'
              }`}
              style={{
                borderColor: isActive ? p.color : undefined,
                boxShadow: isActive ? `0 0 16px ${p.color}50` : undefined
              }}
            >
              {/* Active Turn Tag */}
              {isActive && !p.isBankrupt && (
                <div
                  className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-xl text-[9.5px] font-extrabold tracking-wider uppercase flex items-center gap-1 text-slate-950"
                  style={{ backgroundColor: p.color }}
                >
                  <Sparkles className="w-2.5 h-2.5 animate-spin" />
                  <span>현재 차례</span>
                </div>
              )}

              {/* Bankrupt Badge */}
              {p.isBankrupt && (
                <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-xl text-[9px] font-bold tracking-wider uppercase bg-rose-900 text-rose-200 border-b border-l border-rose-600">
                  파산 (탈락)
                </div>
              )}

              {/* Player Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center p-1 shadow-md border shrink-0"
                  style={{
                    backgroundColor: `${p.color}25`,
                    borderColor: p.glowColor || '#ffffff',
                    boxShadow: `0 0 10px ${p.color}55`
                  }}
                >
                  <AirplanePiece colorId={p.airplaneColor || 'red'} size="md" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">
                      {p.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700">
                      {p.isAI ? 'AI 봇' : `P${idx + 1}`}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>도시 <strong className="text-slate-200 font-num">{p.ownedCityCount}개</strong></span>
                    {p.islandTurnsLeft > 0 && (
                      <span className="text-emerald-300 font-bold px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/40 text-[9.5px]">
                        🏝️ 무인도 ({p.islandTurnsLeft}턴)
                      </span>
                    )}
                    {p.hasIslandEscapeCard > 0 && (
                      <span className="text-purple-300 font-bold px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/40 text-[9.5px] flex items-center gap-0.5" title="무인도 탈출권 (인벤토리 보관 중)">
                        <span>🛶 탈출권</span>
                        <strong className="text-purple-200 font-num">{p.hasIslandEscapeCard}장</strong>
                      </span>
                    )}
                    {(p.freePassCards || 0) > 0 && (
                      <span className="text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/40 text-[9.5px] flex items-center gap-0.5" title="상대 땅 1회 무료 통과권 (인벤토리 보관 중)">
                        <span>🎫 무료통과</span>
                        <strong className="text-amber-200 font-num">{p.freePassCards}장</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assets & Cash display */}
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[9.5px] text-slate-400 flex items-center gap-1">
                    <Coins className="w-2.5 h-2.5 text-amber-400" />
                    <span>보유 현금</span>
                  </div>
                  <div className="text-sm font-extrabold text-amber-400 font-num leading-tight mt-0.5">
                    {p.money}만 원
                  </div>
                </div>

                <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[9.5px] text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5 text-cyan-400" />
                    <span>총 자산 (순자산)</span>
                  </div>
                  <div className="text-sm font-extrabold text-cyan-300 font-num leading-tight mt-0.5">
                    {p.totalAssets}만 원
                  </div>
                </div>
              </div>

              {/* Debt & Loan status info */}
              {p.debt > 0 && (
                <div className="mt-1.5 p-1.5 rounded-xl bg-red-950/50 border border-red-500/40 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1 text-red-300 text-[10.5px]">
                      <CreditCard className="w-3 h-3 text-red-400 shrink-0" />
                      <span>대출 빚:</span>
                      <strong className="text-red-200 font-num">{p.debt}만 원</strong>
                    </div>
                    <div className="text-[9.5px] text-amber-300/80 font-medium">
                      상환 시 재대출 가능
                    </div>
                  </div>

                  {!p.isAI && onRepayDebt && (
                    p.money >= p.debt ? (
                      <button
                        onClick={() => onRepayDebt(p.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white cursor-pointer shadow transition-all active:scale-95"
                        title="빚을 전액 상환하면 언제든 다시 대출을 받을 수 있습니다."
                      >
                        빚 갚기
                      </button>
                    ) : (
                      <span className="text-[9.5px] text-slate-400 font-num">
                        부족 ({p.money}/{p.debt}만)
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Social Fund Jackpot Pool Box */}
      <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-pulse">🏦</span>
          <div>
            <div className="text-[9.5px] font-bold text-amber-300 uppercase tracking-wide">
              사회복지기금 누적액
            </div>
            <div className="text-[10.5px] text-slate-400">접수처 도착 시 전액 수령!</div>
          </div>
        </div>
        <div className="text-base font-extrabold text-amber-400 font-num">
          {socialFund}만 원
        </div>
      </div>

      {/* Game Logs Feed */}
      <div className="flex-1 flex flex-col p-3 rounded-2xl glass-panel border border-slate-800 min-h-[160px] max-h-[220px] lg:max-h-[280px]">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <ScrollText className="w-3.5 h-3.5 text-emerald-400" />
            <span>실시간 게임 중계</span>
          </div>
          <span className="text-[10px] font-num text-slate-500 font-semibold">턴 {currentTurnCount}</span>
        </div>

        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs"
        >
          {gameLogs.map((log) => {
            const player = players.find(p => p.id === log.playerId);
            const playerColor = player?.color || '#38bdf8';
            const playerName = player?.name || `P${log.playerId + 1}`;

            return (
              <div
                key={log.id}
                className={`p-2 rounded-xl border text-[11px] leading-relaxed transition-all ${
                  log.type === 'buy' || log.type === 'upgrade'
                    ? 'bg-blue-950/40 border-blue-500/30 text-blue-200'
                    : log.type === 'toll' || log.type === 'takeover'
                    ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                    : log.type === 'golden_key'
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[9.5px] text-slate-500 mb-0.5">
                  <span className="font-bold flex items-center gap-1" style={{ color: playerColor }}>
                    <span>{player?.avatar || '🎲'}</span>
                    <span>{playerName}</span>
                  </span>
                  <span>{log.timestamp}</span>
                </div>
                <div>{log.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
