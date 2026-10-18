// Referentiel d'exercices : muscles sollicites, description, focus, consignes.
//
// La table `exercices_muscles` existe depuis le depart mais n'a jamais ete
// peuplee (aucun seed, aucune UI n'appelait `remplacer`), donc la fiche
// d'exercice affichait toujours "detail musculaire non renseigne". Ce
// referentiel comble le manque sans migration : il est consulte en premier,
// la table ne sert plus que de surcharge manuelle.
//
// Appariement par nom normalise (sans accents ni ponctuation), cle la plus
// longue d'abord : "curl marteau" l'emporte sur "curl".

import type { GroupeMusculaire, MuscleDetail } from "./types";

export type FicheExercice = {
  /** Libelle canonique, affiche quand le nom saisi est une variante. */
  nom: string;
  /** Fragments de nom qui declenchent cette fiche, en minuscules sans accents. */
  cles: string[];
  primaires: MuscleDetail[];
  secondaires: MuscleDetail[];
  /** Ce que fait l'exercice, en une ou deux phrases. */
  description: string;
  /** La seule chose a chercher pendant la serie. */
  focus: string;
  consignes: string[];
  erreurs: string[];
};

export const REFERENTIEL: FicheExercice[] = [
  // ───────────────────────── Dos ─────────────────────────
  {
    nom: "Tractions",
    cles: ["traction", "pull up", "pullup"],
    primaires: ["grand_dorsal"],
    secondaires: ["biceps", "trapeze", "deltoide_posterieur", "avant_bras", "abdominaux"],
    description:
      "Le meilleur constructeur de largeur du dos. En pronation, le grand dorsal fait le gros du travail ; en supination, le biceps prend une part nettement plus grande.",
    focus: "Tirer avec les coudes vers les hanches, pas avec les mains.",
    consignes: [
      "Mains un peu plus larges que les épaules, pouces par-dessus la barre.",
      "Épaules basses avant de tirer : descendre les omoplates, puis monter.",
      "Monter jusqu'à ce que la gorge dépasse la barre, pas le menton.",
      "Descendre en 2 à 3 secondes, bras presque tendus sans relâcher les épaules.",
    ],
    erreurs: [
      "Partir épaules hautes : le dos ne s'engage pas, tout part dans les bras.",
      "Se balancer pour lancer le mouvement quand la force manque.",
    ],
  },
  {
    nom: "Tirage vertical",
    cles: ["tirage vertical", "tirage poitrine", "lat pulldown", "poulie haute"],
    primaires: ["grand_dorsal"],
    secondaires: ["biceps", "trapeze", "deltoide_posterieur", "avant_bras"],
    description:
      "La version chargeable des tractions : même trajectoire, mais la charge se règle au kilo près, ce qui en fait l'outil pour travailler le volume de dos.",
    focus: "Bomber la poitrine vers la barre pendant la descente.",
    consignes: [
      "Cuisses bien bloquées sous les boudins, buste incliné d'environ 15°.",
      "Tirer la barre vers le haut des pectoraux, coudes vers le bas.",
      "Marquer un temps d'arrêt en bas, omoplates serrées.",
      "Laisser remonter en contrôlant, épaules qui s'étirent en fin de course.",
    ],
    erreurs: [
      "Tirer derrière la nuque : contrainte inutile sur l'épaule pour aucun gain.",
      "Se renverser en arrière pour arracher la charge.",
    ],
  },
  {
    nom: "Rowing assis à la poulie",
    cles: ["rowing assis", "rowing poulie", "tirage horizontal", "seated row"],
    primaires: ["grand_dorsal", "trapeze"],
    secondaires: ["biceps", "deltoide_posterieur", "avant_bras", "ischio_jambiers"],
    description:
      "Travail d'épaisseur du dos. Le tirage horizontal recrute trapèzes moyens et rhomboïdes, que le tirage vertical laisse de côté.",
    focus: "Serrer les omoplates l'une contre l'autre en fin de tirage.",
    consignes: [
      "Dos droit, poitrine ouverte, légère flexion des genoux.",
      "Tirer la poignée vers le nombril, coudes rasant les côtes.",
      "Tenir une seconde avec les omoplates serrées.",
      "Laisser les bras s'allonger devant sans arrondir le bas du dos.",
    ],
    erreurs: [
      "Balancer le buste d'avant en arrière : ce sont les lombaires qui travaillent, pas le dos.",
      "Arrondir le dos au retour, sous la traction de la charge.",
    ],
  },
  {
    nom: "Rowing barre",
    cles: ["rowing barre", "rowing penche", "barbell row"],
    primaires: ["grand_dorsal", "trapeze"],
    secondaires: ["deltoide_posterieur", "biceps", "ischio_jambiers", "avant_bras"],
    description:
      "Le constructeur d'épaisseur le plus lourd. Buste penché, la chaîne postérieure entière doit tenir la position pendant que le dos tire.",
    focus: "Garder le buste à la même inclinaison du début à la fin.",
    consignes: [
      "Buste à environ 45°, dos gainé, regard vers le sol devant soi.",
      "Tirer la barre vers le nombril, coudes serrés.",
      "Descendre la barre en contrôle jusqu'aux bras tendus.",
    ],
    erreurs: [
      "Se redresser série après série : la charge est trop lourde.",
      "Arrondir le bas du dos sous la charge.",
    ],
  },
  {
    nom: "Soulevé de terre",
    cles: ["souleve de terre", "deadlift", "souleve terre"],
    primaires: ["ischio_jambiers", "fessiers", "trapeze"],
    secondaires: ["grand_dorsal", "quadriceps", "abdominaux", "avant_bras"],
    description:
      "Le mouvement qui charge le plus lourd de toute la salle. Chaîne postérieure complète, des mollets jusqu'aux trapèzes.",
    focus: "Pousser le sol avec les pieds plutôt que tirer la barre avec le dos.",
    consignes: [
      "Barre au-dessus du milieu du pied, tibias presque au contact.",
      "Dos plat, épaules légèrement en avant de la barre.",
      "Tendre les bras, prendre la tension, puis pousser les jambes.",
      "Hanches et épaules montent ensemble.",
    ],
    erreurs: [
      "Hanches qui montent en premier : le mouvement devient un good morning.",
      "Arrondir le haut du dos pour finir le mouvement.",
    ],
  },

  // ─────────────────────── Pectoraux ───────────────────────
  {
    nom: "Développé couché haltères",
    cles: [
      "developper coucher haltere", "developpe couche haltere", "developper couche haltere",
      "developpe couche halteres", "db bench",
    ],
    primaires: ["pectoraux"],
    secondaires: ["deltoide_anterieur", "triceps"],
    description:
      "Les haltères permettent une amplitude plus grande que la barre et obligent chaque côté à travailler seul, ce qui corrige les déséquilibres.",
    focus: "Descendre jusqu'à sentir l'étirement des pectoraux, pas plus bas.",
    consignes: [
      "Omoplates serrées et plaquées dans le banc, léger cambrement naturel.",
      "Coudes à environ 45° du buste, jamais écartés à 90°.",
      "Descendre les haltères au niveau des pectoraux en 2 secondes.",
      "Pousser en rapprochant les haltères sans les cogner.",
    ],
    erreurs: [
      "Décoller les épaules du banc en poussant.",
      "Descendre trop bas, ce qui bascule la contrainte sur l'articulation de l'épaule.",
    ],
  },
  {
    nom: "Développé couché barre",
    cles: ["developpe couche barre", "developper coucher barre", "bench press", "developpe couche"],
    primaires: ["pectoraux"],
    secondaires: ["deltoide_anterieur", "triceps"],
    description:
      "La référence pour la force du haut du corps. La barre permet de charger plus lourd que les haltères, au prix d'une amplitude un peu plus courte.",
    focus: "Garder les omoplates serrées pendant toute la série.",
    consignes: [
      "Prise un peu plus large que les épaules, poignets au-dessus des coudes.",
      "Pieds ancrés au sol, fessiers en contact avec le banc.",
      "Descendre la barre au bas des pectoraux, coudes à 45°.",
      "Pousser en repoussant le banc avec les épaules.",
    ],
    erreurs: [
      "Faire rebondir la barre sur la poitrine.",
      "Décoller les fessiers pour aider la poussée.",
    ],
  },
  {
    nom: "Développé incliné",
    cles: ["developpe incline", "developper incline", "incline press"],
    primaires: ["pectoraux", "deltoide_anterieur"],
    secondaires: ["triceps"],
    description:
      "L'inclinaison déplace la charge vers le faisceau claviculaire, le haut des pectoraux — la zone que le couché à plat développe le moins.",
    focus: "Sentir le travail en haut des pectoraux, sous la clavicule.",
    consignes: [
      "Banc entre 30 et 45° : au-delà, ce sont les épaules qui prennent tout.",
      "Descendre vers le haut des pectoraux, pas vers le cou.",
      "Omoplates serrées, comme au couché à plat.",
    ],
    erreurs: [
      "Incliner le banc trop haut, ce qui transforme l'exercice en développé épaules.",
      "Rebondir en bas pour enchaîner les répétitions.",
    ],
  },
  {
    nom: "Pompes",
    cles: ["pompe", "push up", "pushup"],
    primaires: ["pectoraux"],
    secondaires: ["deltoide_anterieur", "triceps", "abdominaux"],
    description:
      "Un développé couché au poids du corps, avec en plus un vrai travail de gainage : le tronc doit tenir la planche pendant que les bras poussent.",
    focus: "Garder le corps en une seule ligne, des talons à la nuque.",
    consignes: [
      "Mains sous les épaules, légèrement plus larges.",
      "Fessiers et abdominaux serrés pour verrouiller le bassin.",
      "Descendre jusqu'à ce que la poitrine frôle le sol.",
      "Coudes à 45°, pas perpendiculaires au corps.",
    ],
    erreurs: [
      "Creuser le bas du dos quand la fatigue arrive.",
      "Ne descendre qu'à moitié pour gagner des répétitions.",
    ],
  },
  {
    nom: "Écarté poulie",
    cles: ["ecarte", "ecartes", "butterfly", "pec deck", "fly"],
    primaires: ["pectoraux"],
    secondaires: ["deltoide_anterieur"],
    description:
      "Mouvement d'isolation : les bras restent quasi tendus, donc le triceps ne peut pas aider. Tout le travail revient au pectoral.",
    focus: "Rapprocher les mains en pensant à serrer les pectoraux, pas à plier les bras.",
    consignes: [
      "Léger fléchissement des coudes, maintenu constant.",
      "Ouvrir jusqu'à sentir l'étirement, sans forcer derrière le buste.",
      "Croiser légèrement les mains en fin de mouvement pour la contraction.",
    ],
    erreurs: [
      "Plier les coudes en cours de route : l'exercice devient un développé.",
      "Charger trop lourd et perdre l'amplitude.",
    ],
  },

  // ───────────────────────── Épaules ─────────────────────────
  {
    nom: "Développé épaules machine",
    cles: [
      "developper epaule", "developpe epaule", "developpe militaire", "developper militaire",
      "shoulder press", "overhead press", "developpe nuque",
    ],
    primaires: ["deltoide_anterieur", "deltoide_lateral"],
    secondaires: ["triceps", "trapeze"],
    description:
      "Le constructeur principal de l'épaule. La machine guide la trajectoire, ce qui permet de pousser plus lourd sans gérer l'équilibre.",
    focus: "Pousser vers le haut, pas vers l'avant.",
    consignes: [
      "Dos plaqué au dossier, abdominaux serrés.",
      "Poignées au niveau des oreilles au départ.",
      "Pousser jusqu'à presque tendre les bras, sans verrouiller sec.",
      "Redescendre en contrôle jusqu'à l'angle droit au coude.",
    ],
    erreurs: [
      "Cambrer le bas du dos pour aider, ce qui transforme le mouvement en développé incliné.",
      "Descendre trop bas et mettre l'épaule en contrainte.",
    ],
  },
  {
    nom: "Élévations latérales",
    cles: ["elevation laterale", "elevations laterales", "developper laterale", "lateral raise", "developpe lateral"],
    primaires: ["deltoide_lateral"],
    secondaires: ["deltoide_anterieur", "trapeze"],
    description:
      "Le seul mouvement qui isole vraiment le faisceau latéral de l'épaule — celui qui donne la largeur. Aucun développé ne le remplace.",
    focus: "Monter avec les coudes, en laissant les mains suivre.",
    consignes: [
      "Charges légères : cet exercice ne se charge pas lourd, jamais.",
      "Buste très légèrement penché en avant.",
      "Monter jusqu'à l'horizontale des épaules, pas plus haut.",
      "Descendre en 3 secondes, c'est là que le muscle travaille.",
    ],
    erreurs: [
      "Se balancer pour lancer les haltères : le trapèze prend tout.",
      "Monter au-dessus de l'horizontale, ce qui transfère le travail au trapèze.",
    ],
  },
  {
    nom: "Oiseau",
    cles: ["oiseau", "face pull", "rear delt", "elevation buste penche"],
    primaires: ["deltoide_posterieur"],
    secondaires: ["trapeze", "grand_dorsal"],
    description:
      "Travaille l'arrière de l'épaule, la zone la plus souvent négligée. C'est elle qui équilibre une posture tirée vers l'avant par les pectoraux.",
    focus: "Écarter les coudes vers l'arrière, omoplates qui se rapprochent.",
    consignes: [
      "Buste penché à environ 45°, dos plat.",
      "Charges légères, amplitude complète.",
      "Marquer l'arrêt une seconde en fin de mouvement.",
    ],
    erreurs: [
      "Se redresser pendant la série.",
      "Tirer avec les bras au lieu d'ouvrir avec les épaules.",
    ],
  },

  // ───────────────────────── Biceps ─────────────────────────
  {
    nom: "Curl marteau",
    cles: ["curl marteau", "hammer curl", "curl prise neutre"],
    primaires: ["biceps", "avant_bras"],
    secondaires: [],
    description:
      "La prise neutre recrute le brachial et le long supinateur en plus du biceps. C'est le curl qui épaissit le bras vu de face.",
    focus: "Garder les pouces vers le haut du début à la fin.",
    consignes: [
      "Coudes collés au buste, immobiles.",
      "Monter sans rotation du poignet.",
      "Descendre en contrôle jusqu'aux bras tendus.",
    ],
    erreurs: [
      "Avancer les coudes en fin de montée, ce qui fait reposer le bras.",
      "Se servir du buste pour lancer la charge.",
    ],
  },
  {
    nom: "Curl biceps machine",
    cles: ["curl biceps machine", "curl machine", "curl pupitre", "preacher curl", "larry scott"],
    primaires: ["biceps"],
    secondaires: ["avant_bras"],
    description:
      "Le bras est calé sur un support, ce qui rend toute triche impossible. L'isolation est maximale, la charge forcément plus modeste.",
    focus: "Tendre complètement le bras en bas, sans relâcher la tension.",
    consignes: [
      "Aisselles calées contre le haut du pupitre.",
      "Descendre jusqu'à l'extension complète, lentement.",
      "Monter sans décoller les coudes du support.",
    ],
    erreurs: [
      "S'arrêter à mi-course en bas : c'est là que le biceps s'étire le plus.",
      "Lâcher la charge en fin de série au lieu de la contrôler.",
    ],
  },
  {
    nom: "Curl biceps",
    cles: ["curl biceps", "curl haltere", "curl barre", "curl ez", "curl"],
    primaires: ["biceps"],
    secondaires: ["avant_bras"],
    description:
      "Le mouvement de base du biceps. Simple, mais c'est précisément pour ça qu'il est si souvent fait avec de l'élan.",
    focus: "Immobiliser les coudes et ne bouger que l'avant-bras.",
    consignes: [
      "Debout, dos droit, coudes légèrement en avant du buste.",
      "Monter en 1 seconde, contracter en haut.",
      "Descendre en 2 à 3 secondes jusqu'aux bras tendus.",
    ],
    erreurs: [
      "Donner un coup de reins à chaque répétition.",
      "Ne descendre qu'à moitié, ce qui coupe la moitié du travail.",
    ],
  },

  // ───────────────────────── Triceps ─────────────────────────
  {
    nom: "Dips",
    cles: ["dip", "dips"],
    primaires: ["triceps", "pectoraux"],
    secondaires: ["deltoide_anterieur"],
    description:
      "Mouvement au poids du corps très efficace. Buste droit, le triceps domine ; buste penché en avant, ce sont les pectoraux qui prennent le relais.",
    focus: "Choisir l'inclinaison du buste selon le muscle visé, et la tenir.",
    consignes: [
      "Épaules basses, loin des oreilles, pendant toute la série.",
      "Descendre jusqu'à l'angle droit au coude.",
      "Coudes qui partent vers l'arrière, pas sur les côtés.",
    ],
    erreurs: [
      "Descendre trop bas : l'épaule part en avant et se met en contrainte.",
      "Laisser les épaules remonter vers les oreilles.",
    ],
  },
  {
    nom: "Extension triceps à la poulie",
    cles: [
      "extension triceps", "extension poulie", "triceps poulie", "pushdown",
      "triceps corde", "barre au front", "skull crusher",
    ],
    primaires: ["triceps"],
    secondaires: [],
    description:
      "Isolation du triceps. À la corde, l'écartement des mains en fin de mouvement ajoute une contraction plus marquée qu'avec une barre.",
    focus: "Coudes verrouillés contre le buste, seul l'avant-bras bouge.",
    consignes: [
      "Coudes collés aux côtes, immobiles.",
      "Tendre complètement les bras et marquer l'arrêt.",
      "Remonter en contrôle jusqu'à l'angle droit.",
    ],
    erreurs: [
      "Avancer les coudes ou se pencher pour pousser plus lourd.",
      "Écourter l'extension et ne jamais atteindre la contraction.",
    ],
  },

  // ─────────────────────── Avant-bras ───────────────────────
  {
    nom: "Avant-bras haltères",
    cles: ["avant bras haltere", "avant bras", "flexion poignet", "wrist curl", "circuit avant bras"],
    primaires: ["avant_bras"],
    secondaires: [],
    description:
      "Flexions et extensions de poignet. L'avant-bras récupère vite et supporte un volume élevé : séries longues et repos courts.",
    focus: "Amplitude complète au poignet, le reste du bras immobile.",
    consignes: [
      "Avant-bras posés sur les cuisses ou un banc.",
      "Descendre jusqu'à l'ouverture complète de la main.",
      "Séries de 15 à 25 répétitions.",
    ],
    erreurs: [
      "Bouger le coude pour aider.",
      "Charger trop lourd et perdre l'amplitude du poignet.",
    ],
  },

  // ───────────────────────── Jambes ─────────────────────────
  {
    nom: "Squat",
    cles: ["squat"],
    primaires: ["quadriceps", "fessiers"],
    secondaires: ["ischio_jambiers", "abdominaux", "mollets"],
    description:
      "Le mouvement le plus complet du bas du corps. Il engage aussi tout le tronc, qui doit stabiliser la charge posée sur le dos.",
    focus: "Descendre entre les talons en gardant la poitrine ouverte.",
    consignes: [
      "Pieds largeur d'épaules, pointes légèrement vers l'extérieur.",
      "Inspirer, bloquer le ventre, descendre hanches en arrière.",
      "Descendre au moins jusqu'aux cuisses parallèles au sol.",
      "Pousser le sol en remontant, genoux dans l'axe des pieds.",
    ],
    erreurs: [
      "Genoux qui rentrent vers l'intérieur en remontant.",
      "Talons qui décollent : souvent un manque de mobilité de cheville.",
    ],
  },
  {
    nom: "Presse à cuisses",
    cles: ["presse a cuisse", "presse cuisse", "leg press", "presse inclinee"],
    primaires: ["quadriceps", "fessiers"],
    secondaires: ["ischio_jambiers"],
    description:
      "Permet de charger lourd sans que le dos ait à supporter la barre. Utile pour accumuler du volume sur les jambes quand le squat fatigue trop.",
    focus: "Pousser avec tout le pied, en appuyant sur les talons.",
    consignes: [
      "Pieds à largeur d'épaules au milieu du plateau.",
      "Descendre jusqu'à l'angle droit au genou.",
      "Ne jamais verrouiller les genoux en fin de poussée.",
      "Bas du dos qui reste plaqué contre le dossier.",
    ],
    erreurs: [
      "Descendre si bas que le bassin décolle et que le bas du dos s'arrondit.",
      "Tendre les jambes d'un coup en fin de poussée.",
    ],
  },
  {
    nom: "Leg curl",
    cles: ["leg curl", "ischio machine", "curl jambe", "flexion jambe"],
    primaires: ["ischio_jambiers"],
    secondaires: ["mollets"],
    description:
      "Le seul mouvement qui isole les ischio-jambiers en flexion. Indispensable en complément des squats et presses, qui ne les travaillent qu'en second.",
    focus: "Contracter l'arrière de la cuisse, pas tirer avec le bassin.",
    consignes: [
      "Bassin plaqué, ne pas décoller les hanches.",
      "Fléchir jusqu'au bout, marquer un temps d'arrêt.",
      "Revenir lentement sans laisser la charge retomber.",
    ],
    erreurs: [
      "Décoller le bassin pour gagner de l'amplitude.",
      "Laisser la charge redescendre librement.",
    ],
  },
  {
    nom: "Fentes",
    cles: ["fente", "fentes", "lunge", "split squat"],
    primaires: ["quadriceps", "fessiers"],
    secondaires: ["ischio_jambiers", "abdominaux", "mollets"],
    description:
      "Travail unilatéral : chaque jambe travaille seule, ce qui révèle et corrige les déséquilibres que le squat masque.",
    focus: "Descendre à la verticale plutôt que pousser vers l'avant.",
    consignes: [
      "Grand pas, buste droit.",
      "Descendre jusqu'à ce que le genou arrière frôle le sol.",
      "Pousser sur le talon avant pour remonter.",
    ],
    erreurs: [
      "Pas trop court : le genou avant dépasse largement la pointe du pied.",
      "Buste qui bascule en avant.",
    ],
  },
  {
    nom: "Mollets debout",
    cles: ["mollet debout", "mollet", "mollets", "calf raise", "extension mollet"],
    primaires: ["mollets"],
    secondaires: [],
    description:
      "Debout, jambes tendues, c'est le gastrocnémien qui travaille — le muscle visible qui donne le galbe. Assis, jambes pliées, c'est le soléaire en dessous.",
    focus: "Monter le plus haut possible, descendre le plus bas possible.",
    consignes: [
      "Avant-pieds sur une marche, talons dans le vide.",
      "Descendre jusqu'à l'étirement complet, 2 secondes.",
      "Monter sur la pointe et tenir une seconde en haut.",
      "Séries longues : 12 à 20 répétitions.",
    ],
    erreurs: [
      "Rebondir sans amplitude, par petits à-coups.",
      "Plier les genoux, ce qui déplace le travail vers le soléaire.",
    ],
  },
  {
    nom: "Hip thrust",
    cles: ["hip thrust", "pont fessier", "releve bassin"],
    primaires: ["fessiers"],
    secondaires: ["ischio_jambiers", "quadriceps"],
    description:
      "Le mouvement le plus direct pour les fessiers : la résistance est maximale au moment précis où le fessier est le plus contracté.",
    focus: "Finir le mouvement par une contraction franche des fessiers.",
    consignes: [
      "Haut du dos calé sur un banc, pieds à plat.",
      "Monter jusqu'à ce que le buste soit parallèle au sol.",
      "Menton rentré, regard vers les genoux.",
    ],
    erreurs: [
      "Cambrer le bas du dos au lieu de verrouiller les fessiers.",
      "Pieds trop loin, ce qui transfère le travail aux ischios.",
    ],
  },

  // ─────────────────────── Abdominaux ───────────────────────
  {
    nom: "Relevé de jambes suspendu",
    cles: ["releve de jambe", "releve jambe", "leg raise", "hanging leg"],
    primaires: ["abdominaux"],
    secondaires: ["obliques", "avant_bras"],
    description:
      "Cible la partie basse du grand droit, celle que les crunchs atteignent mal. La difficulté se règle en pliant plus ou moins les genoux.",
    focus: "Enrouler le bassin vers le haut, pas seulement lever les jambes.",
    consignes: [
      "Épaules basses, suspension active.",
      "Monter en basculant le bassin vers l'arrière.",
      "Redescendre lentement, sans se balancer.",
    ],
    erreurs: [
      "Se balancer d'avant en arrière pour lancer la montée.",
      "Monter les jambes sans bouger le bassin : les fléchisseurs de hanche prennent tout.",
    ],
  },
  {
    nom: "Gainage",
    cles: ["gainage", "planche", "plank"],
    primaires: ["abdominaux"],
    secondaires: ["obliques", "deltoide_anterieur", "fessiers"],
    description:
      "Travail isométrique : le tronc ne bouge pas, il résiste. L'objectif n'est pas la durée, mais la qualité de la position tenue.",
    focus: "Serrer fessiers et abdominaux en même temps.",
    consignes: [
      "Coudes sous les épaules, corps en ligne droite.",
      "Bassin légèrement rétroversé, pas de creux lombaire.",
      "Respiration continue, jamais en apnée.",
    ],
    erreurs: [
      "Fessiers trop hauts, ce qui soulage le ventre.",
      "Tenir longtemps en position dégradée plutôt que court et propre.",
    ],
  },
  {
    nom: "Crunch",
    cles: ["crunch", "abdo", "abdominaux", "sit up"],
    primaires: ["abdominaux"],
    secondaires: ["obliques"],
    description:
      "Flexion courte du buste qui cible le haut du grand droit. L'amplitude est volontairement réduite : au-delà, ce sont les fléchisseurs de hanche qui travaillent.",
    focus: "Décoller les omoplates en enroulant, rien de plus.",
    consignes: [
      "Bas du dos qui reste au sol.",
      "Mains sur la poitrine plutôt que derrière la nuque.",
      "Expirer en montant, contracter une seconde.",
    ],
    erreurs: [
      "Tirer sur la nuque avec les mains.",
      "Monter le buste complet : le travail quitte les abdominaux.",
    ],
  },
];

