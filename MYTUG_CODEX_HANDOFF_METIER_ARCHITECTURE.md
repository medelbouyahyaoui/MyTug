# MyTug — HANDOFF COMPLET MÉTIER & ARCHITECTURE FONCTIONNELLE

## Référence pour reconstruire MyTug from scratch

### 1. Objet

MyTug est une application web professionnelle de gestion des opérations d'une compagnie de remorquage portuaire.

Objectifs :
- faciliter le travail quotidien des capitaines, chefs mécaniciens, chefs d'armement, mécaniciens et dispatchers ;
- donner au chef d'armement et aux responsables autorisés une vision fiable et en temps réel de la flotte, des missions, des équipages, de la maintenance, des certificats, des exercices et de la sécurité.

**Important : ce document conserve uniquement le métier, les fonctionnalités, les workflows et l'architecture fonctionnelle. Les choix techniques précédents, le code, les bases de données et leur configuration sont volontairement exclus.**

---

# 2. Architecture fonctionnelle générale

Les grands modules de MyTug sont :

1. Tableau de bord
2. Société / configuration
3. Utilisateurs et rôles
4. Remorqueurs
5. Équipages
6. Prise de service
7. Missions
8. Disponibilité opérationnelle
9. Journal machine
10. Heures moteur
11. Carburant
12. Huile
13. Maintenance préventive
14. Maintenance corrective
15. Certificats
16. Planning annuel des exercices
17. Sécurité / ISM / ISPS
18. Documents
19. Notifications et alertes
20. Rapports
21. Historique / traçabilité
22. Paramètres

La navigation et les fonctionnalités visibles doivent dépendre du rôle de l'utilisateur.

---

# 3. Rôles

Les rôles fonctionnels sont :

- Administrateur
- Chef d'armement
- Chef mécanicien
- Capitaine
- Mécanicien
- Dispatcher

Le dispatcher est **optionnel**.

Une compagnie peut fonctionner sans dispatcher.

---

# 4. Administrateur

Accès complet à la configuration de sa compagnie.

Peut notamment :
- gérer la compagnie ;
- gérer les utilisateurs et rôles ;
- configurer les remorqueurs et leurs caractéristiques ;
- configurer les équipages et postes ;
- configurer les pilotes ;
- configurer les types de mouvements ;
- configurer les cycles de service ;
- configurer les heures de relève ;
- configurer maintenance, certificats et exercices ;
- configurer les alertes ;
- gérer les documents ;
- consulter les rapports ;
- consulter l'historique.

---

# 5. Chef d'armement

Vision opérationnelle globale en temps réel.

Doit pouvoir consulter notamment :
- tous les remorqueurs ;
- leur disponibilité ;
- les missions ;
- les équipages ;
- les prises de service ;
- la maintenance ;
- les certificats ;
- les exercices ;
- les informations de sécurité ;
- les alertes ;
- les rapports.

Il reçoit les alertes importantes, notamment celles relatives aux certificats, aux prises de service non effectuées, aux exercices, aux problèmes opérationnels et à la sécurité.

---

# 6. Chef mécanicien

Responsable du domaine technique.

Gère :
- maintenance préventive ;
- maintenance corrective ;
- planning de maintenance ;
- interventions ;
- tâches de maintenance ;
- journal machine ;
- heures moteur ;
- données techniques ;
- carburant/huile ;
- documents techniques.

Le capitaine et le chef d'armement peuvent consulter les informations de maintenance, mais la gestion de la maintenance appartient au chef mécanicien.

---

# 7. Capitaine

Le capitaine est un utilisateur opérationnel.

Il peut :
- prendre son service ;
- consulter son remorqueur ;
- consulter son statut opérationnel ;
- consulter les informations communes du remorqueur ;
- créer et compléter les missions ;
- saisir les heures moteur ;
- consulter les informations utiles ;
- renseigner les informations machine autorisées ;
- renseigner les informations opérationnelles et de sécurité autorisées.

### Confidentialité

Un capitaine ne doit pas consulter les informations privées d'un autre capitaine ou d'un autre équipage.

Il peut consulter les informations communes nécessaires au travail et le statut général des remorqueurs.

---

# 8. Mécanicien

