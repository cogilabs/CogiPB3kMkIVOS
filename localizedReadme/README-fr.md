# Cogilabs Pip-Boy 3000 Mk4
[→ In English](/README.md)

<p align="center">
    <!--<img alt="Bannière" title="Bannière" src="/readme_sources/images/banner.png">-->
</p>
<p align="center">
    <a href="https://electronjs.org/" target="_blank"><img alt="Badge Electron" title="Construit avec Electron !" src="https://img.shields.io/badge/Electron-4E44B6?style=for-the-badge&logo=electron&logoColor=white"/></a>
</p>

## ⚠️ Avertissement : Développement en Cours ⚠️

Le **Cogilabs Pip-Boy 3000 Mk4** est une version du Pip-Boy de Fallout 4 que je fabrique à des fins de cosplay.  

## Table des matières

- [Introduction](#introduction)
- [L'application](#lapplication)
  - [Fichier de profil](#fichier-de-profil)
  - [Personnalisation des couleurs](#personnalisation-des-couleurs)
  - [Affichage de l'inventaire](#affichage-de-linventaire)
  - [Carte](#carte)
  - [Radio](#radio)
  - [Autre](#autre)
- [Le Pip-Boy physique](#le-pip-boy-physique)
  - [Les branchements](#les-branchements)
  - [Le modèle 3D](#le-modèle-3d)

## Introduction

Le projet se divise en deux parties :

- Le "système d'exploitation", que je recrée de zéro avec Electron. Il sera principalement fonctionnel.
- L'objet lui-même, qui sera une Raspberry Pi 3B+ encasée dans un Pip-Boy imprimé en 3D. Je modifierai un modèle trouvé sur internet qui sera crédité ici plus tard.

Pour le moment, j'attends la livraison de mes composants, donc je travaille sur l'application.  

## L'application
  
![La page de statut](/readme_sources/images/status.png)  
  
L'application est principalement une reproduction de l'interface de Fallout 4. Pour le contenu, il y a des fichiers de profil. 

### Fichier de profil
  
Dans votre fichier de profil se trouvent votre :
  
- Pseudo  
→ Il sera affiché sur la page de statut.  
  
- Couleur d'interface  
→ La couleur de l'écran est personnalisable dans l'onglet des paramètres. Vous pouvez enregistrer votre couleur dans votre fichier de profil.  
  
- Date de naissance  
→ Elle sera utilisée pour calculer votre niveau, le niveau étant votre âge et la barre d'expérience montrant ce qu'il reste avant votre prochain anniversaire.  
  
- Inventaire  
→ Tous vos objets seront stockés ici pour affichage dans l'onglet inventaire.  
  
- Sélection de points SPECIAL et vos compétences  
→ Comme l'inventaire, ils seront stockés ici pour affichage dans l'onglet statut.  
  
Trois fichiers de profil sont codés en dur :  
  
- Le profil invité (Guest) qui est vert FO4 par défaut, avec des objets et compétences standards, né le 01/01/2000, et *n'affiche pas de nom sur la page de statut* (Utile pour laisser vos amis l'essayer sans votre nom dessus)  
- Mon propre profil, affichant "David", en jaune et bien sûr avec un inventaire et des compétences personnalisés.  
- Le profil de ma fiancée, affichant "Marie" et en rose, également avec un inventaire et des compétences personnalisés.  

Vous pouvez les charger en utilisant l'onglet des paramètres (l'espace vide à gauche de l'onglet STAT, ou en appuyant sur "P" sur votre clavier).  

Ensuite, il y a *votre* profil. 
Si un fichier de profil nommé `local.json` est placé dans `<dossier personnel>/pipBoy/`, il sera automatiquement chargé au démarrage du Pip-Boy. S'il existe, un bouton "Local" est ajouté à l'onglet des paramètres pour le charger à nouveau s'il a été changé pour un autre.  
S'il n'existe pas, le "mode démo" est chargé, utilisant le profil invité mais affichant "MODE DÉMO" à la place du nom d'utilisateur sur la page de statut.  
  
Utilisez [`guest.json`](/profiles/guest.json) et [`items.json`](/items.json) pour créer votre propre fichier `local.json`.  
  
Le fichier [`items.json`](/items.json) stocke chaque objet et compétence existant dans l'inventaire, de sorte que leurs données ne soient pas répétées dans chaque fichier de profil.

### Personnalisation des couleurs

À gauche des onglets se trouve un onglet "secret", il n'est pas visible pour ne pas enlaidir l'interface et aura un bouton physique dédié.  
Cet onglet vous permet de personnaliser la couleur de l'écran de votre Pip-Boy.  
Pour faciliter la personnalisation, j'ai opté pour une sélection HSL : Hue, Saturation et Lightness.  
  
![La page des paramètres](/readme_sources/images/settings.png)  
  
Vous trouverez quatre curseurs :  
  
- Teinte  
→ La teinte est essentiellement la couleur, représentée par l'angle sur un cercle chromatique de 0 (Rouge) à 360 (Rouge aussi puisque c'est une rotation complète). 120 est la teinte du Pip-Boy de FO4.  
  
- Saturation  
→ Indique l'intensité de votre couleur, de 0 (noir et blanc) à 100 (très coloré).  
  
- Luminosité  
→ Représente la luminosité de votre couleur. En raison de problèmes avec CSS et les filtres d'image, cela modifie la luminosité *ou* la clarté en fonction de l'élément qu'il modifie. Les valeurs supérieures à 60 ne fonctionneront pas comme prévu, car la clarté affecte également la saturation.  
  
- Correction de la luminosité des icônes  
→ Comme il y a un problème connu avec la rotation des teintes par CSS, affectant également la saturation et la luminosité, j'ai ajouté ce curseur qui aide grandement à corriger la différence entre le texte et les icônes. Un carré sous le curseur aide à régler cette valeur correctement : le texte "Vous ne devez pas voir ce texte" écrit à l'intérieur ne doit pas être visible, ou du moins aussi peu que possible.
  
![Correction non réglée](/readme_sources/images/iconCorrection1.PNG) ![Correction réglée](/readme_sources/images/iconCorrection2.PNG)  
  
Cette page de paramètres permet des configurations sympas comme par exemple celle de ma fiancée :  
    
![Page de statut rose](/readme_sources/images/pinkStatus.png)

### Affichage de l'inventaire

Dans l'onglet inventaire, votre inventaire (défini dans votre fichier de profil) sera affiché.  
  
![Inv/Armes](/readme_sources/images/weapons.png)  
   
![Inv/Vêtements](/readme_sources/images/apparel.png)  
   
![Inv/soins](/readme_sources/images/aid.png)  
   
Les statistiques des objets (dans le tableau) proviennent du fichier [`items.json`](/items.json), à l'exception de la quantité de munitions, qui provient de votre fichier de profil.  
  
Pour le moment, l'état équipé est statique (ce qui a du sens pour un cosplay) et est défini dans le fichier de profil.
  
Les pieds de page sont interactifs, le poids est calculé en fonction de votre inventaire actuel. Le pied de page de l'onglet des armes affichera les dégâts de votre arme équipée (pour l'instant seulement le 10mm), le pied de page de l'onglet des vêtements affiche la protection de l'armure, et celui des soins votre barre de HP.  
  
### Carte

Pour la carte, comme c'est principalement pour des cosplays lors des conventions, elle affiche une version fortement éditée d'une image (pour l'instant images/nim.png).  
J'ai prévu de charger la carte de la convention où je vais juste avant d'y aller, pour avoir la carte locale.  
  
J'ai testé avec une version basse résolution de la carte de la dernière convention locale de ma ville, juste pour voir. Les filtres CSS fonctionnent très bien pour créer une carte "Pip-Boyifiée" avec n'importe quelle image :  
  
![Carte](/readme_sources/images/map.png)  
  
Je pense peut-être ajouter une version "monde" où je télécharge une carte de la ville avec une fausse flèche de position sur le bâtiment où se déroule la convention.

### Radio

Le Pip-Boy est équipé d'une "radio" fonctionnelle. Ce n'est en aucun cas une radio AM/FM, je veux qu'elle soit la plus immersive possible. Elle utilise des fichiers .mp3 que vous placez dans le dossier des musiques.  
  
Au démarrage du Pip-Boy, il crée une liste de lecture aléatoire de toutes les musiques, puis prend la première et la joue *silencieusement* en commençant à 30 secondes dans la chanson.  
  
Dans l'onglet Radio, j'ai mis les radios des jeux comme "inaccessibles" et ma propre radio comme la seule fonctionnelle. Lorsque vous l'activez, le volume sonore augmente, "allumant" essentiellement la radio. Si vous la désactivez, le son s'éteint à nouveau, mais *ne met jamais la musique en pause*. Cela et le fait qu'elle commence à 30 secondes dans la chanson, donnent l'impression d'une vraie radio. Bien sûr, la radio reste activée si vous quittez l'onglet.
  
Pour le graphique, il était généré aléatoirement au chargement de l'onglet, mais je n'aimais pas le rendu, alors j'ai opté pour une bête onde sinusoïdale a amplitude variante.  
  
Pour mon Pip-Boy, j'ai ajouté la plupart des musiques de Fallout 4 et Fallout 76, que je ne distribuerai bien sûr pas ici. Je recommande de mettre des musiques de Fallout, mais vous pouvez bien sûr mettre ce que vous voulez dans ce dossier.  
  
![Radio](/readme_sources/images/radio.png) 

### Autre

Pour les onglets Données et Carte, le pied de page donne la date et l'heure, donc le Pip-Boy pourrait même être utilisé comme montre :  
![Données/Quêtes](/readme_sources/images/quests.png)  

## Le Pip-Boy physique

La partie physique du Pip-Boy est faite de:  
(Tout ici peut changer à tout moment)  
  
- 1 Raspberry 3B+ avec 1Gb RAM et Raspbian installé
- 1 écran tactile de 5 pouces
- 1 Powerboost 1000C
- 1 batterie 6600 mAh
- 2 codeurs incrémentaux
- 1 potentiomètre
- 2 LEDs
- 1 bouton physique
- le modèle 3D

### Les branchements

[WIP]

### Le modèle 3D

[WIP]

#### Modifications du modèle

[WIP]