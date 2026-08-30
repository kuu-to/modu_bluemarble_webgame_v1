import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HumanCountOption, GameModeConfig } from '../types';
import { PLAYER_PRESETS } from '../utils/playerPresets';
import { Users, Bot, UserCheck, Play, Sparkles, Trophy, Globe, Shield } from 'lucide-react';

interface GameSetupScreenProps {
  onStartGame: (config: GameModeConfig, playerNames: string[]) => void;
}

export const GameSetupScreen: React.FC<GameSetupScreenProps> = ({ onStartGame }) => {
  const [humanCount, setHumanCount] = useState<HumanCountOption>(2);
  const [aiCount, setAiCount] = useState<number>(0);
  
  // Custom names for players 1..4 (human and AI)
  const [playerNames, setPlayerNames] = useState<Record<number, string>>({});

  const handleHumanCountChange = (count: HumanCountOption) => {
    setHumanCount(count);
    let newAi = aiCount;
    if (count === 2) {
      if (newAi > 2) newAi = 0;
    } else if (count === 3) {
      if (newAi > 1) newAi = 0;
    } else if (count === 4) {
      newAi = 0;
    }
    setAiCount(newAi);
  };

  const handleNameChange = (index: number, val: string) => {
    setPlayerNames((prev) => ({
      ...prev,
      [index]: val
    }));
  };

  const totalPlayers = humanCount + aiCount;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedNames: string[] = [];
    for (let i = 0; i < totalPlayers; i++) {
      const isAI = i >= humanCount;
      const aiIdx = i - humanCount + 1;
      const defaultName = isAI ? `AI 봇 ${aiIdx}호` : `플레이어 ${i + 1}`;
      const custom = playerNames[i]?.trim();
      resolvedNames.push(custom && custom.length > 0 ? custom : defaultName);
    }

    onStartGame(
      { humanCount, aiCount },
      resolvedNames
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 relative overflow-hidden bg-[#081309] text-slate-100">
      {/* Tabletop & Ambient Lighting Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_30%,rgba(74,222,128,0.15),rgba(0,0,0,0.92))] pointer-events-none" />
      <div className="fixed -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-slate-950/90 backdrop-blur-xl border border-emerald-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.2)] overflow-hidden z-10"
      >
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#1b3d17] to-emerald-950 p-5 sm:p-7 border-b border-emerald-500/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Globe className="w-36 h-36 text-emerald-300" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>클래식 정통 부루마블 게임</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-emerald-300 tracking-tight">
            모두의 부루마블
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1">
            도시를 매입하고 별장, 빌딩, 호텔, 랜드마크를 건설하여 최고의 부자가 되어보세요!
          </p>
        </div>

        {/* Setup Form Form */}
        <form onSubmit={handleStart} className="p-5 sm:p-8 space-y-6">
          {/* Step 1: Human Player Count Selection */}
          <div>
            <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <UserCheck className="w-4 h-4" />
                1단계: 인간 플레이어 수 선택
              </span>
              <span className="text-xs text-slate-400 font-normal">
                함께할 사람 인원
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {([2, 3, 4] as HumanCountOption[]).map((count) => {
                const isSelected = humanCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleHumanCountChange(count)}
                    className={`py-3 sm:py-3.5 px-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-emerald-500/30 to-emerald-700/30 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>{count}인 대전</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {count === 2 ? '인간 2명' : count === 3 ? '인간 3명' : '인간 4명 풀 대결'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: AI Bot Selection */}
          <div>
            <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Bot className="w-4 h-4" />
                2단계: 추가할 AI 컴퓨터 플레이어 수
              </span>
              <span className="text-xs text-cyan-300 font-semibold">
                총 인원: {totalPlayers}명 (최대 4명)
              </span>
            </label>

            {humanCount === 2 && (
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { ai: 0, title: '0명 (추가 안 함)', desc: '인간 2명 (총 2명)' },
                  { ai: 1, title: '+1명 (AI 1명)', desc: '인간 2 + AI 1 (총 3명)' },
                  { ai: 2, title: '+2명 (AI 2명)', desc: '인간 2 + AI 2 (총 4명)' }
                ].map((item) => {
                  const isSelected = aiCount === item.ai;
                  return (
                    <button
                      key={item.ai}
                      type="button"
                      onClick={() => setAiCount(item.ai)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] text-cyan-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold">{item.title}</div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {humanCount === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { ai: 0, title: '0명 (추가 안 함)', desc: '인간 3명 (총 3명)' },
                  { ai: 1, title: '+1명 (AI 1명)', desc: '인간 3 + AI 1 (총 4명)' }
                ].map((item) => {
                  const isSelected = aiCount === item.ai;
                  return (
                    <button
                      key={item.ai}
                      type="button"
                      onClick={() => setAiCount(item.ai)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] text-cyan-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {humanCount === 4 && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-xs sm:text-sm font-bold text-amber-300 flex items-center justify-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>인간 4인 풀 대전 (AI 0명)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  4명의 플레이어가 보드의 전 지역을 치열하게 경쟁합니다!
                </p>
              </div>
            )}
          </div>

          {/* Step 3: Sequential Player Name Inputs (Human and AI) */}
          <div>
            <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Trophy className="w-4 h-4" />
                3단계: 플레이어 닉네임 입력 (총 {totalPlayers}명)
              </span>
              <span className="text-xs text-slate-400 font-normal">
                원하는 이름으로 자유롭게 변경 가능
              </span>
            </label>

            <div className="space-y-3">
              {Array.from({ length: totalPlayers }).map((_, idx) => {
                const preset = PLAYER_PRESETS[idx];
                const isAI = idx >= humanCount;
                const aiIdx = idx - humanCount + 1;
                const defaultName = isAI ? `AI 봇 ${aiIdx}호` : `플레이어 ${idx + 1}`;
                const avatar = isAI ? (aiIdx === 1 ? '🤖' : '👾') : preset.avatarHuman;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all ${
                      isAI
                        ? 'bg-cyan-950/20 border-cyan-500/30 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400'
                        : 'bg-slate-900/90 border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
                    }`}
                  >
                    {/* Player Avatar & Color Token */}
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold shadow-md border-2 border-white/20 shrink-0"
                      style={{ backgroundColor: preset.color }}
                    >
                      {avatar}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11.5px] font-bold" style={{ color: preset.color }}>
                          {isAI ? (
                            <span>
                              플레이어 {idx + 1} (AI)의 이름을 입력하세요{' '}
                              <span className="text-cyan-300/80 font-normal text-[11px]">
                                (기본값: {defaultName})
                              </span>
                            </span>
                          ) : (
                            <span>
                              플레이어 {idx + 1}의 이름을 입력하세요{' '}
                              <span className="text-slate-400 font-normal text-[11px]">
                                (기본값: {defaultName})
                              </span>
                            </span>
                          )}
                        </label>

                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                            isAI
                              ? 'bg-cyan-900/60 text-cyan-200 border-cyan-500/40'
                              : 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40'
                          }`}
                        >
                          {isAI ? 'AI 봇' : '인간'}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={playerNames[idx] ?? ''}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                        placeholder={defaultName}
                        maxLength={10}
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-semibold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start Game Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-base sm:text-lg shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-300"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>부루마블 게임 시작하기</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