Accès technique adapté aux responsabilités qui lui sont confiées.

Il peut effectuer les opérations techniques autorisées par la compagnie sans disposer automatiquement des droits du chef mécanicien.

---

# 9. Dispatcher

Le dispatcher est facultatif.

S'il existe, il peut :
- voir la disponibilité des remorqueurs ;
- voir les missions ;
- coordonner les opérations ;
- participer aux affectations ;
- voir les conflits opérationnels.

**L'absence de dispatcher ne doit jamais bloquer le travail des capitaines.**

Le dispatcher n'est jamais une étape obligatoire pour créer ou terminer une mission.

---

# 10. Configuration de la compagnie

Toutes les données spécifiques à une compagnie doivent être configurables :

- identité ;
- utilisateurs ;
- rôles ;
- remorqueurs ;
- caractéristiques techniques ;
- équipages ;
- membres ;
- postes ;
- cycles de service ;
- heure de relève ;
- pilotes ;
- types de mouvements ;
- maintenance ;
- tâches de maintenance ;
- certificats ;
- exercices ;
- alertes ;
- documents.

Les noms et données de production ne doivent pas être codés en dur.

---

# 11. Remorqueurs

Chaque remorqueur possède une fiche complète.

## Identification

- nom ;
- identifiant interne ;
- compagnie ;
- statut ;
- type.

## Types

Au minimum :
- ASD ;
- conventionnel.

L'architecture doit permettre d'ajouter d'autres types.

## Caractéristiques techniques

La fiche doit pouvoir contenir notamment :
- IMO si applicable ;
- indicatif ;
- pavillon ;
- année de construction ;
- chantier ;
- longueur ;
- largeur ;
- tirant d'eau ;
- tonnage ;
- déplacement si pertinent ;
- bollard pull ;
- type de propulsion ;
- constructeur moteur ;
- modèle moteur ;
- nombre de moteurs principaux ;
- puissance moteur ;
- moteurs auxiliaires ;
- puissance auxiliaire ;
- capacité carburant en tonnes ;
- capacité huile en litres ;
- capacité eau si utile ;
- équipements incendie ;
- caractéristiques de remorquage ;
- treuil ;
- vitesse ;
- autres caractéristiques.

La fiche doit rester extensible.

## Statuts

Au minimum :
- disponible ;
- occupé / en mission ;
- maintenance ;
- désarmé ;
- activé temporairement ;
- indisponible.

Un remorqueur désarmé peut être temporairement activé.

---

# 12. Équipages

Le fonctionnement normal est généralement :
- 3 équipages par remorqueur ;
- 1 équipage en service ;
- 2 équipages au repos.

Cycles possibles :
- 2 jours travail / 4 jours repos ;
- 3 jours travail / 6 jours repos.

Le repos doit être le double du travail.

Le cycle applicable est configurable.

## Aucun tour de rôle automatique

MyTug ne doit pas imposer un algorithme automatique de tour de rôle.

Les capitaines/équipages organisent leur tour entre eux.

L'application fournit la visibilité, les services, les affectations, les disponibilités et l'historique, mais ne force pas la rotation.

---

# 13. Postes d'équipage

Postes configurables, par exemple :
- capitaine ;
- chef mécanicien ;
- mécanicien ;
- matelot 1 ;
- matelot 2 ;
- autres.

---

# 14. Remplacement au milieu du service — EXIGENCE CRITIQUE

Un membre d'équipage peut être remplacé au milieu de son service.

Exemple :

Service de 3 jours.

Poste Matelot 1 :
- Jour 1 : Personne A
- Jour 2 : Personne A
- Jour 3 : Personne B

MyTug doit donc enregistrer :
- A = 2 jours travaillés ;
- B = 1 jour travaillé.

Le système doit permettre de saisir :
- personne initiale ;
- personne remplaçante ;
- poste ;
- début ;
- fin ;
- nombre de jours ;
- nombre d'heures si nécessaire ;
- motif du remplacement si souhaité ;
- historique.

Il ne faut jamais supposer qu'une personne occupe un poste pendant toute la durée du service.

---

# 15. Relève

La compagnie définit une heure fixe de relève.

