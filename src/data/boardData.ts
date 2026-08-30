import { SpaceData } from '../types';

export const BOARD_SPACES: SpaceData[] = [
  // 0: 출발점 (START)
  {
    id: 0,
    name: "출발점",
    type: "start",
    icon: "🚀",
    description: "월급 +20만 원 지급"
  },
  // 1: 타이베이
  {
    id: 1,
    name: "타이베이",
    type: "city",
    colorGroup: "pink",
    colorHex: "#f43f5e",
    price: 5,
    villaPrice: 3,
    buildingPrice: 5,
    hotelPrice: 8,
    landmarkPrice: 15,
    icon: "🏮"
  },
  // 2: 황금열쇠
  {
    id: 2,
    name: "황금열쇠",
    type: "golden_key",
    icon: "🔑",
    description: "행운의 카드 획득!"
  },
  // 3: 베이징
  {
    id: 3,
    name: "베이징",
    type: "city",
    colorGroup: "pink",
    colorHex: "#f43f5e",
    price: 8,
    villaPrice: 4,
    buildingPrice: 8,
    hotelPrice: 12,
    landmarkPrice: 20,
    icon: "🏯"
  },
  // 4: 마닐라
  {
    id: 4,
    name: "마닐라",
    type: "city",
    colorGroup: "pink",
    colorHex: "#f43f5e",
    price: 8,
    villaPrice: 4,
    buildingPrice: 8,
    hotelPrice: 12,
    landmarkPrice: 20,
    icon: "🌴"
  },
  // 5: 제주도 (관광지)
  {
    id: 5,
    name: "제주도",
    type: "city",
    colorGroup: "special",
    colorHex: "#06b6d4",
    price: 20,
    isSpecialLand: true,
    landmarkPrice: 30,
    icon: "🍊"
  },
  // 6: 싱가포르
  {
    id: 6,
    name: "싱가포르",
    type: "city",
    colorGroup: "pink",
    colorHex: "#f43f5e",
    price: 10,
    villaPrice: 5,
    buildingPrice: 10,
    hotelPrice: 15,
    landmarkPrice: 25,
    icon: "🦁"
  },
  // 7: 황금열쇠
  {
    id: 7,
    name: "황금열쇠",
    type: "golden_key",
    icon: "🔑",
    description: "행운의 카드 획득!"
  },
  // 8: 카이로
  {
    id: 8,
    name: "카이로",
    type: "city",
    colorGroup: "pink",
    colorHex: "#f43f5e",
    price: 10,
    villaPrice: 5,
    buildingPrice: 10,
    hotelPrice: 15,
    landmarkPrice: 25,
    icon: "🏺"
  },
  // 9: 이스탄불
  {
    id: 9,
    name: "이스탄불",
    type: "city",
    colorGroup: "pink",
    colorHex: "#f43f5e",
    price: 12,
    villaPrice: 6,
    buildingPrice: 12,
    hotelPrice: 18,
    landmarkPrice: 30,
    icon: "🕌"
  },
  // 10: 무인도 (ISLAND)
  {
    id: 10,
    name: "무인도",
    type: "island",
    icon: "🏝️",
    description: "3턴 동안 갇힘 (더블 또는 탈출비 20만)"
  },
  // 11: 아테네
  {
    id: 11,
    name: "아테네",
    type: "city",
    colorGroup: "blue",
    colorHex: "#3b82f6",
    price: 14,
    villaPrice: 7,
    buildingPrice: 14,
    hotelPrice: 21,
    landmarkPrice: 35,
    icon: "🏛️"
  },
  // 12: 황금열쇠
  {
    id: 12,
    name: "황금열쇠",
    type: "golden_key",
    icon: "🔑",
    description: "행운의 카드 획득!"
  },
  // 13: 코펜하겐
  {
    id: 13,
    name: "코펜하겐",
    type: "city",
    colorGroup: "blue",
    colorHex: "#3b82f6",
    price: 16,
    villaPrice: 8,
    buildingPrice: 16,
    hotelPrice: 24,
    landmarkPrice: 40,
    icon: "🧜‍♀️"
  },
  // 14: 스톡홀름
  {
    id: 14,
    name: "스톡홀름",
    type: "city",
    colorGroup: "blue",
    colorHex: "#3b82f6",
    price: 16,
    villaPrice: 8,
    buildingPrice: 16,
    hotelPrice: 24,
    landmarkPrice: 40,
    icon: "❄️"
  },
  // 15: 콩코드 여객기 (교통/특수)
  {
    id: 15,
    name: "콩코드",
    type: "city",
    colorGroup: "special",
    colorHex: "#a855f7",
    price: 20,
    isSpecialLand: true,
    landmarkPrice: 30,
    icon: "✈️"
  },
  // 16: 베른
  {
    id: 16,
    name: "베른",
    type: "city",
    colorGroup: "blue",
    colorHex: "#3b82f6",
    price: 18,
    villaPrice: 9,
    buildingPrice: 18,
    hotelPrice: 27,
    landmarkPrice: 45,
    icon: "🏔️"
  },
  // 17: 황금열쇠
  {
    id: 17,
    name: "황금열쇠",
    type: "golden_key",
    icon: "🔑",
    description: "행운의 카드 획득!"
  },
  // 18: 베를린
  {
    id: 18,
    name: "베를린",
    type: "city",
    colorGroup: "blue",
    colorHex: "#3b82f6",
    price: 18,
    villaPrice: 9,
    buildingPrice: 18,
    hotelPrice: 27,
    landmarkPrice: 45,
    icon: "🐻"
  },
  // 19: 오타와
  {
    id: 19,
    name: "오타와",
    type: "city",
    colorGroup: "blue",
    colorHex: "#3b82f6",
    price: 20,
    villaPrice: 10,
    buildingPrice: 20,
    hotelPrice: 30,
    landmarkPrice: 50,
    icon: "🍁"
  },
  // 20: 우주여행 (SPACE TRAVEL)
  {
    id: 20,
    name: "우주여행",
    type: "space",
    icon: "🛸",
    description: "다음 턴 원하는 도시로 즉시 순간이동!"
  },
  // 21: 부에노스아이레스
  {
    id: 21,
    name: "부에노스",
    type: "city",
    colorGroup: "green",
    colorHex: "#10b981",
    price: 22,
    villaPrice: 11,
    buildingPrice: 22,
    hotelPrice: 33,
    landmarkPrice: 55,
    icon: "💃"
  },
  // 22: 황금열쇠
  {
    id: 22,
    name: "황금열쇠",
    type: "golden_key",
    icon: "🔑",
    description: "행운의 카드 획득!"
  },
  // 23: 상파울루
  {
    id: 23,
    name: "상파울루",
    type: "city",
    colorGroup: "green",
    colorHex: "#10b981",
    price: 24,
    villaPrice: 12,
    buildingPrice: 24,
    hotelPrice: 36,
    landmarkPrice: 60,
    icon: "⚽"
  },
  // 24: 시드니
  {
    id: 24,
    name: "시드니",
    type: "city",
    colorGroup: "green",
    colorHex: "#10b981",
    price: 24,
    villaPrice: 12,
    buildingPrice: 24,
    hotelPrice: 36,
    landmarkPrice: 60,
    icon: "🦘"
  },
  // 25: 부산 (관광지)
  {
    id: 25,
    name: "부산",
    type: "city",
    colorGroup: "special",
    colorHex: "#06b6d4",
    price: 50,
    isSpecialLand: true,
    landmarkPrice: 60,
    icon: "🌊"
  },
  // 26: 하와이
  {
    id: 26,
    name: "하와이",
    type: "city",
    colorGroup: "green",
    colorHex: "#10b981",
    price: 26,
    villaPrice: 13,
    buildingPrice: 26,
    hotelPrice: 39,
    landmarkPrice: 65,
    icon: "🌺"
  },
  // 27: 리스본
  {
    id: 27,
    name: "리스본",
    type: "city",
    colorGroup: "green",
    colorHex: "#10b981",
    price: 26,
    villaPrice: 13,
    buildingPrice: 26,
    hotelPrice: 39,
    landmarkPrice: 65,
    icon: "⛵"
  },
  // 28: 퀸 엘리자베스호
  {
    id: 28,
    name: "퀸엘리자베스",
    type: "city",
    colorGroup: "special",
    colorHex: "#a855f7",
    price: 30,
    isSpecialLand: true,
    landmarkPrice: 40,
    icon: "🚢"
  },
  // 29: 마드리드
  {
    id: 29,
    name: "마드리드",
    type: "city",
    colorGroup: "green",
    colorHex: "#10b981",
    price: 28,
    villaPrice: 14,
    buildingPrice: 28,
    hotelPrice: 42,
    landmarkPrice: 70,
    icon: "🐂"
  },
  // 30: 사회복지기금 (SOCIAL FUND)
  {
    id: 30,
    name: "사회복지기금",
    type: "fund",
    icon: "🏦",
    description: "기금 모금처 / 접수처"
  },
  // 31: 도쿄
  {
    id: 31,
    name: "도쿄",
    type: "city",
    colorGroup: "orange",
    colorHex: "#f59e0b",
    price: 30,
    villaPrice: 15,
    buildingPrice: 30,
    hotelPrice: 45,
    landmarkPrice: 75,
    icon: "🗼"
  },
  // 32: 콜롬비아 우주선
  {
    id: 32,
    name: "콜롬비아호",
    type: "city",
    colorGroup: "special",
    colorHex: "#a855f7",
    price: 35,
    isSpecialLand: true,
    landmarkPrice: 45,
    icon: "🛰️"
  },
  // 33: 파리
  {
    id: 33,
    name: "파리",
    type: "city",
    colorGroup: "orange",
    colorHex: "#f59e0b",
    price: 32,
    villaPrice: 16,
    buildingPrice: 32,
    hotelPrice: 48,
    landmarkPrice: 80,
    icon: "🥖"
  },
  // 34: 로마
  {
    id: 34,
    name: "로마",
    type: "city",
    colorGroup: "orange",
    colorHex: "#f59e0b",
    price: 32,
    villaPrice: 16,
    buildingPrice: 32,
    hotelPrice: 48,
    landmarkPrice: 80,
    icon: "🍕"
  },
  // 35: 황금열쇠
  {
    id: 35,
    name: "황금열쇠",
    type: "golden_key",
    icon: "🔑",
    description: "행운의 카드 획득!"
  },
  // 36: 런던
  {
    id: 36,
    name: "런던",
    type: "city",
    colorGroup: "orange",
    colorHex: "#f59e0b",
    price: 35,
    villaPrice: 18,
    buildingPrice: 35,
    hotelPrice: 53,
    landmarkPrice: 90,
    icon: "💂"
  },
  // 37: 뉴욕
  {
    id: 37,
    name: "뉴욕",
    type: "city",
    colorGroup: "orange",
    colorHex: "#f59e0b",
    price: 35,
    villaPrice: 18,
    buildingPrice: 35,
    hotelPrice: 53,
    landmarkPrice: 90,
    icon: "🗽"
  },
  // 38: 국세청 (TAX)
  {
    id: 38,
    name: "국세청",
    type: "tax",
    icon: "💰",
    description: "자산 비례 세금 (자산의 10% 납부)"
  },
  // 39: 서울 (SEOUL - 황제 도시)
  {
    id: 39,
    name: "서울",
    type: "city",
    colorGroup: "orange",
    colorHex: "#eab308",
    price: 100,
    isSpecialLand: true,
    landmarkPrice: 150,
    icon: "👑"
  }
];

