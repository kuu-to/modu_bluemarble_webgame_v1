import { GoldenKeyCard } from '../types';

export const GOLDEN_KEYS: GoldenKeyCard[] = [
  {
    id: 1,
    title: "복권 당첨!",
    subtitle: "대박 행운",
    description: "축하합니다! 즉석 복권 1등에 당첨되어 상금 50만 원을 수령합니다.",
    icon: "🎉",
    type: "money_gain",
    amount: 50
  },
  {
    id: 2,
    title: "우주여행 초대권",
    subtitle: "순간이동 특권",
    description: "NASA의 특별 초청으로 우주정거장으로 즉시 이동합니다!",
    icon: "🛸",
    type: "move_space",
    targetPos: 20
  },
  {
    id: 3,
    title: "무인도 탈출권",
    subtitle: "비상 구명보트",
    description: "무인도에 갇혔을 때 즉시 무상으로 탈출할 수 있는 보증서입니다. (인벤토리 보관)",
    icon: "🛶",
    type: "escape_card"
  },
  {
    id: 4,
    title: "정기 종합소득세 납부",
    subtitle: "국세청 세무조사",
    description: "국세청 종합소득세 세무조사로 인해 세금 25만 원을 납부합니다.",
    icon: "💸",
    type: "money_loss",
    amount: 25
  },
  {
    id: 5,
    title: "출발점으로 직행",
    subtitle: "월급 2배 보너스",
    description: "출발점으로 즉시 이동하여 보너스 월급 30만 원을 지급받습니다.",
    icon: "🚀",
    type: "move_start",
    amount: 30,
    targetPos: 0
  },
  {
    id: 6,
    title: "사회복지기금 후원",
    subtitle: "따뜻한 기부",
    description: "어려운 이웃을 위해 사회복지기금에 15만 원을 기부합니다. (기금 적립)",
    icon: "💖",
    type: "donation",
    amount: 15
  },
  {
    id: 7,
    title: "폭풍우를 만나 조난",
    subtitle: "무인도 표류",
    description: "거친 폭풍우를 만나 무인도로 즉시 이송되어 격리됩니다.",
    icon: "⛈️",
    type: "move_island",
    targetPos: 10
  },
  {
    id: 8,
    title: "장학금 수혜 및 부동산 배당",
    subtitle: "투자 성공",
    description: "우수 투자자로 선정되어 글로벌 투자 배당금 35만 원을 받습니다.",
    icon: "📈",
    type: "money_gain",
    amount: 35
  },
  {
    id: 9,
    title: "사회복지기금 전액 수령",
    subtitle: "기금 대박 수령",
    description: "그동안 적립된 사회복지기금 금고의 모든 돈을 전액 지급받습니다!",
    icon: "🏦",
    type: "jackpot"
  },
  {
    id: 10,
    title: "해외 초청 강연료",
    subtitle: "글로벌 명사",
    description: "해외 명문 대학 초청 강연료로 20만 원을 수령합니다.",
    icon: "🎤",
    type: "money_gain",
    amount: 20
  },
  {
    id: 11,
    title: "과속 운전 범칙금 납부",
    subtitle: "교통 법규 위반",
    description: "고속도로 과속 단속에 적발되어 범칙금 20만 원을 납부합니다.",
    icon: "🚓",
    type: "money_loss",
    amount: 20
  },
  {
    id: 12,
    title: "정밀 건강검진 및 병원비",
    subtitle: "의료비 지출",
    description: "종합병원 정밀 건강검진 및 치료비 30만 원을 납부합니다.",
    icon: "🏥",
    type: "money_loss",
    amount: 30
  },
  {
    id: 13,
    title: "건물 긴급 보수 및 방범비",
    subtitle: "부동산 유지보수",
    description: "소유 건물 유지보수 및 안전 관리 비용 20만 원을 납부합니다.",
    icon: "🔧",
    type: "money_loss",
    amount: 20
  },
  {
    id: 14,
    title: "유니세프 희망 나눔 기부",
    subtitle: "사랑의 모금",
    description: "세계 어린이 구호를 위해 사회복지기금에 20만 원을 후원합니다.",
    icon: "💝",
    type: "donation",
    amount: 20
  }
];

export function getRandomGoldenKey(): GoldenKeyCard {
  const idx = Math.floor(Math.random() * GOLDEN_KEYS.length);
  return GOLDEN_KEYS[idx];
}
