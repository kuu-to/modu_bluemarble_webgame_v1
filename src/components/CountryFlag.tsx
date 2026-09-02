import React, { useState } from 'react';

// ISO 3166-1 alpha-2 country codes mapped to space IDs
export const CITY_COUNTRY_CODES: Record<number, { code: string; countryName: string; fallbackIcon: string }> = {
  1: { code: 'tw', countryName: '대만', fallbackIcon: '🏮' },       // 타이베이
  3: { code: 'cn', countryName: '중국', fallbackIcon: '🏯' },       // 베이징
  4: { code: 'ph', countryName: '필리핀', fallbackIcon: '🌴' },     // 마닐라
  5: { code: 'kr', countryName: '대한민국', fallbackIcon: '🍊' },   // 제주도
  6: { code: 'sg', countryName: '싱가포르', fallbackIcon: '🦁' },   // 싱가포르
  8: { code: 'eg', countryName: '이집트', fallbackIcon: '🏺' },     // 카이로
  9: { code: 'tr', countryName: '튀르키예', fallbackIcon: '🕌' },   // 이스탄불
  11: { code: 'gr', countryName: '그리스', fallbackIcon: '🏛️' },    // 아테네
  13: { code: 'dk', countryName: '덴마크', fallbackIcon: '🧜‍♀️' },    // 코펜하겐
  14: { code: 'se', countryName: '스웨덴', fallbackIcon: '❄️' },    // 스톡홀름
  15: { code: 'fr', countryName: '프랑스/영국', fallbackIcon: '✈️' }, // 콩코드
  16: { code: 'ch', countryName: '스위스', fallbackIcon: '🏔️' },    // 베른
  18: { code: 'de', countryName: '독일', fallbackIcon: '🐻' },      // 베를린
  19: { code: 'ca', countryName: '캐나다', fallbackIcon: '🍁' },    // 오타와
  21: { code: 'ar', countryName: '아르헨티나', fallbackIcon: '💃' }, // 부에노스아이레스
  23: { code: 'br', countryName: '브라질', fallbackIcon: '⚽' },     // 상파울루
  24: { code: 'au', countryName: '호주', fallbackIcon: '🦘' },      // 시드니
  25: { code: 'kr', countryName: '대한민국', fallbackIcon: '🌊' },   // 부산
  26: { code: 'us', countryName: '미국 (하와이)', fallbackIcon: '🌺' }, // 하와이
  27: { code: 'pt', countryName: '포르투갈', fallbackIcon: '⛵' },   // 리스본
  28: { code: 'gb', countryName: '영국', fallbackIcon: '🚢' },      // 퀸 엘리자베스
  29: { code: 'es', countryName: '스페인', fallbackIcon: '🐂' },    // 마드리드
  31: { code: 'jp', countryName: '일본', fallbackIcon: '🗼' },      // 도쿄
  32: { code: 'us', countryName: '미국', fallbackIcon: '🛰️' },      // 콜롬비아호
  33: { code: 'fr', countryName: '프랑스', fallbackIcon: '🥖' },    // 파리
  34: { code: 'it', countryName: '이탈리아', fallbackIcon: '🍕' },  // 로마
  36: { code: 'gb', countryName: '영국', fallbackIcon: '💂' },      // 런던
  37: { code: 'us', countryName: '미국', fallbackIcon: '🗽' },      // 뉴욕
  39: { code: 'kr', countryName: '대한민국', fallbackIcon: '👑' },   // 서울
};