/** Normalise un nom pour l'appariement : minuscules, sans accents ni ponctuation. */
export function normaliser(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Index cle -> fiche, trie par longueur de cle decroissante. */
const INDEX: Array<{ cle: string; fiche: FicheExercice }> = REFERENTIEL
  .flatMap((fiche) => fiche.cles.map((cle) => ({ cle: normaliser(cle), fiche })))
  .sort((a, b) => b.cle.length - a.cle.length);

/**
 * Fiche correspondant a un nom d'exercice, ou null.
 * La cle la plus longue gagne : "curl marteau" avant "curl".
 */
export function ficheParNom(nom: string): FicheExercice | null {
  const n = normaliser(nom);
  for (const { cle, fiche } of INDEX) {
    if (n.includes(cle)) return fiche;
  }
  return null;
}

/**
 * Repli quand aucune fiche ne correspond : le groupe musculaire de l'exercice
 * donne au moins le muscle principal, pour que la carte ne reste pas eteinte.
 */
export const GROUPE_VERS_MUSCLES_DEFAUT: Record<GroupeMusculaire, MuscleDetail[]> = {
  dos: ["grand_dorsal", "trapeze"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  epaules: ["deltoide_anterieur", "deltoide_lateral"],
  pectoraux: ["pectoraux"],
  jambes: ["quadriceps", "fessiers"],
  "avant-bras": ["avant_bras"],
  abdominaux: ["abdominaux"],
  mollets: ["mollets"],
};

export type MusclesExercice = {
  primaires: MuscleDetail[];
  secondaires: MuscleDetail[];
  /** D'ou vient l'information : fiche du referentiel, surcharge en base, ou repli. */
  source: "referentiel" | "base" | "groupe";
};

/**
 * Muscles d'un exercice. La base fait autorite quand elle est renseignee
 * (surcharge manuelle), sinon le referentiel, sinon le groupe musculaire.
 */
export function musclesExercice(
  nom: string,
  groupe: GroupeMusculaire,
  surcharge?: Array<{ muscle: MuscleDetail; role: "primaire" | "secondaire" }>
): MusclesExercice {
  if (surcharge && surcharge.length > 0) {
    return {
      primaires: surcharge.filter((m) => m.role === "primaire").map((m) => m.muscle),
      secondaires: surcharge.filter((m) => m.role === "secondaire").map((m) => m.muscle),
      source: "base",
    };
  }
  const fiche = ficheParNom(nom);
  if (fiche) {
    return { primaires: fiche.primaires, secondaires: fiche.secondaires, source: "referentiel" };
  }
  return {
    primaires: GROUPE_VERS_MUSCLES_DEFAUT[groupe] ?? [],
    secondaires: [],
    source: "groupe",
  };
}