Si une manœuvre est en cours à l'heure prévue :
- la relève attend ;
- l'équipage sortant continue la manœuvre ;
- la relève réelle est enregistrée lorsqu'elle a effectivement lieu.

Le système doit distinguer l'heure prévue et l'heure réelle.

---

# 16. Prise de service

La prise de service doit être liée à :
- l'utilisateur ;
- le remorqueur ;
- le service ;
- la date/heure.

Le capitaine et le chef mécanicien doivent s'authentifier selon la procédure de la compagnie.

---

# 17. Délai d'une heure

Après la déconnexion du capitaine sortant, le capitaine entrant dispose d'une heure pour prendre son service.

Si la prise de service n'est pas effectuée dans ce délai :
- une notification est envoyée au chef d'armement.

Conserver la trace de la déconnexion, du délai, de la prise de service et de la notification.

---

# 18. État de relève du chef mécanicien

Avant de quitter son service, le chef mécanicien sortant déclare notamment :
- carburant ;
- huile ;
- heures moteur ;
- remarques ;
- état technique pertinent.

Le chef mécanicien entrant peut contester cette déclaration.

La contestation doit conserver :
- auteur ;
- date/heure ;
- élément contesté ;
- motif ;
- état de résolution.

---

# 19. Missions

Pour chaque mission, le capitaine saisit :
- pilote ;
- navire ;
- type de mouvement ;
- autres remorqueurs participants ;
- position ;
- heure de début ;
- heure de fin ;
- heures moteur début ;
- heures moteur fin ;
- créateur ;
- statut.

---

# 20. Types de mouvements

Types prédéfinis :

1. Accostage
2. Appareillage
3. Sécurité en cas de mauvais temps
4. Assistance
5. Déhalage
6. Changement de poste
7. Autre

Si « Autre » est choisi, un champ libre permet de préciser.

---

# 21. Pilotes

Le pilote est choisi dans une liste configurée par la compagnie.

---

# 22. Navire

La mission enregistre le navire concerné.

Un répertoire réutilisable de navires peut être prévu, mais la saisie d'un nom doit toujours rester possible.

---

# 23. Autres remorqueurs

Une mission peut impliquer plusieurs remorqueurs.

Tous les remorqueurs participants doivent pouvoir être enregistrés.

---

# 24. Position

La position peut être saisie manuellement.

Une évolution cartographique/GPS peut être ajoutée ultérieurement.

La saisie manuelle reste obligatoire comme possibilité.

---

# 25. Début et fin de mission

Le capitaine saisit manuellement le début et la fin.

**Un remorqueur est disponible pour une nouvelle mission uniquement lorsque l'heure de fin réelle de la mission actuelle est saisie.**

Ne pas libérer automatiquement le remorqueur simplement parce qu'une heure théorique est dépassée.

---

# 26. Définition opérationnelle

Selon la procédure de la compagnie, le début peut correspondre notamment au moment où :
- le remorqueur prend la remorque / commence l'action ;
- ou le pilote demande la mise à disposition/stand-by.

La fin correspond à la libération par le pilote / fin de l'opération.

La procédure opérationnelle doit pouvoir être adaptée aux règles de la compagnie.

---

# 27. ASD / conventionnel

Le pilote peut demander un type particulier de remorqueur, notamment ASD ou conventionnel.

Cette demande peut casser l'ordre opérationnel habituel.

L'application doit permettre l'opération et l'enregistrer, sans blocage artificiel.

---

# 28. Situations urgentes et autres compagnies

Plusieurs compagnies peuvent opérer dans un même port.

Si une compagnie n'a aucun remorqueur disponible et qu'une opération urgente apparaît, un remorqueur d'une autre compagnie peut être sollicité.

Exemples :
- risque de manquer une fenêtre de marée ;
- assistance urgente.

Le VTS ou le pilote peut prendre la décision.

MyTug doit permettre d'enregistrer ces situations et ne doit pas supposer qu'un algorithme interne décide toujours.

---

# 29. Principe de non-blocage

MyTug doit être un outil opérationnel et ne pas bloquer inutilement les utilisateurs.

Ne pas bloquer parce que :
- le dispatcher est absent ;
- le remorqueur prévu est indisponible ;
- le pilote demande un ASD ;
- une situation urgente apparaît ;
- un équipier doit être remplacé en cours de service.

