export type CellType = 'start' | 'city' | 'golden_key' | 'island' | 'space' | 'fund' | 'tax' | 'travel';

export type ColorGroup = 'pink' | 'blue' | 'green' | 'orange' | 'special';

export interface SpaceData {
  id: number;
  name: string;
  type: CellType;
  colorGroup?: ColorGroup;
  colorHex?: string;
  price?: number; // Land base price in 만 (10k KRW)
  villaPrice?: number;
  buildingPrice?: number;
  hotelPrice?: number;
  landmarkPrice?: number;
  icon?: string;
  toll?: number; // Calculated or base toll
  description?: string;
  isSpecialLand?: boolean; // E.g., Concorde, Queen Elizabeth, Columbia
}

export interface CellState {
  owner: number | null; // player index (0 or 1) or null
  buildings: {
    hasVilla: boolean;
    hasBuilding: boolean;
    hasHotel: boolean;
    isLandmark: boolean;
  };
  currentToll: number;
}

export interface Player {
  id: number;
  name: string;
  avatar: string;
  color: string; // Tailwind color or hex
  glowColor: string;
  secondaryColor: string;
  pos: number;
  prevPos: number;
  money: number; // in 만 (10,000 KRW)
  totalAssets: number;
  isAI: boolean;
  aiDifficulty?: 'easy' | 'normal' | 'hard';
  islandTurnsLeft: number; // 0 if free, >0 if stuck
  hasIslandEscapeCard: number;
  spaceTravelQueued: boolean;
  isBankrupt: boolean;
  ownedCityCount: number;
}

export interface GoldenKeyCard {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  type: 'money_gain' | 'money_loss' | 'move_start' | 'move_island' | 'move_space' | 'escape_card' | 'toll_shield' | 'donation' | 'jackpot' | 'force_sell';
  amount?: number;
  targetPos?: number;
}

export interface GameLogEntry {
  id: string;
  playerId: number;
  text: string;
  type: 'roll' | 'buy' | 'upgrade' | 'toll' | 'golden_key' | 'event' | 'turn' | 'takeover' | 'bankrupt';
  timestamp: string;
  highlightAmount?: number;
}

export type HumanCountOption = 2 | 3 | 4;

export interface GameModeConfig {
  humanCount: HumanCountOption; // 2인, 3인, 4인 (인간 플레이어 수)
  aiCount: number; // 2인의 경우 0~2명, 3인의 경우 0~1명, 4인의 경우 0명
}

export type GameStatus = 'idle' | 'rolling' | 'moving' | 'action_modal' | 'game_over';

export interface GameOverResult {
  winner: Player;
  rankings: Player[];
  reason: string;
}

export interface FloatingEffect {
  id: string;
  playerId: number;
  amount: number;
  isPositive: boolean;
  text: string;
  x: number;
  y: number;
}
