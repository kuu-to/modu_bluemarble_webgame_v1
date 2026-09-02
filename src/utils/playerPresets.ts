import { Player, AirplaneColorId } from '../types';
import { AIRPLANE_CONFIGS, AIRPLANE_COLOR_ORDER } from './airplaneConfig';

export interface PlayerPreset {
  id: number;
  humanName: string;
  aiName: string;
  avatarHuman: string;
  avatarAI: string;
  airplaneColor: AirplaneColorId;
  color: string;
  glowColor: string;
  secondaryColor: string;
}

export const PLAYER_PRESETS: PlayerPreset[] = [
  {
    id: 0,
    humanName: "플레이어 1",
    aiName: "알파 (AI)",
    avatarHuman: "✈️",
    avatarAI: "🤖",
    airplaneColor: "red",
    color: "#ef4444", // Ruby Red
    glowColor: "#fca5a5",
    secondaryColor: "#b91c1c"
  },
  {
    id: 1,
    humanName: "플레이어 2",
    aiName: "슬기 (AI)",
    avatarHuman: "✈️",
    avatarAI: "🤖",
    airplaneColor: "blue",
    color: "#2563eb", // Royal Blue
    glowColor: "#93c5fd",
    secondaryColor: "#1d4ed8"
  },
  {
    id: 2,
    humanName: "플레이어 3",
    aiName: "베타 (AI)",
    avatarHuman: "✈️",
    avatarAI: "👾",
    airplaneColor: "white",
    color: "#f8fafc", // Classic White
    glowColor: "#cbd5e1",
    secondaryColor: "#475569"
  },
  {
    id: 3,
    humanName: "플레이어 4",
    aiName: "오메가 (AI)",
    avatarHuman: "✈️",
    avatarAI: "🛰️",
    airplaneColor: "yellow",
    color: "#eab308", // Golden Yellow
    glowColor: "#fef08a",
    secondaryColor: "#a16207"
  }
];

export function createPlayersForMode(
  humanCount: 2 | 3 | 4,
  aiCount: number,
  initialMoney: number = 300,
  customNames?: string[],
  customAirplaneColors?: AirplaneColorId[]
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
    const isAI = i >= humanCount; // First humanCount players are human, rest are AI
    const aiIndex = i - humanCount + 1;

    const defaultName = isAI ? `AI 봇 ${aiIndex}호` : `플레이어 ${i + 1}`;
    const playerName = (customNames && customNames[i] && customNames[i].trim().length > 0)
      ? customNames[i].trim()
      : defaultName;

    // Determine airplane color
    const airplaneCol: AirplaneColorId = (customAirplaneColors && customAirplaneColors[i])
      ? customAirplaneColors[i]
      : AIRPLANE_COLOR_ORDER[i % AIRPLANE_COLOR_ORDER.length];

    const planeCfg = AIRPLANE_CONFIGS[airplaneCol] || AIRPLANE_CONFIGS.red;

    players.push({
      id: i,
      name: playerName,
      avatar: isAI ? (aiIndex === 1 ? '🤖' : '👾') : '✈️',
      airplaneColor: airplaneCol,
      color: planeCfg.primaryColor,
      glowColor: planeCfg.glowColor,
      secondaryColor: planeCfg.secondaryColor,
      pos: 0,
      prevPos: 0,
      money: initialMoney,
      totalAssets: initialMoney,
      isAI,
      islandTurnsLeft: 0,
      hasIslandEscapeCard: 0,
      spaceTravelQueued: false,
      isBankrupt: false,
      ownedCityCount: 0,
      debt: 0,
      hasUsedLoan: false
    });
  }

  return players;
}