Les seules actions réellement bloquantes sont celles imposées explicitement par une règle de sécurité ou d'autorisation.

---

# 30. Journal machine

Chaque entrée est horodatée et peut contenir :
- remorqueur ;
- date/heure ;
- utilisateur ;
- heures moteur ;
- état machine ;
- observation ;
- incident ;
- action corrective ;
- remarques ;
- photo facultative ;
- pièce jointe.

---

# 31. Heures moteur

Suivre :
- heures début de mission ;
- heures fin ;
- durée calculée ;
- compteur courant ;
- historique.

Les heures moteur alimentent la maintenance préventive.

---

# 32. Carburant

Gérer :
- capacité en tonnes ;
- niveau ;
- entrées/déclarations ;
- historique ;
- consommation lorsque calculable.

**Alerte par défaut à environ 20 %.**

Le seuil doit être configurable.

---

# 33. Huile

Gérer :
- capacité en litres ;
- état/niveau déclaré ;
- historique lorsque nécessaire ;
- informations de relève.

---

# 34. Maintenance

Deux catégories :
1. préventive ;
2. corrective.

La maintenance est indépendante des missions.

---

# 35. Maintenance préventive

Planification possible selon :
- heures moteur ;
- calendrier ;
- ou les deux.

Exemples :
- toutes les X heures ;
- tous les X jours/mois/années ;
- date fixe ;
- valeur d'heures moteur.

---

# 36. Planning de maintenance

Permettre de définir :
- remorqueur ;
- équipement/système ;
- type ;
- intervalle ;
- unité ;
- dernière réalisation ;
- dernières heures moteur ;
- prochaine date ;
- prochaines heures moteur ;
- responsable ;
- instructions ;
- tâches ;
- documents ;
- statut.

---

# 37. Intervention de maintenance

Chaque intervention réelle doit enregistrer :
- remorqueur ;
- planning ;
- date/heure ;
- heures moteur ;
- type ;
- description ;
- intervenant ;
- responsable ;
- statut ;
- tâches réalisées ;
- pièces/matériel ;
- remarques ;
- documents/photos ;
- action corrective.

---

# 38. Tâches de maintenance

Une intervention peut avoir plusieurs tâches avec :
- description ;
- ordre ;
- caractère obligatoire ;
- état ;
- personne ;
- date ;
- remarques.

---

# 39. Alertes de maintenance

Par défaut, pour les échéances en heures :
- 50 h avant ;
- 10 h avant ;
- à l'échéance.

Pour les échéances calendaires :
- 30 jours avant ;
- 7 jours avant ;
- 1 jour avant ;
- à l'échéance.

Les seuils sont configurables.

---

# 40. Maintenance corrective

Peut être déclenchée par :
- panne ;
- incident ;
- observation du journal machine ;
- signalement technique ;
- autre événement autorisé.

Elle peut être créée directement depuis le module concerné.

---

# 41. Certificats

Suivre :
- type ;
- numéro/référence ;
- date d'émission ;
- expiration ;
- autorité ;
- remorqueur ;
- document ;
- statut ;
- remarques.

Les certificats arrivant à expiration doivent générer des alertes, notamment au chef d'armement.

Les types de certificats doivent être configurables.

---

# 42. Planning annuel des exercices

**Il doit exister un module dédié au planning annuel des exercices.**

Les exercices doivent suivre un planning annuel préétabli.

Le planning contient notamment :
- année ;
- exercice ;
- remorqueur concerné ;
- date prévue ;
- fréquence ;
- responsable ;
- participants requis ;
- statut ;
- remarques ;
- référence/document.

---

# 43. Exécution d'un exercice

Après réalisation, enregistrer :
- date réelle ;
- participants ;
- responsable ;
- résultat ;
- observations ;
- actions correctives ;
- documents ;
- statut.

Statuts à distinguer :
- prévu ;
- à venir ;
- réalisé ;
- en retard ;
- annulé.

---

# 44. Sécurité / ISM / ISPS

Gérer selon les besoins :
- exercices ;
- observations ;
- incidents ;
- actions correctives ;
- documents ;
- validations.

Le capitaine peut saisir les informations qui lui sont autorisées.

