/**
 * Symbole MyTug — étoile zellige à 8 branches fusionnée avec une roue de
 * gouvernail (identité "architecture marocaine × marine"). Le fond hérite de
 * `currentColor` via la classe passée par l'appelant ; le tracé blanc forme
 * le moyeu et les rayons de la roue.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="16,1 18.5,10 26.6,5.4 22,13.5 31,16 22,18.5 26.6,26.6 18.5,22 16,31 13.5,22 5.4,26.6 10,18.5 1,16 10,13.5 5.4,5.4 13.5,10"
        fill="currentColor"
      />
      <circle cx="16" cy="16" r="5" fill="none" stroke="white" strokeWidth="1.2" />
      <g stroke="white" strokeWidth="1.2">
        <line x1="16" y1="11" x2="16" y2="9" />
        <line x1="16" y1="21" x2="16" y2="23" />
        <line x1="11" y1="16" x2="9" y2="16" />
        <line x1="21" y1="16" x2="23" y2="16" />
      </g>
      <circle cx="16" cy="16" r="1.8" fill="white" />
    </svg>
  );
}
