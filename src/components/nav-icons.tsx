/**
 * Icônes de navigation — traits simples (24x24, stroke) pour rester
 * cohérentes avec le symbole géométrique de la marque, sans détail figuratif
 * qui casserait l'échelle réduite du menu latéral.
 */
type IconProps = { className?: string };

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconFleet({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0" />
      <path d="M6 18V9l6-4 6 4v9" />
      <path d="M12 5v4" />
    </svg>
  );
}

export function IconAvailability({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconMissions({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  );
}

export function IconDocuments({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9.5 12.5h5M9.5 15.5h5" />
    </svg>
  );
}

export function IconNotifications({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 4a5 5 0 0 0-5 5v3.2c0 .6-.2 1.2-.6 1.7L5 16h14l-1.4-2.1c-.4-.5-.6-1.1-.6-1.7V9a5 5 0 0 0-5-5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconReports({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 20V6M9.5 20V10.5M15 20V4M20 20V13" />
    </svg>
  );
}

export function IconHistory({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M3 4.5V8h3.5" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8" r="2.6" />
      <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <path d="M16 8.2a2.4 2.4 0 1 1 0 4.8" />
      <path d="M15 14.3c1.8.4 3 2 3 4.7" />
    </svg>
  );
}

export function IconList({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="5.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="18" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 6h9M9.5 12h9M9.5 18h9" />
    </svg>
  );
}

export function IconAdmin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7 6.3 6.3" />
    </svg>
  );
}