// Pure vector SVG components for pixel-perfect instant rendering without external network latency
export const SVG_FLAGS: Record<string, React.ReactNode> = {
  // 대한민국 (Korea) - 태극기
  kr: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80 bg-white">
      <rect width="36" height="24" fill="#ffffff" />
      {/* 4괘 간이 표현 */}
      <circle cx="18" cy="12" r="6" fill="#c60c30" />
      <path d="M12,12 A6,6 0 0,0 24,12 A3,3 0 0,0 18,12 A3,3 0 0,1 12,12 Z" fill="#003478" />
      {/* 4괘 막대 */}
      <rect x="5" y="4" width="3" height="1" fill="#000" transform="rotate(35 6.5 4.5)" />
      <rect x="5" y="6" width="3" height="1" fill="#000" transform="rotate(35 6.5 6.5)" />
      <rect x="28" y="17" width="3" height="1" fill="#000" transform="rotate(35 29.5 17.5)" />
      <rect x="28" y="19" width="3" height="1" fill="#000" transform="rotate(35 29.5 19.5)" />
    </svg>
  ),
  // 일본 (Japan)
  jp: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80 bg-white">
      <rect width="36" height="24" fill="#ffffff" />
      <circle cx="18" cy="12" r="6.5" fill="#bc002d" />
    </svg>
  ),
  // 미국 (USA)
  us: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      {/* 13줄 스트라이프 */}
      <rect width="36" height="24" fill="#b22234" />
      <rect y="1.84" width="36" height="1.84" fill="#ffffff" />
      <rect y="5.52" width="36" height="1.84" fill="#ffffff" />
      <rect y="9.2" width="36" height="1.84" fill="#ffffff" />
      <rect y="12.88" width="36" height="1.84" fill="#ffffff" />
      <rect y="16.56" width="36" height="1.84" fill="#ffffff" />
      <rect y="20.24" width="36" height="1.84" fill="#ffffff" />
      {/* 캔톤 (Blue box with stars hint) */}
      <rect width="14.4" height="12.92" fill="#3c3b6e" />
      <circle cx="4" cy="3.5" r="0.8" fill="#ffffff" />
      <circle cx="7.2" cy="3.5" r="0.8" fill="#ffffff" />
      <circle cx="10.4" cy="3.5" r="0.8" fill="#ffffff" />
      <circle cx="5.6" cy="6.5" r="0.8" fill="#ffffff" />
      <circle cx="8.8" cy="6.5" r="0.8" fill="#ffffff" />
      <circle cx="4" cy="9.5" r="0.8" fill="#ffffff" />
      <circle cx="7.2" cy="9.5" r="0.8" fill="#ffffff" />
      <circle cx="10.4" cy="9.5" r="0.8" fill="#ffffff" />
    </svg>
  ),
  // 프랑스 (France)
  fr: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="12" height="24" fill="#002654" />
      <rect x="12" width="12" height="24" fill="#ffffff" />
      <rect x="24" width="12" height="24" fill="#ce1126" />
    </svg>
  ),
  // 독일 (Germany)
  de: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="8" fill="#000000" />
      <rect y="8" width="36" height="8" fill="#dd0000" />
      <rect y="16" width="36" height="8" fill="#ffce00" />
    </svg>
  ),
  // 이탈리아 (Italy)
  it: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="12" height="24" fill="#009246" />
      <rect x="12" width="12" height="24" fill="#ffffff" />
      <rect x="24" width="12" height="24" fill="#ce2b37" />
    </svg>
  ),
  // 영국 (UK) - 유니언 잭
  gb: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#012169" />
      <path d="M0,0 L36,24 M36,0 L0,24" stroke="#ffffff" strokeWidth="5" />
      <path d="M0,0 L36,24 M36,0 L0,24" stroke="#c8102e" strokeWidth="2.5" />
      <path d="M18,0 V24 M0,12 H36" stroke="#ffffff" strokeWidth="7" />
      <path d="M18,0 V24 M0,12 H36" stroke="#c8102e" strokeWidth="4.2" />
    </svg>
  ),
  // 스페인 (Spain)
  es: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="6" fill="#aa151b" />
      <rect y="6" width="36" height="12" fill="#f1bf00" />
      <rect y="18" width="36" height="6" fill="#aa151b" />
      <circle cx="10" cy="12" r="3" fill="#aa151b" opacity="0.6" />
    </svg>
  ),
  // 중국 (China)
  cn: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#de2910" />
      <polygon points="6,3 7.8,8.5 3.1,5.1 8.9,5.1 4.2,8.5" fill="#ffde00" />
      <circle cx="12" cy="3.5" r="0.8" fill="#ffde00" />
      <circle cx="14" cy="5.5" r="0.8" fill="#ffde00" />
      <circle cx="14" cy="8.5" r="0.8" fill="#ffde00" />
      <circle cx="12" cy="10.5" r="0.8" fill="#ffde00" />
    </svg>
  ),
  // 대만 (Taiwan)
  tw: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#fe0000" />
      <rect width="18" height="12" fill="#000095" />
      <circle cx="9" cy="6" r="3.2" fill="#ffffff" />
      <circle cx="9" cy="6" r="2.4" fill="#000095" />
      <circle cx="9" cy="6" r="1.8" fill="#ffffff" />
    </svg>
  ),
  // 싱가포르 (Singapore)
  sg: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="12" fill="#ed2939" />
      <rect y="12" width="36" height="12" fill="#ffffff" />
      <circle cx="7" cy="6" r="3.2" fill="#ffffff" />
      <circle cx="8" cy="6" r="3.2" fill="#ed2939" />
      <circle cx="10" cy="6" r="0.6" fill="#ffffff" />
    </svg>
  ),
  // 호주 (Australia)
  au: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#00008b" />
      {/* 캔톤 유니언잭 */}
      <g transform="scale(0.5)">
        <rect width="36" height="24" fill="#012169" />
        <path d="M0,0 L36,24 M36,0 L0,24" stroke="#ffffff" strokeWidth="5" />
        <path d="M0,0 L36,24 M36,0 L0,24" stroke="#c8102e" strokeWidth="2.5" />
        <path d="M18,0 V24 M0,12 H36" stroke="#ffffff" strokeWidth="7" />
        <path d="M18,0 V24 M0,12 H36" stroke="#c8102e" strokeWidth="4.2" />
      </g>
      {/* 남십자성 */}
      <circle cx="28" cy="6" r="0.9" fill="#ffffff" />
      <circle cx="24" cy="11" r="0.9" fill="#ffffff" />
      <circle cx="31" cy="11" r="0.9" fill="#ffffff" />
      <circle cx="27" cy="17" r="0.9" fill="#ffffff" />
      <circle cx="9" cy="18" r="1.8" fill="#ffffff" />
    </svg>
  ),
  // 캐나다 (Canada)
  ca: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="9" height="24" fill="#ff0000" />
      <rect x="9" width="18" height="24" fill="#ffffff" />
      <rect x="27" width="9" height="24" fill="#ff0000" />
      <polygon points="18,5 19.5,9.5 22,8.5 20.5,12 23.5,13.5 19.5,14.5 18.5,18 17.5,18 16.5,14.5 12.5,13.5 15.5,12 14,8.5 16.5,9.5" fill="#ff0000" />
    </svg>
  ),
  // 브라질 (Brazil)
  br: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#009739" />
      <polygon points="18,3 32,12 18,21 4,12" fill="#fedd00" />
      <circle cx="18" cy="12" r="5.2" fill="#012169" />
      <path d="M13,12 Q18,10 23,12" stroke="#ffffff" strokeWidth="0.8" fill="none" />
    </svg>
  ),
  // 아르헨티나 (Argentina)
  ar: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="8" fill="#74acdf" />
      <rect y="8" width="36" height="8" fill="#ffffff" />
      <rect y="16" width="36" height="8" fill="#74acdf" />
      <circle cx="18" cy="12" r="2.5" fill="#f6b40e" />
    </svg>
  ),
  // 스위스 (Switzerland)
  ch: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#d52b1e" />
      <rect x="15" y="6" width="6" height="12" fill="#ffffff" />
      <rect x="10" y="9" width="16" height="6" fill="#ffffff" />
    </svg>
  ),
  // 덴마크 (Denmark)
  dk: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#c60c30" />
      <rect x="11" width="4" height="24" fill="#ffffff" />
      <rect y="10" width="36" height="4" fill="#ffffff" />
    </svg>
  ),
  // 스웨덴 (Sweden)
  se: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#006aa7" />
      <rect x="11" width="4" height="24" fill="#fecc00" />
      <rect y="10" width="36" height="4" fill="#fecc00" />
    </svg>
  ),
  // 그리스 (Greece)
  gr: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#0d5eaf" />
      <rect y="2.66" width="36" height="2.66" fill="#ffffff" />
      <rect y="8" width="36" height="2.66" fill="#ffffff" />
      <rect y="13.33" width="36" height="2.66" fill="#ffffff" />
      <rect y="18.66" width="36" height="2.66" fill="#ffffff" />
      {/* 캔톤 십자가 */}
      <rect width="12" height="12" fill="#0d5eaf" />
      <rect x="4.5" width="3" height="12" fill="#ffffff" />
      <rect y="4.5" width="12" height="3" fill="#ffffff" />
    </svg>
  ),
  // 포르투갈 (Portugal)
  pt: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="14" height="24" fill="#046a38" />
      <rect x="14" width="22" height="24" fill="#da291c" />
      <circle cx="14" cy="12" r="4.2" fill="#ffdd00" stroke="#000" strokeWidth="0.5" />
      <circle cx="14" cy="12" r="2.6" fill="#ffffff" />
    </svg>
  ),
  // 튀르키예 (Turkey)
  tr: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="24" fill="#e30a17" />
      <circle cx="16" cy="12" r="5" fill="#ffffff" />
      <circle cx="17.4" cy="12" r="4" fill="#e30a17" />
      <polygon points="21,12 24,13 23,10 24.5,11.5 22,10.5" fill="#ffffff" />
    </svg>
  ),
  // 이집트 (Egypt)
  eg: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="8" fill="#ce1126" />
      <rect y="8" width="36" height="8" fill="#ffffff" />
      <rect y="16" width="36" height="8" fill="#000000" />
      {/* 살라딘 독수리 문장 */}
      <circle cx="18" cy="12" r="2" fill="#c09300" />
    </svg>
  ),
  // 필리핀 (Philippines)
  ph: (
    <svg viewBox="0 0 36 24" className="w-full h-full rounded-xs overflow-hidden shadow-xs border border-slate-300/80">
      <rect width="36" height="12" fill="#0038a8" />
      <rect y="12" width="36" height="12" fill="#ce1126" />
      <polygon points="0,0 15,12 0,24" fill="#ffffff" />
      <circle cx="5" cy="12" r="2" fill="#fcd116" />
    </svg>
  )
};

interface CountryFlagProps {
  spaceId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ spaceId, className = '', size = 'sm' }) => {
  const cityInfo = CITY_COUNTRY_CODES[spaceId];
  if (!cityInfo) return null;

  const { code } = cityInfo;
  const svgFlag = SVG_FLAGS[code];

  const sizeClasses = {
    sm: 'w-[22px] h-[15px] sm:w-[26px] sm:h-[17px]',
    md: 'w-7 h-4.5 sm:w-8 sm:h-5',
    lg: 'w-9 h-6 sm:w-10 sm:h-6.5'
  }[size];

  if (svgFlag) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 drop-shadow-xs transition-transform ${sizeClasses} ${className}`}
        title={`${cityInfo.countryName} 국기`}
      >
        {svgFlag}
      </div>
    );
  }

  return (
    <span className="text-xs sm:text-sm">{cityInfo.fallbackIcon}</span>
  );
};
