import { Player } from '../types';

export interface PlayerPreset {
  id: number;
  humanName: string;
  aiName: string;
  avatarHuman: string;
  avatarAI: string;
  color: string;
  glowColor: string;
  secondaryColor: string;
}

export const PLAYER_PRESETS: PlayerPreset[] = [
  {
    id: 0,
    humanName: "라이언",
    aiName: "알파 (AI)",
    avatarHuman: "🦁",
    avatarAI: "🤖",
    color: "#f43f5e", // Ruby Red
    glowColor: "#fda4af",
    secondaryColor: "#e11d48"
  },
  {
    id: 1,
    humanName: "어피치",
    aiName: "슬기 (AI)",
    avatarHuman: "👩‍💼",
    avatarAI: "🤖",
    color: "#06b6d4", // Cyan Blue
    glowColor: "#67e8f9",
    secondaryColor: "#0891b2"
  },
  {
    id: 2,
    humanName: "무지",
    aiName: "베타 (AI)",
    avatarHuman: "🐱",
    avatarAI: "👾",
    color: "#10b981", // Emerald Green
    glowColor: "#6ee7b7",
    secondaryColor: "#059669"
  },
  {
    id: 3,
    humanName: "프로도",
    aiName: "오메가 (AI)",
    avatarHuman: "🦊",
    avatarAI: "🛰️",
    color: "#a855f7", // Purple / Violet
    glowColor: "#d8b4fe",
    secondaryColor: "#9333ea"
  }
];

export function createPlayersForMode(
  humanCount: 2 | 3 | 4,
  aiCount: number,
  initialMoney: number = 300,
  customNames?: string[]
): Player[] {
  // Clamping AI count according to rules:
  // 2인의 경우: 0~2명 AI (총 2~4명)
  // 3인의 경우: 0~1명 AI (총 3~4명)
  // 4인의 경우: 0명 AI (총 4명)
  let validAiCount = 0;
  if (humanCount === 2) {
    validAiCount = Math.max(0, Math.min(2, aiCount));
  } else if (humanCount === 3) {
    validAiCount = Math.max(0, Math.min(1, aiCount));
  } else {
    validAiCount = 0;
  }

  const totalPlayers = humanCount + validAiCount;
  const players: Player[] = [];

  for (let i = 0; i < totalPlayers; i++) {
    const preset = PLAYER_PRESETS[i];
    const isAI = i >= humanCount; // First humanCount players are human, rest are AI
    const aiIndex = i - humanCount + 1;

    const defaultName = isAI ? `AI 봇 ${aiIndex}호` : preset.humanName;
    const playerName = (customNames && customNames[i] && customNames[i].trim().length > 0)
      ? customNames[i].trim()
      : defaultName;

    players.push({
      id: i,
      name: playerName,
      avatar: isAI ? (aiIndex === 1 ? '🤖' : '👾') : preset.avatarHuman,
      color: preset.color,
      glowColor: preset.glowColor,
      secondaryColor: preset.secondaryColor,
      pos: 0,
      prevPos: 0,
      money: initialMoney,
      totalAssets: initialMoney,
      isAI,
      islandTurnsLeft: 0,
      hasIslandEscapeCard: 0,
      spaceTravelQueued: false,
      isBankrupt: false,
      ownedCityCount: 0
    });
  }

  return players;
}
