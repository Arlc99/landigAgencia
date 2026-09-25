import type { CSSProperties } from 'react';
import { ChevronRight, Video, ExternalLink } from 'lucide-react';

// En tu archivo primitives.tsx
export function MonogramLogo({ className = "" }: { className?: string }) {
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect 
        x="3" 
        y="3" 
        width="18" 
        height="18" 
        rx="4" 
        stroke="currentColor" 
        strokeWidth="1.5" 
      />
      <text 
        x="12" 
        y="16" 
        textAnchor="middle" 
        fill="currentColor" 
        fontSize="10" 
        fontWeight="bold" 
        fontFamily="sans-serif"
      >
        J
      </text>
    </svg>
  );
};
export function LogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} fill="white">
      <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
    </svg>
  );
}

export function VerMasButton({
  label = 'mas',
  full = false,
}: {
  label?: string;
  full?: boolean;
}) {
  return (
    <a
      href = "#contacto"
      
      rel="noopener noreferrer"
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-3 transition-all hover:bg-white/90 active:scale-[0.98] ${full ? 'w-full' : ''
        }`}
    >
     
       <ExternalLink className="w-4 h-4" />
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
    </a>
  );
}


export function AppleButton({
  label = 'Agendar cita',
  full = false,
}: {
  label?: string;
  full?: boolean;
}) {
  return (
    <a
      href="https://calendar.app.google/PJBNQ6vjdaXg6Twm6"
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-3 transition-all hover:bg-white/90 active:scale-[0.98] ${full ? 'w-full' : ''
        }`}
    >
      <Video className="w-4 h-4" />
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
    </a>
  );
}

export function SectionEyebrow({ label, tag }: { label: string; tag?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-2 text-sm text-white/70">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        {label}
      </span>
      {tag && (
        <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">
          {tag}
        </span>
      )}
    </div>
  );
}

export const gradientStyle: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'url(#c3-noise)',
};
