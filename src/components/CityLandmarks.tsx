import React from 'react';

export interface LandmarkProps {
  spaceId: number;
  cityName: string;
  color: string;
  glowColor?: string;
}

export const CityLandmarkIcon: React.FC<LandmarkProps> = ({
  spaceId,
  cityName,
  color,
  glowColor = '#ffffff'
}) => {
  // Specific Landmark SVG representations for iconic Blue Marble cities
  switch (spaceId) {
    // 39: 서울 (N서울타워 & 숭례문)
    case 39:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* N서울타워 */}
          <rect x="15" y="10" width="2" height="18" fill={color} />
          <polygon points="16,2 14,8 18,8" fill={color} />
          <circle cx="16" cy="11" r="4.5" fill={color} stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="16" cy="11" r="2.5" fill="#fef08a" />
          <path d="M11,28 L21,28 L19,22 L13,22 Z" fill={color} opacity="0.9" />
          <circle cx="16" cy="2" r="1" fill="#ef4444" />
        </svg>
      );

    // 37: 뉴욕 (자유의 여신상)
    case 37:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 자유의 여신상 실루엣 & 횃불 */}
          <polygon points="12,28 20,28 18,18 14,18" fill={color} />
          <rect x="14" y="10" width="4" height="9" fill={color} rx="1" />
          <circle cx="16" cy="8" r="2.5" fill={color} />
          {/* 왕관 가시 */}
          <polygon points="16,4 14,7 18,7" fill="#fef08a" />
          {/* 횃불 팔 */}
          <path d="M18,11 L23,5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="23" cy="4" r="2" fill="#f59e0b" />
          <circle cx="23" cy="4" r="1" fill="#fef08a" />
          {/* 독립선언서 왼팔 */}
          <rect x="11" y="12" width="2.5" height="4" fill="#f8fafc" stroke={color} strokeWidth="0.5" />
        </svg>
      );

    // 36: 런던 (빅벤 시계탑)
    case 36:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 빅벤 본체 */}
          <rect x="12" y="10" width="8" height="18" fill={color} rx="0.5" />
          {/* 첨탑 */}
          <polygon points="16,2 11,10 21,10" fill={color} />
          {/* 시계판 */}
          <circle cx="16" cy="14" r="2.8" fill="#fef08a" stroke="#000000" strokeWidth="0.5" />
          <line x1="16" y1="14" x2="16" y2="12.5" stroke="#000000" strokeWidth="0.6" strokeLinecap="round" />
          <line x1="16" y1="14" x2="17.2" y2="14" stroke="#000000" strokeWidth="0.6" strokeLinecap="round" />
          {/* 세로 리브 홈 */}
          <line x1="14" y1="18" x2="14" y2="28" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
          <line x1="18" y1="18" x2="18" y2="28" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
        </svg>
      );

    // 34: 로마 (콜로세움)
    case 34:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 원형 경기장 본체 */}
          <path d="M6,26 C6,16 26,16 26,26 Z" fill={color} />
          <rect x="6" y="24" width="20" height="4" fill={color} />
          {/* 아치형 창문들 */}
          <rect x="9" y="21" width="2.5" height="4" rx="1.2" fill="#1e293b" />
          <rect x="13" y="20" width="2.5" height="5" rx="1.2" fill="#1e293b" />
          <rect x="16.5" y="20" width="2.5" height="5" rx="1.2" fill="#1e293b" />
          <rect x="20.5" y="21" width="2.5" height="4" rx="1.2" fill="#1e293b" />
          {/* 2층 아치 */}
          <circle cx="12" cy="16" r="1" fill="#fef08a" />
          <circle cx="16" cy="15" r="1" fill="#fef08a" />
          <circle cx="20" cy="16" r="1" fill="#fef08a" />
        </svg>
      );

    // 33: 파리 (에펠탑)
    case 33:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 에펠탑 아치 & 철골 */}
          <path d="M16,3 L13,20 L8,28 L11,28 L13.5,23 L18.5,23 L21,28 L24,28 L19,20 Z" fill={color} />
          <path d="M13.5,23 Q16,19 18.5,23" stroke="#ffffff" strokeWidth="0.8" fill="none" />
          <rect x="12" y="19" width="8" height="1.5" fill="#fef08a" />
          <rect x="13.5" y="11" width="5" height="1.2" fill="#fef08a" />
          <circle cx="16" cy="3" r="1" fill="#f59e0b" />
        </svg>
      );

    // 31: 도쿄 (도쿄 타워)
    case 31:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          <polygon points="16,3 12,28 20,28" fill={color} />
          <circle cx="16" cy="14" r="3" fill="#ffffff" stroke={color} strokeWidth="1" />
          <circle cx="16" cy="14" r="1.5" fill="#ef4444" />
          <line x1="16" y1="3" x2="16" y2="1" stroke="#f59e0b" strokeWidth="1" />
          <path d="M13,24 Q16,21 19,24" stroke="#ffffff" strokeWidth="0.8" fill="none" />
        </svg>
      );

    // 24: 시드니 (오페라 하우스)
    case 24:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 조개 모양 쉘 3중첩 */}
          <path d="M5,26 Q10,12 16,26 Z" fill={color} stroke="#ffffff" strokeWidth="0.5" />
          <path d="M11,26 Q17,8 24,26 Z" fill={color} opacity="0.95" stroke="#ffffff" strokeWidth="0.5" />
          <path d="M18,26 Q23,14 28,26 Z" fill={color} opacity="0.9" stroke="#ffffff" strokeWidth="0.5" />
          <rect x="4" y="26" width="25" height="2" fill="#0f172a" rx="0.5" />
        </svg>
      );

    // 8: 카이로 (피라미드 & 스핑크스)
    case 8:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 대피라미드 */}
          <polygon points="16,6 4,26 28,26" fill={color} />
          <polygon points="16,6 20,26 28,26" fill="#000000" opacity="0.25" />
          {/* 황금빛 카프스톤 */}
          <polygon points="16,6 13,11 19,11" fill="#fef08a" />
          {/* 태양 */}
          <circle cx="25" cy="8" r="3" fill="#f59e0b" />
        </svg>
      );

    // 11: 아테네 (파르테논 신전)
    case 11:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 박공 지붕 */}
          <polygon points="16,7 6,13 26,13" fill={color} />
          {/* 기둥 5개 */}
          <rect x="7" y="13" width="2" height="12" fill={color} />
          <rect x="11.5" y="13" width="2" height="12" fill={color} />
          <rect x="15" y="13" width="2" height="12" fill={color} />
          <rect x="18.5" y="13" width="2" height="12" fill={color} />
          <rect x="23" y="13" width="2" height="12" fill={color} />
          {/* 기단 */}
          <rect x="5" y="25" width="22" height="3" fill={color} rx="0.5" />
        </svg>
      );

    // 16: 베른 (치트글로게 시계탑 / 스위스 샬레)
    case 16:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 탑 본체 */}
          <rect x="11" y="11" width="10" height="16" fill={color} rx="0.5" />
          {/* 스위스 첨탑 지붕 */}
          <polygon points="16,3 10,11 22,11" fill={color} />
          {/* 스위스 십자가 문양 */}
          <rect x="13.5" y="15" width="5" height="1.8" fill="#ffffff" />
          <rect x="15.1" y="13.4" width="1.8" height="5" fill="#ffffff" />
          {/* 아치 문 */}
          <path d="M13.5,27 C13.5,23 18.5,23 18.5,27 Z" fill="#0f172a" />
        </svg>
      );

    // 18: 베를린 (브란덴부르크 문 & 베를린 곰)
    case 18:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 상단 콰드리가 조각상 자리 */}
          <rect x="8" y="9" width="16" height="3" fill="#fef08a" rx="0.5" />
          {/* 기둥 6개 */}
          <rect x="8" y="12" width="1.8" height="13" fill={color} />
          <rect x="11" y="12" width="1.8" height="13" fill={color} />
          <rect x="14" y="12" width="1.8" height="13" fill={color} />
          <rect x="16.2" y="12" width="1.8" height="13" fill={color} />
          <rect x="19.2" y="12" width="1.8" height="13" fill={color} />
          <rect x="22.2" y="12" width="1.8" height="13" fill={color} />
          {/* 기단 */}
          <rect x="6" y="25" width="20" height="3" fill={color} rx="0.5" />
        </svg>
      );

    // 5: 제주도 (돌하르방 & 한라산)
    case 5:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 한라산 배경 */}
          <polygon points="16,8 5,26 27,26" fill={color} opacity="0.6" />
          {/* 감귤 */}
          <circle cx="23" cy="22" r="3.5" fill="#f97316" />
          <circle cx="23" cy="18.5" r="1" fill="#15803d" />
          {/* 돌하르방 실루엣 */}
          <rect x="10" y="13" width="7" height="13" rx="3.5" fill={color} stroke="#ffffff" strokeWidth="0.6" />
          <circle cx="12" cy="16" r="1" fill="#ffffff" />
          <circle cx="15" cy="16" r="1" fill="#ffffff" />
        </svg>
      );

    // Default Universal Iconic Spire Landmark
    default:
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md">
          {/* 황금빛 피라미드 첨탑 지붕 */}
          <polygon points="16,3 10,12 22,12" fill={color} />
          <circle cx="16" cy="3" r="1.5" fill="#fef08a" />
          {/* 고층 타워 본체 */}
          <rect x="11" y="12" width="10" height="14" fill={color} rx="0.5" />
          {/* 창문 그리드 */}
          <rect x="13" y="14" width="2" height="2" fill="#fef08a" rx="0.3" />
          <rect x="17" y="14" width="2" height="2" fill="#fef08a" rx="0.3" />
          <rect x="13" y="18" width="2" height="2" fill="#fef08a" rx="0.3" />
          <rect x="17" y="18" width="2" height="2" fill="#fef08a" rx="0.3" />
          <rect x="13" y="22" width="2" height="2" fill="#fef08a" rx="0.3" />
          <rect x="17" y="22" width="2" height="2" fill="#fef08a" rx="0.3" />
          {/* 기단 */}
          <rect x="8" y="26" width="16" height="3" fill={color} rx="0.5" />
        </svg>
      );
  }
};
