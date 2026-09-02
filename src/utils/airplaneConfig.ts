export type AirplaneColorId = 'red' | 'blue' | 'white' | 'yellow';

export interface AirplaneConfig {
  id: AirplaneColorId;
  name: string;
  koreanName: string;
  primaryColor: string;
  glowColor: string;
  secondaryColor: string;
  wingColor: string;
  cockpitColor: string;
  textColor: string;
  badgeBg: string;
  borderClass: string;
  description: string;
}

export const AIRPLANE_CONFIGS: Record<AirplaneColorId, AirplaneConfig> = {
  red: {
    id: 'red',
    name: 'Red Jet',
    koreanName: '빨간 비행기',
    primaryColor: '#ef4444',
    glowColor: '#fca5a5',
    secondaryColor: '#b91c1c',
    wingColor: '#dc2626',
    cockpitColor: '#fee2e2',
    textColor: '#ffffff',
    badgeBg: 'bg-rose-500 text-white',
    borderClass: 'border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    description: '열정적이고 강렬한 승부수를 띄우는 레드 제트기'
  },
  blue: {
    id: 'blue',
    name: 'Blue Jet',
    koreanName: '파란 비행기',
    primaryColor: '#2563eb',
    glowColor: '#93c5fd',
    secondaryColor: '#1d4ed8',
    wingColor: '#1e40af',
    cockpitColor: '#dbeafe',
    textColor: '#ffffff',
    badgeBg: 'bg-blue-600 text-white',
    borderClass: 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]',
    description: '냉철하고 스마트한 자산 관리를 이끄는 블루 제트기'
  },
  white: {
    id: 'white',
    name: 'White Jet',
    koreanName: '하얀 비행기',
    primaryColor: '#f8fafc',
    glowColor: '#e2e8f0',
    secondaryColor: '#475569',
    wingColor: '#cbd5e1',
    cockpitColor: '#1e293b',
    textColor: '#0f172a',
    badgeBg: 'bg-slate-100 text-slate-900 border border-slate-300 font-bold',
    borderClass: 'border-slate-200 shadow-[0_0_20px_rgba(248,250,252,0.35)]',
    description: '순백의 깔끔함과 품격을 자랑하는 클래식 화이트 제트기'
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow Jet',
    koreanName: '노란 비행기',
    primaryColor: '#eab308',
    glowColor: '#fef08a',
    secondaryColor: '#a16207',
    wingColor: '#ca8a04',
    cockpitColor: '#713f12',
    textColor: '#ffffff',
    badgeBg: 'bg-amber-500 text-slate-950 font-black',
    borderClass: 'border-amber-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]',
    description: '황금빛 행운과 풍요로운 부를 가져오는 옐로우 제트기'
  }
};

export const AIRPLANE_COLOR_ORDER: AirplaneColorId[] = ['red', 'blue', 'white', 'yellow'];