// Helper: Calculate total toll of a cell given its building state
export function calculateToll(space: SpaceData, buildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean }): number {
  if (!space.price) return 0;
  
  if (space.isSpecialLand) {
    if (buildings.isLandmark) {
      return Math.round(space.price * 2.5);
    }
    return Math.round(space.price * 0.8);
  }

  let multiplier = 0.3; // Base land toll = 30% of land price
  if (buildings.isLandmark) {
    multiplier = 3.5;
  } else {
    let count = 0;
    if (buildings.hasVilla) count++;
    if (buildings.hasBuilding) count += 1.5;
    if (buildings.hasHotel) count += 2;
    if (count > 0) {
      multiplier = 0.5 + count * 0.6;
    }
  }

  return Math.max(1, Math.round(space.price * multiplier));
}

// Calculate total asset value of a space
export function calculateSpaceValue(space: SpaceData, buildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean }): number {
  let val = space.price || 0;
  if (buildings.isLandmark) {
    val += space.landmarkPrice || (val * 1.5);
  } else {
    if (buildings.hasVilla) val += space.villaPrice || Math.round(space.price! * 0.5);
    if (buildings.hasBuilding) val += space.buildingPrice || (space.price || 0);
    if (buildings.hasHotel) val += space.hotelPrice || Math.round(space.price! * 1.5);
  }
  return val;
}
