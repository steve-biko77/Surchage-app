# Tracé anatomique — Open-Muscle-Map

`corps-masculin.json` est dérivé de **Open-Muscle-Map**, par PerspicaciousGuy,
publié sous licence MIT (`LICENSE` dans ce dossier).

Source : https://github.com/PerspicaciousGuy/Open-Muscle-Map

Le fichier est une réduction de `muscle-map/male-map-data.json` du projet
amont : mêmes tracés et mêmes bornes, mais les champs de métadonnées que
l'application n'utilise pas ont été retirés, et les noms de clés raccourcis
(172 Ko → 135 Ko, le fichier part dans le bundle client).

`muscles.json` est le catalogue du projet amont, repris tel quel.

## Pourquoi une copie plutôt qu'une dépendance

Le projet amont est très récent. Une anatomie qui disparaîtrait du jour au
lendemain n'est pas une dépendance acceptable pour l'élément central de
l'application. Les fichiers sont donc versionnés ici, avec leur licence.

Le corps féminin existe en amont aux mêmes identifiants de région : il peut
être ajouté sans toucher au code de rendu.

## Ce que le tracé sait de plus que le domaine

Les données distinguent des sous-portions — trapèze supérieur / moyen-inférieur,
quatre segments de grand droit, chefs médial et latéral du gastrocnémien.
L'application raisonne pour l'instant au muscle entier ; ces sous-portions sont
présentes dans le JSON et attendent que le domaine sache les adresser.
