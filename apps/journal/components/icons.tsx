import type { SVGProps } from "react";

/* Jeu d'icônes maison : même grille 24, même épaisseur de trait,
   mêmes extrémités arrondies. Dessiné ici plutôt qu'importé pour
   garder une cohérence stricte avec le reste de l'interface. */

type P = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconSun = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M3 12h2M19 12h2M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4" />
  </Base>
);

export const IconWeek = (p: P) => (
  <Base {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 2.8v3.4M16 2.8v3.4" />
    <path d="M7.5 13.5h3M13.5 13.5h3M7.5 17h3" />
  </Base>
);

export const IconFlame = (p: P) => (
  <Base {...p}>
    {/* L'encoche en haut à gauche est ce qui distingue une flamme d'une
        goutte d'eau à 17 px — tracé retenu après comparaison rendue. */}
    <path d="M12 2.6c3.6 3.2 5.6 6 5.6 8.5a5.6 5.6 0 0 1-11.2 0c0-1.6.6-3.1 1.7-4.4.1 1.5.6 2.5 1.6 2.9-.2-2.6.6-4.9 2.3-7Z" />
  </Base>
);

export const IconTarget = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="4.4" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Base>
);

export const IconRepeat = (p: P) => (
  <Base {...p}>
    {/* Deux demi-cycles décalés : lisible jusqu'à 11 px, là où une
        double flèche enroulée devient une tache. */}
    <path d="M3.5 10.5V10a3.5 3.5 0 0 1 3.5-3.5h11" />
    <path d="m15 3.5 3.3 3-3.3 3" />
    <path d="M20.5 13.5v.5a3.5 3.5 0 0 1-3.5 3.5H6" />
    <path d="m9 20.5-3.3-3 3.3-3" />
  </Base>
);

export const IconBook = (p: P) => (
  <Base {...p}>
    <path d="M3.5 5.2c2.3-1.1 5.1-1.1 7.1.3v13.3c-2-1.4-4.8-1.4-7.1-.3Z" />
    <path d="M20.5 5.2c-2.3-1.1-5.1-1.1-7.1.3v13.3c2-1.4 4.8-1.4 7.1-.3Z" />
  </Base>
);

export const IconChart = (p: P) => (
  <Base {...p}>
    <path d="M3.5 20.2h17" />
    <path d="M6.5 20V13M11 20V5.5M15.5 20v-4.5M20 20v-9" />
  </Base>
);

export const IconCheck = (p: P) => (
  <Base {...p}>
    <path d="m4.5 12.5 4.8 4.8L19.5 7" />
  </Base>
);

export const IconPlus = (p: P) => (
  <Base {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Base>
);

export const IconX = (p: P) => (
  <Base {...p}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Base>
);

export const IconChevronLeft = (p: P) => (
  <Base {...p}>
    <path d="m14.5 5.5-7 6.5 7 6.5" />
  </Base>
);

export const IconChevronRight = (p: P) => (
  <Base {...p}>
    <path d="m9.5 5.5 7 6.5-7 6.5" />
  </Base>
);

export const IconArrowBack = (p: P) => (
  <Base {...p}>
    <path d="M10 5.5 3.5 12 10 18.5M3.5 12h17" />
  </Base>
);

export const IconPen = (p: P) => (
  <Base {...p}>
    <path d="M16.3 3.9a2.1 2.1 0 0 1 3 3L8.8 17.4l-4 1.1 1.1-4Z" />
    <path d="M14.6 5.6 18 9" />
  </Base>
);

export const IconClock = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.4V12l3 1.7" />
  </Base>
);

export const IconLayers = (p: P) => (
  <Base {...p}>
    <path d="m12 3.2 8.2 4.3L12 11.8 3.8 7.5Z" />
    <path d="m3.8 12 8.2 4.3 8.2-4.3M3.8 16.5 12 20.8l8.2-4.3" />
  </Base>
);

export const IconSparkle = (p: P) => (
  <Base {...p}>
    <path d="M12 3.4 13.7 9l5.6 1.7-5.6 1.7L12 18l-1.7-5.6L4.7 10.7 10.3 9Z" />
    <path d="M18.6 4.2v2.6M19.9 5.5h-2.6" />
  </Base>
);

export const IconEye = (p: P) => (
  <Base {...p}>
    <path d="M2.6 12S6 6.2 12 6.2 21.4 12 21.4 12 18 17.8 12 17.8 2.6 12 2.6 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Base>
);

export const IconAlert = (p: P) => (
  <Base {...p}>
    <path d="M12 4.3 2.9 19.3h18.2Z" />
    <path d="M12 10v3.6M12 16.6h.01" />
  </Base>
);

export const IconInbox = (p: P) => (
  <Base {...p}>
    <path d="M3.3 13.3h4.4l1.4 2.6h5.8l1.4-2.6h4.4" />
    <path d="M5.6 5.2h12.8l2.3 8.1v4.2a2 2 0 0 1-2 2H5.3a2 2 0 0 1-2-2v-4.2Z" />
  </Base>
);

export const IconCompass = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="m15.4 8.6-2 4.8-4.8 2 2-4.8Z" />
  </Base>
);
