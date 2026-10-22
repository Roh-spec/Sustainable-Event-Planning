import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export const SproutIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 21V10" />
    <path d="M12 10C12 6.5 9 4.5 4 5C4 9.5 7 12 12 10Z" />
    <path d="M12 10C12 6.5 15 4.5 20 5C20 9.5 17 12 12 10Z" />
    <path d="M12 16C13.5 14.5 16 14.5 18 15.5" />
  </svg>
);

export const PlateIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <ellipse cx="12" cy="12" rx="9" ry="8" />
    <ellipse cx="12" cy="12" rx="5.5" ry="4.5" />
  </svg>
);

export const CupIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M6 5H18L16.5 18C16.3 19.5 15 20.5 13.5 20.5H10.5C9 20.5 7.7 19.5 7.5 18L6 5Z" />
    <path d="M5 5H19" />
    <path d="M9 2.5L9.5 5" />
    <path d="M14.5 2.5L14 5" />
  </svg>
);

export const ForkIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M6 3V9C6 10.5 7 11.5 8.5 11.5H9.5C11 11.5 12 10.5 12 9V3" />
    <path d="M9 3V9" />
    <path d="M9 11.5V21" />
    <path d="M17 3V21M17 3C15 5 15 8.5 17 11" />
  </svg>
);

export const BottleIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M10 2H14" />
    <path d="M10.5 2V5.5L8 8V20C8 21 8.8 22 10 22H14C15.2 22 16 21 16 20V8L13.5 5.5V2" />
    <line x1="8" y1="13" x2="16" y2="13" />
  </svg>
);

export const BinIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M5 7L6.5 20.5C6.6 21.3 7.3 22 8.1 22H15.9C16.7 22 17.4 21.3 17.5 20.5L19 7" />
    <path d="M3.5 7H20.5" />
    <path d="M9 7V4.5C9 3.7 9.7 3 10.5 3H13.5C14.3 3 15 3.7 15 4.5V7" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const BowlIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 8C3 15.5 7 19.5 12 19.5C17 19.5 21 15.5 21 8H3Z" />
    <line x1="8" y1="19.5" x2="16" y2="19.5" />
    <path d="M8 4.5C8.5 5.5 9 6 10 6" />
    <path d="M14 4.5C14.5 5.5 15 6 16 6" />
  </svg>
);

export const BagIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M5 8H19L17.5 21.5H6.5L5 8Z" />
    <path d="M9 8V5.5C9 3.8 10.3 2.5 12 2.5C13.7 2.5 15 3.8 15 5.5V8" />
    <line x1="9" y1="12" x2="15" y2="12" strokeDasharray="1.5 2" />
  </svg>
);

export const TrayIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 15L4.5 8H19.5L21 15H3Z" />
    <path d="M2 15H22V17C22 17.5 21.5 18 21 18H3C2.5 18 2 17.5 2 17V15Z" />
  </svg>
);

export const LedgerIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="12" y1="12" x2="17" y2="12" />
    <line x1="12" y1="16" x2="17" y2="16" />
  </svg>
);

export const ScaleIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <path d="M4 7L2 13C2 14.5 3 15.5 4.5 15.5C6 15.5 7 14.5 7 13L5 7" />
    <path d="M19 7L17 13C17 14.5 18 15.5 19.5 15.5C21 15.5 22 14.5 22 13L20 7" />
  </svg>
);

/* Event type line illustrations */
export const HackathonMark: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="5" y="6" width="22" height="16" rx="2" />
    <line x1="10" y1="13" x2="12" y2="15" />
    <line x1="12" y1="15" x2="10" y2="17" />
    <line x1="15" y1="17" x2="21" y2="17" />
    <line x1="12" y1="22" x2="20" y2="22" />
    <line x1="16" y1="22" x2="16" y2="26" />
    <line x1="10" y1="26" x2="22" y2="26" />
  </svg>
);

export const WorkshopMark: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="16" cy="11" r="5" />
    <path d="M7 26C7 21 11 18 16 18C21 18 25 21 25 26" />
    <path d="M22 8L26 5M26 5L28 8M26 5V12" />
  </svg>
);

export const CulturalMark: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 24V10L24 6V20" />
    <ellipse cx="9" cy="24" rx="4" ry="3" />
    <ellipse cx="21" cy="20" rx="4" ry="3" />
    <line x1="12" y1="13" x2="24" y2="9" />
  </svg>
);

export const SportsMark: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="16" cy="16" r="10" />
    <path d="M16 6C13 10 13 22 16 26" />
    <path d="M16 6C19 10 19 22 16 26" />
    <line x1="6" y1="16" x2="26" y2="16" />
  </svg>
);

export const ConferenceMark: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M6 7H26V19C26 20.1 25.1 21 24 21H8C6.9 21 6 20.1 6 19V7Z" />
    <line x1="16" y1="21" x2="16" y2="26" />
    <line x1="11" y1="26" x2="21" y2="26" />
    <circle cx="16" cy="13" r="2.5" />
  </svg>
);

export const SocialMark: React.FC<IconProps> = ({ className = "w-6 h-6", size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M16 24C16 24 7 18 7 12C7 8.5 9.5 6 13 6C15 6 16 7 16 7C16 7 17 6 19 6C22.5 6 25 8.5 25 12C25 18 16 24 16 24Z" />
  </svg>
);
