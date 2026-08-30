import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameModeConfig, HumanCountOption } from '../types';
import { PLAYER_PRESETS } from '../utils/playerPresets';
import { Users, Bot, Sparkles, Play, X, UserCheck } from 'lucide-react';

interface ModeSelectModalProps {
  currentConfig: GameModeConfig;
  onApplyConfig: (config: GameModeConfig) => void;
  onClose: () => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  currentConfig,
  onApplyConfig,
  onClose
}) => {
  const [selectedHumanCount, setSelectedHumanCount] = useState<HumanCountOption>(currentConfig.humanCount);
  const [selectedAiCount, setSelectedAiCount] = useState<number>(currentConfig.aiCount);

  // When human count changes, adjust AI count according to rules
  const handleHumanCountChange = (count: HumanCountOption) => {
    setSelectedHumanCount(count);
    if (count === 2) {
      if (selectedAiCount > 2) setSelectedAiCount(0);
    } else if (count === 3) {
      if (selectedAiCount > 1) setSelectedAiCount(0);
    } else if (count === 4) {
      setSelectedAiCount(0);
    }
  };

  const handleApply = () => {
    onApplyConfig({
      humanCount: selectedHumanCount,
      aiCount: selectedAiCount
    });
    onClose();
  };

  // Compute preview players
  const totalPlayers = selectedHumanCount + selectedAiCount;
  const previewPlayers = [];
  for (let i = 0; i < totalPlayers; i++) {
    const isAI = i >= selectedHumanCount;
    const preset = PLAYER_PRESETS[i];
    const aiIndex = i - selectedHumanCount + 1;
    previewPlayers.push({
      ...preset,
      isAI,
      displayName: isAI ? `AI 봇 ${aiIndex}호` : preset.humanName,
      avatar: isAI ? (aiIndex === 1 ? '🤖' : '👾') : preset.avatarHuman
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#0e1738] via-[#091029] to-[#05091a] rounded-3xl border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-cyan-500/20 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white">
                게임 인원 & AI 설정
              </h2>
              <p className="text-[11px] text-slate-400">
                인간 플레이어 수(2~4인)와 추가할 AI 봇 수를 설정하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* 1. Human Player Count Selection (2인 / 3인 / 4인) */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>1단계: 인간 플레이어 수 선택</span>
            </label>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {([2, 3, 4] as HumanCountOption[]).map((count) => {
                const isSelected = selectedHumanCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleHumanCountChange(count)}
                    className={`py-3 px-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500/30 to-blue-600/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-white'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-base sm:text-lg font-black font-display">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>{count}인 플레이</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {count === 2 ? 'AI 0~2명 추가 가능' : count === 3 ? 'AI 0~1명 추가 가능' : '인간 4인 풀 대전'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Additional AI Player Count Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>2단계: 추가할 AI 플레이어 수</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                총 인원: <strong className="text-cyan-300 font-num">{totalPlayers}명</strong> (최대 4인)
              </span>
            </label>

            {selectedHumanCount === 2 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { ai: 0, title: '0명 (추가 안 함)', desc: '인간 2인 (총 2명)' },
                  { ai: 1, title: '+1명 (AI 1명)', desc: '인간 2 + AI 1 (총 3명)' },
                  { ai: 2, title: '+2명 (AI 2명)', desc: '인간 2 + AI 2 (총 4명)' }
                ].map((item) => {
                  const isSelected = selectedAiCount === item.ai;
                  return (
                    <button
                      key={item.ai}
                      type="button"
                      onClick={() => setSelectedAiCount(item.ai)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] text-cyan-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold font-display">{item.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedHumanCount === 3 && (
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { ai: 0, title: '0명 (추가 안 함)', desc: '인간 3인 (총 3명)' },
                  { ai: 1, title: '+1명 (AI 1명)', desc: '인간 3 + AI 1 (총 4명)' }
                ].map((item) => {
                  const isSelected = selectedAiCount === item.ai;
                  return (
                    <button
                      key={item.ai}
                      type="button"
                      onClick={() => setSelectedAiCount(item.ai)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] text-cyan-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold font-display">{item.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedHumanCount === 4 && (
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center text-xs text-slate-300">
                <div className="font-bold text-amber-300 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>인간 4인 플레이 (AI 0명)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  최대 정원 4명이 모두 채워져 추가 AI 없이 4명의 플레이어가 직접 대결합니다!
                </div>
              </div>
            )}
          </div>

          {/* 3. Player Preview List */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>참가 플레이어 명단</span>
              <span className="text-[11px] text-slate-400">
                인간 {selectedHumanCount}명 {selectedAiCount > 0 ? `+ AI ${selectedAiCount}명` : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {previewPlayers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl border flex flex-col items-center text-center relative"
                  style={{
                    backgroundColor: `${p.color}15`,
                    borderColor: `${p.color}60`
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base shadow mb-1"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.avatar}
                  </div>
                  <div className="text-xs font-bold text-white truncate max-w-full">
                    {p.displayName}
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-black mt-1 ${
                      p.isAI
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {p.isAI ? 'AI 봇' : `P${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs font-display flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/30 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>설정 적용 및 새 게임 시작</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

