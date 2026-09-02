import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HumanCountOption, GameModeConfig, GameSpeed, TimeLimitOption, AirplaneColorId } from '../types';
import { AIRPLANE_CONFIGS, AIRPLANE_COLOR_ORDER, AirplaneConfig } from '../utils/airplaneConfig';
import { AirplanePiece } from './AirplanePiece';
import { 
  Users, 
  Bot, 
  UserCheck, 
  Play, 
  Sparkles, 
  Trophy, 
  Globe, 
  Shield, 
  Gauge, 
  Clock, 
  FastForward, 
  Timer,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Lock,
  Plane
} from 'lucide-react';

interface GameSetupScreenProps {
  onStartGame: (config: GameModeConfig, playerNames: string[], airplaneColors: AirplaneColorId[]) => void;
}

export const GameSetupScreen: React.FC<GameSetupScreenProps> = ({ onStartGame }) => {
  // Step 1: Settings & Names, Step 2: Airplane Token Selection
  const [step, setStep] = useState<1 | 2>(1);

  // Configuration States
  const [humanCount, setHumanCount] = useState<HumanCountOption>(2);
  const [aiCount, setAiCount] = useState<number>(0);
  const [speed, setSpeed] = useState<GameSpeed>('normal');
  const [timeLimit, setTimeLimit] = useState<TimeLimitOption>(60);
  
  // Custom names for players 0..3 (human and AI)
  const [playerNames, setPlayerNames] = useState<Record<number, string>>({});

  // Step 2: Airplane Color Selection States
  const [currentSelectingPlayerIndex, setCurrentSelectingPlayerIndex] = useState<number>(0);
  const [chosenAirplanes, setChosenAirplanes] = useState<Record<number, AirplaneColorId>>({});
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  const totalPlayers = humanCount + aiCount;

  // Resolve player name helper
  const getPlayerName = (idx: number): string => {
    const isAI = idx >= humanCount;
    const aiIdx = idx - humanCount + 1;
    const defaultName = isAI ? `AI 봇 ${aiIdx}호` : `플레이어 ${idx + 1}`;
    const custom = playerNames[idx]?.trim();
    return custom && custom.length > 0 ? custom : defaultName;
  };

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

  // Transition from Step 1 -> Step 2
  const handleGoToAirplaneSelect = (e: React.FormEvent) => {
    e.preventDefault();
    setChosenAirplanes({});
    setCurrentSelectingPlayerIndex(0);
    setStep(2);
  };

  // AI Auto-Selection Effect when it's an AI's turn to pick airplane
  useEffect(() => {
    if (step !== 2) return;

    if (currentSelectingPlayerIndex < totalPlayers) {
      const isAI = currentSelectingPlayerIndex >= humanCount;
      if (isAI) {
        setIsAiThinking(true);
        const timer = setTimeout(() => {
          // Find first available airplane color
          const alreadyChosen = Object.values(chosenAirplanes);
          const availableColors = AIRPLANE_COLOR_ORDER.filter((col) => !alreadyChosen.includes(col));
          
          if (availableColors.length > 0) {
            const pickedColor = availableColors[0];
            setChosenAirplanes((prev) => ({
              ...prev,
              [currentSelectingPlayerIndex]: pickedColor
            }));
            setCurrentSelectingPlayerIndex((prev) => prev + 1);
          }
          setIsAiThinking(false);
        }, 600);

        return () => clearTimeout(timer);
      }
    }
  }, [step, currentSelectingPlayerIndex, totalPlayers, humanCount, chosenAirplanes]);

  // Human Airplane Selection Handler
  const handleSelectAirplane = (colorId: AirplaneColorId) => {
    if (step !== 2) return;
    if (currentSelectingPlayerIndex >= totalPlayers) return;

    const isAI = currentSelectingPlayerIndex >= humanCount;
    if (isAI || isAiThinking) return;

    // Check if color is already taken
    const alreadyChosen = Object.values(chosenAirplanes);
    if (alreadyChosen.includes(colorId)) return;

    setChosenAirplanes((prev) => ({
      ...prev,
      [currentSelectingPlayerIndex]: colorId
    }));
    setCurrentSelectingPlayerIndex((prev) => prev + 1);
  };

  // Reset airplane selections
  const handleResetAirplaneSelection = () => {
    setChosenAirplanes({});
    setCurrentSelectingPlayerIndex(0);
    setIsAiThinking(false);
  };

  // Final Start Game
  const handleFinalStartGame = () => {
    const resolvedNames: string[] = [];
    const resolvedAirplanes: AirplaneColorId[] = [];

    for (let i = 0; i < totalPlayers; i++) {
      resolvedNames.push(getPlayerName(i));
      const col = chosenAirplanes[i] || AIRPLANE_COLOR_ORDER[i % AIRPLANE_COLOR_ORDER.length];
      resolvedAirplanes.push(col);
    }

    onStartGame(
      { humanCount, aiCount, speed, timeLimitMinutes: timeLimit },
      resolvedNames,
      resolvedAirplanes
    );
  };

  const isAllAirplanesChosen = Object.keys(chosenAirplanes).length >= totalPlayers;
  const currentTurnPlayerIsAI = currentSelectingPlayerIndex >= humanCount;
  const currentTurnPlayerName = currentSelectingPlayerIndex < totalPlayers 
    ? getPlayerName(currentSelectingPlayerIndex) 
    : '';

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
        <div className="bg-gradient-to-r from-emerald-950 via-[#1b3d17] to-emerald-950 p-5 sm:p-6 border-b border-emerald-500/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Globe className="w-36 h-36 text-emerald-300" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold mb-2 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>클래식 정통 부루마블 게임</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-emerald-300 tracking-tight">
            {step === 1 ? '게임 설정 & 참가자 등록' : '비행기 말 색상 선택'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1">
            {step === 1 
              ? '플레이어 인원, 닉네임, 게임 속도 및 제한 시간을 설정하세요.' 
              : '실제 부루마블처럼 순서대로 원하는 색상의 비행기 말을 선택하세요.'}
          </p>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 1 
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1단계: 기본 설정</span>
            </div>
            <div className="w-6 h-0.5 bg-emerald-700/60" />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 2 
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}>
              <Plane className="w-3.5 h-3.5" />
              <span>2단계: 비행기 말 선택</span>
            </div>
          </div>
        </div>

        {/* 🌟 STEP 1: Main Settings Form 🌟 */}
        {step === 1 && (
          <form onSubmit={handleGoToAirplaneSelect} className="p-5 sm:p-7 space-y-5">
            {/* Step 1.1: Human Player Count */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                  1. 인간 플레이어 수 선택
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
                      className={`py-2.5 sm:py-3 px-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
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

            {/* Step 1.2: AI Bot Count */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Bot className="w-4 h-4" />
                  2. 추가할 AI 컴퓨터 플레이어 수
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
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
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
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
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
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-xs sm:text-sm font-bold text-amber-300 flex items-center justify-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>인간 4인 풀 대전 (AI 0명)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    4명의 플레이어가 보드의 전 지역을 치열하게 경쟁합니다!
                  </p>
                </div>
              )}
            </div>

            {/* Step 1.3: Player Nicknames */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Trophy className="w-4 h-4" />
                  3. 플레이어 닉네임 입력 (총 {totalPlayers}명)
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  자유롭게 변경 가능
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Array.from({ length: totalPlayers }).map((_, idx) => {
                  const isAI = idx >= humanCount;
                  const aiIdx = idx - humanCount + 1;
                  const defaultName = isAI ? `AI 봇 ${aiIdx}호` : `플레이어 ${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        isAI
                          ? 'bg-cyan-950/20 border-cyan-500/30'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        {isAI ? '🤖' : `${idx + 1}`}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold text-slate-300 truncate">
                            {isAI ? `플레이어 ${idx + 1} (AI)` : `플레이어 ${idx + 1}`}
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase border ${
                              isAI
                                ? 'bg-cyan-900/60 text-cyan-200 border-cyan-500/40'
                                : 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40'
                            }`}
                          >
                            {isAI ? 'AI' : '인간'}
                          </span>
                        </div>

                        <input
                          type="text"
                          value={playerNames[idx] ?? ''}
                          onChange={(e) => handleNameChange(idx, e.target.value)}
                          placeholder={defaultName}
                          maxLength={10}
                          className="w-full bg-slate-950/80 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-semibold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 1.4: Game Speed & Time Limit (2 Columns on tablet) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Game Speed */}
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-purple-400">
                  <Gauge className="w-3.5 h-3.5" />
                  4. 게임 진행 속도
                </label>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'slow' as GameSpeed, label: '느림', icon: Clock },
                    { id: 'normal' as GameSpeed, label: '보통', icon: Gauge },
                    { id: 'fast' as GameSpeed, label: '빠름', icon: FastForward }
                  ].map((opt) => {
                    const isSelected = speed === opt.id;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSpeed(opt.id)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-amber-400">
                  <Timer className="w-3.5 h-3.5" />
                  5. 게임 제한 시간
                </label>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { mins: 30 as TimeLimitOption, label: '30분' },
                    { mins: 60 as TimeLimitOption, label: '60분' },
                    { mins: 90 as TimeLimitOption, label: '90분' }
                  ].map((opt) => {
                    const isSelected = timeLimit === opt.mins;
                    return (
                      <button
                        key={opt.mins}
                        type="button"
                        onClick={() => setTimeLimit(opt.mins)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Timer className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Next Step Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-base shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-300"
              >
                <span>다음 단계: 비행기 말 선택하기 (총 {totalPlayers}명)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* 🌟 STEP 2: Realistic Blue Marble Airplane Color Selection 🌟 */}
        {step === 2 && (
          <div className="p-5 sm:p-7 space-y-6">
            {/* Current Turn Selector Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 shadow-lg text-center relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    비행기 선택 순서
                  </span>
                  <span className="text-xs text-slate-400">
                    ({Math.min(currentSelectingPlayerIndex + 1, totalPlayers)} / {totalPlayers})
                  </span>
                </div>

                {Object.keys(chosenAirplanes).length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAirplaneSelection}
                    className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>처음부터 다시 선택</span>
                  </button>
                )}
              </div>

              {/* Status Message */}
              {!isAllAirplanesChosen ? (
                <div className="flex items-center justify-center gap-2.5 py-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-sm font-bold text-emerald-300 animate-pulse">
                    {currentTurnPlayerIsAI ? '🤖' : `${currentSelectingPlayerIndex + 1}`}
                  </div>

                  <div className="text-left">
                    <div className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                      <span>[{currentTurnPlayerName}]</span>
                      <span className="text-amber-300">비행기 말을 선택하세요!</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {currentTurnPlayerIsAI 
                        ? 'AI 컴퓨터가 남은 비행기 중 하나를 자동으로 선택합니다...' 
                        : '아래 4가지 비행기 중 원하는 색상을 클릭하세요.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-1 text-center">
                  <div className="text-base sm:text-lg font-black text-amber-300 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                    <span>모든 플레이어의 비행기 말 선택 완료!</span>
                  </div>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    이제 부루마블 보드게임 대결을 시작할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 2x2 Airplane Cards Grid (Matching image.png & image2.png reference) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {AIRPLANE_COLOR_ORDER.map((colorId) => {
                const config = AIRPLANE_CONFIGS[colorId];
                
                // Find if this airplane color is already taken
                const takenPlayerIndexStr = Object.entries(chosenAirplanes).find(([_, col]) => col === colorId)?.[0];
                const isTaken = takenPlayerIndexStr !== undefined;
                const takenPlayerIndex = isTaken ? Number(takenPlayerIndexStr) : -1;
                const takenPlayerName = isTaken ? getPlayerName(takenPlayerIndex) : '';
                const isTakenByAI = isTaken && takenPlayerIndex >= humanCount;

                // Can current player pick this color?
                const isSelectable = !isTaken && !isAllAirplanesChosen && !currentTurnPlayerIsAI && !isAiThinking;

                return (
                  <motion.div
                    key={colorId}
                    whileHover={isSelectable ? { scale: 1.03, y: -2 } : {}}
                    whileTap={isSelectable ? { scale: 0.98 } : {}}
                    onClick={() => isSelectable && handleSelectAirplane(colorId)}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all select-none overflow-hidden flex flex-col items-center justify-between text-center min-h-[160px] sm:min-h-[180px] ${
                      isTaken
                        ? 'bg-slate-950/80 border-slate-800/80 opacity-60 cursor-not-allowed'
                        : isSelectable
                        ? `bg-slate-900/90 hover:bg-slate-850 cursor-pointer ${config.borderClass}`
                        : 'bg-slate-900/50 border-slate-800 cursor-not-allowed opacity-80'
                    }`}
                  >
                    {/* Background Subtle Airplane Glow */}
                    {!isTaken && (
                      <div
                        className="absolute inset-0 opacity-15 pointer-events-none rounded-2xl"
                        style={{
                          background: `radial-gradient(circle at 50% 40%, ${config.primaryColor}, transparent 70%)`
                        }}
                      />
                    )}

                    {/* TAKEN Overlay (Diagonal crossed lines / circled stamp as in image2.png) */}
                    {isTaken && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[1px] p-2">
                        {/* Circle & Cross-out stamp */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-rose-500/80 flex flex-col items-center justify-center bg-rose-950/60 shadow-lg rotate-[-12deg] mb-1">
                          <Lock className="w-4 h-4 text-rose-300 mb-0.5" />
                          <span className="text-[9.5px] font-black text-rose-200 tracking-tighter uppercase">
                            선택 불가
                          </span>
                        </div>

                        {/* Player who owns this airplane */}
                        <div className="px-2.5 py-1 rounded-full bg-slate-900/95 border border-slate-700 text-slate-200 text-[11px] font-bold shadow-md flex items-center gap-1.5">
                          <span className="text-xs">{isTakenByAI ? '🤖' : '👤'}</span>
                          <span className="truncate max-w-[120px]">{takenPlayerName}</span>
                          <span className="text-emerald-400 font-extrabold text-[10px]">완료</span>
                        </div>
                      </div>
                    )}

                    {/* Airplane 3D Piece Preview */}
                    <div className="my-auto py-2">
                      <AirplanePiece
                        colorId={colorId}
                        size="xl"
                        shadow={!isTaken}
                        animate={isSelectable}
                      />
                    </div>

                    {/* Airplane Name & Badge */}
                    <div className="w-full mt-1 z-10">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span
                          className={`text-xs sm:text-sm font-extrabold ${
                            colorId === 'white' ? 'text-slate-200' : ''
                          }`}
                          style={{ color: colorId !== 'white' ? config.primaryColor : undefined }}
                        >
                          {config.koreanName}
                        </span>
                      </div>

                      {/* Action Button or Taken Status */}
                      {!isTaken ? (
                        <button
                          type="button"
                          disabled={!isSelectable}
                          className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                            isSelectable
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md hover:brightness-110 active:scale-95 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isAllAirplanesChosen ? '선택 완료' : '이 비행기 선택'}
                        </button>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                          {takenPlayerName} 선택됨
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom: Player Airplane Assignment Summary Tray */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>참가 플레이어 비행기 배정 현황</span>
                <span className="text-[10.5px] text-emerald-400 font-medium">
                  {Object.keys(chosenAirplanes).length} / {totalPlayers} 배정됨
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: totalPlayers }).map((_, idx) => {
                  const isCurrent = idx === currentSelectingPlayerIndex;
                  const isAI = idx >= humanCount;
                  const chosenColor = chosenAirplanes[idx];
                  const pName = getPlayerName(idx);

                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                        chosenColor
                          ? 'bg-slate-950/80 border-slate-700'
                          : isCurrent
                          ? 'bg-emerald-950/50 border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                          : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      }`}
                    >
                      {/* Mini Airplane Preview or Question Mark */}
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                        {chosenColor ? (
                          <AirplanePiece colorId={chosenColor} size="sm" />
                        ) : (
                          <span className="text-xs font-bold text-slate-500">?</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-slate-200 truncate">
                          {pName}
                        </div>
                        <div className="text-[10px] truncate">
                          {chosenColor ? (
                            <span
                              className="font-bold"
                              style={{ color: AIRPLANE_CONFIGS[chosenColor]?.primaryColor }}
                            >
                              {AIRPLANE_CONFIGS[chosenColor]?.koreanName}
                            </span>
                          ) : isCurrent ? (
                            <span className="text-amber-400 font-semibold animate-pulse">선택 중...</span>
                          ) : (
                            <span className="text-slate-500">대기 중</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>이전 (설정 변경)</span>
              </button>

              <button
                type="button"
                onClick={handleFinalStartGame}
                disabled={!isAllAirplanesChosen}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 border ${
                  isAllAirplanesChosen
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.5)] scale-[1.02] border-amber-200 cursor-pointer animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>부루마블 게임 시작하기!</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