Le chef d'armement dispose de l'autorité de validation.

Une donnée de sécurité validée ne doit pas pouvoir être modifiée silencieusement. Toute correction doit être traçable.

---

# 45. Documents

Le module doit gérer :
- document ;
- type ;
- remorqueur ;
- maintenance ;
- certificat ;
- exercice ;
- sécurité ;
- date ;
- expiration si applicable ;
- version ;
- auteur ;
- statut.

Les photos et pièces jointes peuvent être liées aux modules concernés.

---

# 46. Notifications et alertes

Le système doit centraliser notamment :
- carburant proche de 20 % ;
- maintenance 50 h avant ;
- maintenance 10 h avant ;
- maintenance due ;
- maintenance 30/7/1 jours avant ;
- certificat arrivant à expiration ;
- exercice à venir ;
- exercice en retard ;
- absence de prise de service après une heure ;
- conflit opérationnel ;
- événement de sécurité.

Éviter les notifications en double.

---

# 47. Tableau de bord capitaine

Afficher :
- remorqueur ;
- service ;
- équipage ;
- statut ;
- mission active ;
- missions récentes ;
- carburant ;
- heures moteur ;
- alertes ;
- actions à effectuer.

---

# 48. Tableau de bord chef mécanicien

Afficher :
- maintenance à venir ;
- maintenance en retard ;
- heures moteur ;
- interventions correctives ;
- alertes techniques ;
- carburant ;
- huile ;
- journal machine.

---

# 49. Tableau de bord chef d'armement

Afficher :
- flotte ;
- disponibilité ;
- missions ;
- équipages ;
- maintenance ;
- certificats ;
- exercices ;
- conflits ;
- sécurité ;
- notifications.

---

# 50. Tableau de bord administrateur

Vue globale et accès à la configuration de la compagnie selon les droits.

---

# 51. Tableau de bord dispatcher

Si activé :
- disponibilité ;
- missions ;
- opérations à venir ;
- conflits ;
- visibilité des affectations.

---

# 52. Rapports

Produire notamment :
- missions par remorqueur ;
- missions par capitaine ;
- missions par pilote ;
- missions par navire ;
- missions par type de mouvement ;
- heures moteur ;
- carburant ;
- maintenance ;
- certificats ;
- exercices ;
- équipages ;
- jours/heures travaillés par personne ;
- remplacements ;
- incidents ;
- actions correctives.

Filtres par période et entité.

Exports à prévoir.

---

# 53. Recherche et filtres

Les grandes listes doivent permettre :
- recherche ;
- filtres ;
- tri ;
- périodes ;
- pagination lorsque nécessaire.

Notamment pour :
- missions ;
- remorqueurs ;
- équipages ;
- utilisateurs ;
- maintenance ;
- certificats ;
- exercices ;
- journal machine ;
- documents.

---

# 54. Historique et traçabilité

Les opérations importantes doivent être traçables :
- missions ;
- modifications de missions ;
- heures début/fin ;
- remplacements ;
- maintenance ;
- certificats ;
- exercices ;
- prises de service ;
- contestations ;
- validations ;
- changements de configuration.

Conserver lorsque pertinent :
- qui ;
- quoi ;
- quand ;
- avant/après ;
- pourquoi.

---

# 55. Architecture fonctionnelle de navigation

Structure indicative :

**Tableau de bord**

**Opérations**
- Missions
- Disponibilité
- Prise de service

**Flotte**
- Remorqueurs
- Caractéristiques
- Équipements
- Documents

**Équipages**
- Équipages
- Membres
- Services
- Affectations
- Remplacements

**Technique**
- Journal machine
- Heures moteur
- Carburant
- Huile
- Maintenance

**Conformité / Sécurité**
- Certificats
- Exercices annuels
- Sécurité
- Incidents
- Actions correctives
- Documents

**Rapports**

**Notifications**

**Administration**
- Société
- Utilisateurs
- Rôles
- Référentiels
- Paramètres

Les menus visibles dépendent du rôle.

---

# 56. Principes UX

MyTug doit être pensé pour des personnes travaillant réellement dans un environnement portuaire.

