import React from 'react';
import { useAuth } from '../context/AuthContext';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textColor?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textColor = 'text-slate-900',
}) => {
  const { schoolInfo } = useAuth();
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    '2xl': 'w-36 h-36',
  };

  const dim = {
    sm: 36,
    md: 48,
    lg: 80,
    xl: 112,
    '2xl': 144,
  }[size];

  // If user uploaded a custom logo image and it loads without error
  if (schoolInfo?.logoUrl && schoolInfo.logoUrl.trim() !== '' && !imgError) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={schoolInfo.logoUrl}
          alt={schoolInfo.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์'}
          onError={() => setImgError(true)}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-amber-400 shadow-md bg-white shrink-0`}
          referrerPolicy="no-referrer"
        />
        {showText && (
          <div className="flex flex-col min-w-0">
            <span className={`font-extrabold ${textColor} leading-tight truncate`}>
              {schoolInfo.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {schoolInfo.schoolSubName || 'LMS-KPS ออนไลน์ (คพศ)'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Official Emblem of BANKHLONGPHLU PRACHASAN SCHOOL (kps.jpg)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} shrink-0 drop-shadow-md select-none`}
        aria-label="ตราสัญลักษณ์โรงเรียนบ้านคลองพลูประชาสรรค์ (คพศ)"
      >
        <defs>
          {/* Gold Gradients */}
          <linearGradient id="kpsGoldMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          <linearGradient id="kpsGoldRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FCD34D" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="kpsYellowRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          <linearGradient id="kpsPinkRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#BE185D" />
          </linearGradient>

          <linearGradient id="kpsInnerField" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFF7ED" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>

          <filter id="kpsDropShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.35" />
          </filter>

          <filter id="kpsRibbonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#78350F" floodOpacity="0.4" />
          </filter>

          {/* Curved Text Path for School Name */}
          {/* Arc sweeping along the bottom from left to right */}
          <path
            id="kpsTextArc"
            d="M 28 100 A 72 72 0 0 0 172 100"
            fill="none"
          />
        </defs>

        {/* 1. Outer Delicate Golden Halo / Ring */}
        <circle cx="100" cy="100" r="95" stroke="url(#kpsGoldMain)" strokeWidth="2.5" fill="none" opacity="0.85" />
        <circle cx="100" cy="100" r="91" fill="#FFFFFF" />

        {/* 2. English School Name Curved Text at Lower Rim */}
        <text
          fill="#854D0E"
          fontSize="8.5"
          fontWeight="800"
          fontFamily="'Arial', 'Prompt', sans-serif"
          letterSpacing="1.2"
        >
          <textPath href="#kpsTextArc" startOffset="50%" textAnchor="middle">
            BANKHLONGPHLU PRACHASAN SCHOOL
          </textPath>
        </text>

        {/* 3. Bright Yellow Concentric Ring */}
        <circle cx="100" cy="94" r="66" fill="url(#kpsYellowRing)" stroke="#F59E0B" strokeWidth="1" filter="url(#kpsDropShadow)" />

        {/* 4. Vivid Magenta / Pink Concentric Ring */}
        <circle cx="100" cy="94" r="54" fill="url(#kpsPinkRing)" stroke="#BE185D" strokeWidth="1" />

        {/* 5. Inner Warm Cream Ground */}
        <circle cx="100" cy="94" r="46" fill="url(#kpsInnerField)" />

        {/* 6. Central Royal Thai Ministry / OBEC Seal (ตราสพฐ. และมงกุฎบัวทอง) */}
        <g transform="translate(100, 93) scale(0.68)">
          {/* Glow backdrop */}
          <circle cx="0" cy="0" r="42" fill="#FEF3C7" opacity="0.6" />

          {/* Flame / Kranok Aureole (ยอดฉัตร/เปลวกนก) */}
          <path
            d="M0 -56 C-6 -44 -14 -32 -14 -20 C-14 -10 -8 -4 0 -4 C8 -4 14 -10 14 -20 C14 -32 6 -44 0 -56 Z"
            fill="url(#kpsGoldMain)"
          />
          <path
            d="M-12 -38 C-24 -28 -28 -14 -22 -2 C-18 6 -10 6 -4 2 C-10 -8 -8 -22 -12 -38 Z"
            fill="url(#kpsGoldMain)"
          />
          <path
            d="M12 -38 C24 -28 28 -14 22 -2 C18 6 10 6 4 2 C10 -8 8 -22 12 -38 Z"
            fill="url(#kpsGoldMain)"
          />

          {/* Dharmachakra / Sun Wheel at Upper Peak */}
          <circle cx="0" cy="-36" r="7" fill="#78350F" stroke="#FDE047" strokeWidth="1.5" />
          <circle cx="0" cy="-36" r="3" fill="#FACC15" />
          {/* Wheel spokes */}
          <line x1="0" y1="-43" x2="0" y2="-29" stroke="#FDE047" strokeWidth="1" />
          <line x1="-7" y1="-36" x2="7" y2="-36" stroke="#FDE047" strokeWidth="1" />
          <line x1="-5" y1="-41" x2="5" y2="-31" stroke="#FDE047" strokeWidth="1" />
          <line x1="-5" y1="-31" x2="5" y2="-41" stroke="#FDE047" strokeWidth="1" />

          {/* Central Heart Seal Shield (กรอบลายกนกพระปรมาภิไธย/ตราสพฐ.) */}
          <path
            d="M0 -22 C-18 -22 -26 -6 -26 12 C-26 28 -12 38 0 44 C12 38 26 28 26 12 C26 -6 18 -22 0 -22 Z"
            fill="#7F1D1D"
            stroke="url(#kpsGoldMain)"
            strokeWidth="2"
          />

          {/* Inner Intricate Thai Monogram (ตรามหามงกุฎ / ภปร / ตราสพฐ.) */}
          <path
            d="M0 -14 C-10 -14 -16 -2 -16 10 C-16 22 -6 28 0 32 C6 28 16 22 16 10 C16 -2 10 -14 0 -14 Z"
            fill="#FFFBEB"
          />
          {/* Intricate Gold Inscription Details */}
          <path
            d="M-8 8 C-8 -4 0 -10 0 -10 C0 -10 8 -4 8 8 C8 16 2 24 0 26 C-2 24 -8 16 -8 8 Z"
            fill="url(#kpsGoldMain)"
            stroke="#92400E"
            strokeWidth="0.8"
          />
          <path
            d="M-5 10 C-5 4 0 0 0 0 C0 0 5 4 5 10 C5 16 0 20 0 20 C0 20 -5 16 -5 10 Z"
            fill="#7F1D1D"
          />
          <circle cx="0" cy="10" r="2.5" fill="#FDE047" />

          {/* Base Lotus Petals (ฐานบัวรองรับ) */}
          <path
            d="M-22 36 C-14 30 -6 32 0 35 C6 32 14 30 22 36 C16 43 0 46 0 46 C0 46 -16 43 -22 36 Z"
            fill="url(#kpsGoldMain)"
            stroke="#78350F"
            strokeWidth="1"
          />
          {/* Green Lotus leaves below */}
          <path
            d="M-24 40 C-16 46 0 48 0 48 C0 48 16 46 24 40 C18 50 0 52 0 52 C0 52 -18 50 -24 40 Z"
            fill="#15803D"
            stroke="#14532D"
            strokeWidth="0.8"
          />

          {/* Ribbon arc at base "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน" */}
          <path
            d="M-28 47 Q0 58 28 47 L27 52 Q0 63 -28 52 Z"
            fill="#1E293B"
            stroke="url(#kpsGoldMain)"
            strokeWidth="0.8"
          />
          <circle cx="-25" cy="50" r="1.5" fill="#FCD34D" />
          <circle cx="25" cy="50" r="1.5" fill="#FCD34D" />
        </g>

        {/* 7. Bottom 3D Embossed Golden Ribbon Plaque with Thai Acronym "คพศ" */}
        <g filter="url(#kpsRibbonGlow)">
          {/* Golden Ribbon Base Banner */}
          <path
            d="M 48 152 
               C 62 146, 80 143, 100 143 
               C 120 143, 138 146, 152 152 
               L 156 172 
               C 138 184, 118 188, 100 188 
               C 82 188, 62 184, 44 172 
               Z"
            fill="url(#kpsGoldRibbon)"
            stroke="#78350F"
            strokeWidth="2.5"
          />

          {/* Inner Golden Bevel Highlight */}
          <path
            d="M 52 154 
               C 65 149, 82 146, 100 146 
               C 118 146, 135 149, 148 154 
               L 151 169 
               C 135 180, 117 184, 100 184 
               C 83 184, 65 180, 49 169 
               Z"
            fill="none"
            stroke="#FEF08A"
            strokeWidth="1.2"
          />

          {/* Thai Monogram / Acronym "คพศ" */}
          {/* Shadow behind letters */}
          <text
            x="100"
            y="173"
            textAnchor="middle"
            fontSize="26"
            fontWeight="900"
            fontFamily="'Sarabun', 'Prompt', 'Thonburi', sans-serif"
            fill="#451A03"
            letterSpacing="2"
            opacity="0.8"
          >
            คพศ
          </text>

          {/* Foreground 3D Golden text "คพศ" */}
          <text
            x="100"
            y="171.5"
            textAnchor="middle"
            fontSize="26"
            fontWeight="900"
            fontFamily="'Sarabun', 'Prompt', 'Thonburi', sans-serif"
            fill="#FFFBEB"
            stroke="#78350F"
            strokeWidth="1.5"
            letterSpacing="2"
            paintOrder="stroke fill"
          >
            คพศ
          </text>
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className={`font-extrabold ${textColor} leading-tight truncate`}>
            {schoolInfo?.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์'}
          </span>
          <span className="text-[11px] text-slate-500 font-medium truncate">
            {schoolInfo?.schoolSubName || 'ระบบจัดการเรียนรู้และคลังข้อสอบออนไลน์ (คพศ)'}
          </span>
        </div>
      )}
    </div>
  );
};
