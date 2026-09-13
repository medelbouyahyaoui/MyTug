/**
 * Trame géométrique décorative (étoile zellige à 8 branches, répétée) —
 * à poser en fond absolu sur un conteneur `relative`. `currentColor` hérite
 * la teinte du parent ; l'opacité est réglée dans le tracé pour rester
 * discrète sur fond sombre comme clair.
 */
export function ZelligePattern({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="zellige-tile" width="44" height="44" patternUnits="userSpaceOnUse">
          <path
            d="M22 3 L26.5 17.5 L41 13.5 L30.5 24 L41 30.5 L26.5 26.5 L22 41 L17.5 26.5 L3 30.5 L13.5 24 L3 13.5 L17.5 17.5 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.16"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellige-tile)" />
    </svg>
  );
}