Priorités :
- saisie rapide ;
- peu de clics ;
- informations critiques visibles ;
- statuts clairs ;
- formulaires simples ;
- erreurs explicites ;
- confirmation des actions importantes ;
- utilisation possible sur tablette/mobile lorsque nécessaire.

Ne pas transformer une opération simple en procédure administrative excessive.

---

# 57. États importants

Les états doivent être clairement identifiables :
- disponible ;
- occupé ;
- maintenance ;
- désarmé ;
- indisponible ;
- mission active ;
- maintenance en retard ;
- certificat bientôt expiré ;
- exercice en retard.

---

# 58. Règles métier définitives à préserver

## Équipages
- 3 équipages normalement par remorqueur ;
- 1 travaille et 2 se reposent ;
- cycles 2/4 et 3/6 ;
- repos double du travail ;
- heure de relève fixe ;
- relève retardée si manœuvre en cours ;
- remplacement possible au milieu du service ;
- nombre de jours/heures travaillés par personne.

## Tour de rôle
- aucune automatisation ;
- organisation entre capitaines/équipages.

## Missions
- pilote ;
- navire ;
- mouvement ;
- autres remorqueurs ;
- position ;
- début ;
- fin ;
- heures moteur ;
- créateur ;
- statut.

## Disponibilité
- le remorqueur reste occupé jusqu'à l'enregistrement de l'heure de fin réelle.

## Dispatcher
- facultatif ;
- ne doit jamais bloquer l'opération.

## ASD / conventionnel
- le pilote peut demander un type ;
- cela peut modifier l'ordre habituel ;
- l'application doit autoriser la situation.

## Urgences
- possibilité de solliciter un autre remorqueur/une autre compagnie ;
- VTS ou pilote peut décider.

## Maintenance
- préventive + corrective ;
- heures moteur et/ou calendrier ;
- alertes 50 h / 10 h / échéance ;
- alertes 30 / 7 / 1 jour ;
- chef mécanicien responsable.

## Carburant
- capacité en tonnes ;
- alerte autour de 20 %.

## Certificats
- suivi des expirations ;
- alertes chef d'armement.

## Exercices
- planning annuel préétabli ;
- suivi prévu/réalisé/en retard.

---

# 59. Ce qu'il ne faut PAS faire

Ne pas :
- inventer un tour de rôle automatique ;
- rendre le dispatcher obligatoire ;
- considérer automatiquement un remorqueur comme disponible à la fin d'une durée théorique ;
- empêcher les remplacements au milieu d'un service ;
- supposer qu'une seule personne occupe un poste pendant tout le service ;
- exposer les données privées d'un capitaine à un autre ;
- rendre obligatoire un service payant externe ;
- coder en dur les données de production ;
- bloquer inutilement les opérations.

---

# 60. Philosophie du produit

MyTug doit respecter trois priorités :

### 1. Opérationnel
Le capitaine doit pouvoir travailler rapidement.

### 2. Fiabilité
Les données importantes doivent être cohérentes et traçables.

### 3. Management
Le chef d'armement et les responsables doivent disposer d'une vision globale fiable.

Lorsque l'administration et l'efficacité opérationnelle entrent en conflit, privilégier l'efficacité opérationnelle tout en conservant la traçabilité nécessaire.

---

# 61. Cycle complet attendu

MyTug doit couvrir le cycle :

**Configuration de la compagnie**
→ utilisateurs
→ remorqueurs
→ équipages
→ prise de service
→ disponibilité
→ mission
→ heures moteur
→ journal machine
→ carburant/huile
→ maintenance
→ certificats
→ exercices
→ sécurité
→ notifications
→ rapports
→ historique.

---

# 62. Consigne au développeur / Codex

Reconstruire MyTug **from scratch** à partir de ce document.

Les anciennes décisions techniques ne constituent pas une contrainte.

Les anciennes bases de données et l'ancien code ne constituent pas une référence.

En revanche, **toutes les règles métier et fonctionnalités de ce document sont la référence produit**.

Pour une ambiguïté métier :
1. identifier la règle manquante ;
2. ne pas inventer une règle critique ;
3. proposer une décision au Product Owner.

Pour les choix purement techniques, le développeur est libre de choisir la solution la plus sûre, simple, maintenable, évolutive et adaptée à une application web professionnelle.

**FIN DU HANDOFF**
