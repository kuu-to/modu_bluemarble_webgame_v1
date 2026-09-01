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

export type GameSpeed = 'slow' | 'normal' | 'fast';

export interface GameSpeedSettings {
  stepIntervalMs: number; // Token hop interval per tile
  arrivalPauseMs: number; // Delay between landing on tile and modal/action popping up
  aiThinkDelayMs: number; // AI wait before rolling
  aiActionDelayMs: number; // AI decision delay before buying / paying toll
  modalActionDelayMs: number; // Action display delay (after purchase, toll, tax, pass) before next turn
  bannerDurationMs: number; // Turn banner display time
  diceRollTicks: number; // Dice tumbling count
  diceRollIntervalMs: number; // Dice tumbling tick rate
}

export const SPEED_CONFIGS: Record<GameSpeed, GameSpeedSettings> = {
  slow: {
    stepIntervalMs: 260,
    arrivalPauseMs: 1200,
    aiThinkDelayMs: 1800,
    aiActionDelayMs: 1600,
    modalActionDelayMs: 3400,
    bannerDurationMs: 2200,
    diceRollTicks: 10,
    diceRollIntervalMs: 75
  },
  normal: {
    stepIntervalMs: 180,
    arrivalPauseMs: 800,
    aiThinkDelayMs: 1100,
    aiActionDelayMs: 1100,
    modalActionDelayMs: 2400,
    bannerDurationMs: 1800,
    diceRollTicks: 7,
    diceRollIntervalMs: 60
  },
  fast: {
    stepIntervalMs: 120,
    arrivalPauseMs: 500,
    aiThinkDelayMs: 600,
    aiActionDelayMs: 600,
    modalActionDelayMs: 1300,
    bannerDurationMs: 1100,
    diceRollTicks: 5,
    diceRollIntervalMs: 45
  }
};

export interface GameModeConfig {
  humanCount: HumanCountOption; // 2인, 3인, 4인 (인간 플레이어 수)
  aiCount: number; // 2인의 경우 0~2명, 3인의 경우 0~1명, 4인의 경우 0명
  speed?: GameSpeed; // 게임 진행 속도 ('slow' | 'normal' | 'fast')
}

export type BroadcastCategory = 
  | 'start'
  | 'turn'
  | 'roll' 
  | 'arrive' 
  | 'purchase' 
  | 'pass' 
  | 'toll_due' 
  | 'toll_paid' 
  | 'takeover' 
  | 'golden_key' 
  | 'space_travel' 
  | 'island' 
  | 'salary' 
  | 'tax' 
  | 'fund' 
  | 'bankrupt';

export interface BoardBroadcastMessage {
  id: string;
  category: BroadcastCategory;
  playerId: number;
  playerName: string;
  playerColor: string;
  isAI: boolean;
  title: string;
  detail: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'purple' | 'slate';
  icon?: string;
  timestamp?: number;
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
