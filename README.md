# Case par Case

Liseuse de mangas et de BD qui zoome case par case, installable sur iPhone et iPad (Safari › Partager › Sur l'écran d'accueil).

- Les tomes (PDF, CBZ, CBR, CB7 ou dossiers d'images) sont lus dans Google Drive, dossier « Mangas : Comics », un sous-dossier par série.
- La bibliothèque est rangée en deux parties, Mangas et Comics (classement automatique, modifiable sur la page de chaque série).
- Découvrir : tendances des mangas (AniList), sélection comics, suggestions à partir de la bibliothèque, recherche dans les catalogues (AniList, Google Books).
- Ma liste : les séries qu'on veut lire, synchronisée entre les appareils. Rien n'est jamais téléchargé depuis les catalogues.
- Chaque tome peut être téléchargé pour être lu hors ligne. Lecture case par case ou page entière, plein écran, sens BD ou manga.
- La page en cours, les réglages de séries et Ma liste sont synchronisés dans l'espace privé de l'appli sur Google Drive.

Aucun tome n'est stocké dans ce dépôt.

Fichiers : `core.js` (Drive, stockage, synchronisation, ouverture des tomes, détection des cases), `reader.js` (lecteur), `catalog.js` (catalogues), `ui.js` (écrans), `styles.css`.

Bibliothèques incluses : [pdf.js](https://github.com/mozilla/pdf.js) (Apache 2.0), [JSZip](https://stuk.github.io/jszip/) (MIT), [libarchive.js](https://github.com/nika-begiashvili/libarchivejs) (MIT).
