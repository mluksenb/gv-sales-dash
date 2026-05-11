# Spécification Produit — Dashboard Conseiller

## Vue d'ensemble

Le Dashboard Conseiller est l'interface principale de travail quotidien d'un conseiller Goodvest. Il centralise en une seule page son agenda hebdomadaire, ses indicateurs de performance et sa liste de tâches à traiter. L'objectif est de permettre au conseiller de visualiser instantanément sa charge, ses priorités et son avancement sans naviguer entre plusieurs outils.

---

## 1. En-tête fixe (sticky)

L'en-tête reste visible en haut de page lors du scroll.

### 1.1 Titre

Affiche le nom du conseiller connecté : **"Dashboard de [Prénom Nom]"**

### 1.2 Indicateur d'événement en temps réel

Un indicateur contextuel à droite affiche l'état du prochain ou de l'actuel événement du jour :


| Situation                               | Affichage                                                            |
| --------------------------------------- | -------------------------------------------------------------------- |
| Un événement est en cours               | Pastille animée + "En Cours" + nom de l'événement + "encore X min"   |
| Un événement commence dans ≤ 15 minutes | Pastille animée + heure de début + nom de l'événement + "dans X min" |
| Aucun événement en cours ou imminent    | "Journée terminée"                                                   |


- L'indicateur se rafraîchit automatiquement toutes les 30 secondes.
- La couleur de l'indicateur correspond à la catégorie de l'événement (cf. section 3.3).

---

## 2. Récapitulatif de la semaine

Un bloc de synthèse positionné au-dessus du calendrier, présentant les KPIs de la semaine affichée.

### 2.1 Répartition du temps par catégorie

Affichage du temps total passé sur chaque catégorie d'événement en heures/minutes et en pourcentage du temps total. Catégories affichées dans l'ordre :

1. Rendez-vous clients
2. Suivi leads
3. Care
4. Interne
5. OOO

### 2.2 Indicateurs de performance


| Métrique        | Calcul                                                  | Objectif journalier                                         |
| --------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| **RDV clients** | Nombre de rendez-vous clients confirmés (hors no-shows) | 6                                                           |
| **No-shows**    | Pourcentage de rendez-vous clients marqués no-show      | Le plus bas possible                                        |
| **Appels**      | Nombre d'appels passés vs. nombre attendu               | Configuré sur la page Objectifs (appels par heure de suivi) |
| **Tâches**      | Tâches traitées / total de tâches                       | —                                                           |
| **SLA tâches**  | Pourcentage de tâches traitées dans le délai SLA        | 100%                                                        |
| **Signé**       | Montant de collecte signé                               | Configuré sur la page Objectifs (par conseiller par jour)   |


Chaque métrique est accompagnée d'une barre de progression colorée (rouge → orange → jaune → vert) selon le taux d'atteinte.

### 2.3 Origine et calcul des objectifs

Deux objectifs sont **configurables par un manager commercial** via la page Objectifs (cf. document séparé) au niveau de chaque conseiller et par semaine :

- **Appels attendus par heure de suivi leads** — nombre d'appels par heure de temps de suivi disponible.
- **Volume signé par jour** — montant de collecte cible par jour travaillé.

Les autres objectifs (RDV clients / jour = 6, SLA tâches = 100%, etc.) sont des constantes du système.

### 2.4 Calcul des objectifs hebdomadaires

Les objectifs sont **définis au niveau de la journée**. L'objectif hebdomadaire est la somme des objectifs de chaque jour, pondérée par le coefficient OOO du jour (cf. section 3.7) :

- Jour travaillé → coefficient 1
- Demi-journée OOO → coefficient 0,5
- Journée complète OOO → coefficient 0

Exemple : un conseiller avec un objectif collecte de 15K€/jour et 1 jour complet OOO dans la semaine a un objectif hebdomadaire de 15K€ × 4 = 60K€.

---

## 3. Calendrier hebdomadaire

### 3.1 Navigation

- Affichage de la semaine du lundi au vendredi (5 jours ouvrés).
- Boutons précédent / suivant pour naviguer entre les semaines.
- Bouton pour replier / déplier la liste des événements (seuls les KPIs journaliers restent visibles en mode replié).
- Affichage de la plage de dates : "D MMM – D MMM YYYY".

### 3.2 Source des événements

Les événements proviennent de la **connexion Google Calendar active** du conseiller. Le système synchronise automatiquement les événements du calendrier Google du conseiller.

### 3.3 Catégories d'événements

Chaque événement est classé dans une catégorie, identifiable par un code couleur :


| Catégorie               | Couleur       | Description                                                     |
| ----------------------- | ------------- | --------------------------------------------------------------- |
| **Rendez-vous clients** | Vert émeraude | Rendez-vous avec un lead ou un client (via Calendly)            |
| **Care**                | Bleu ciel     | Support client (dossiers, mises à jour)                         |
| **OOO**                 | Rose          | Absence personnelle                                             |
| **Interne**             | Ambre         | Réunions internes, formations, 1:1                              |
| **Suivi leads**         | Violet        | Créneaux de prospection téléphonique (calculés automatiquement) |


Un système de filtres en bas du calendrier permet au conseiller de masquer / afficher chaque catégorie.

### 3.4 Calcul automatique des créneaux "Suivi leads"

Les créneaux de suivi leads ne sont pas des événements calendrier explicites. Ils sont **calculés automatiquement** à partir des espaces libres entre les événements calendrier, selon la règle suivante :

> **Journée de travail** : 9h00 – 18h00
>
> Tout intervalle libre entre deux événements (ou entre le début/fin de journée et un événement) est automatiquement rempli par un bloc "Suivi leads" affichant la durée disponible.

Exemple : si le premier événement commence à 10h30, un bloc "Suivi leads – 1h30" est affiché de 9h00 à 10h30.

### 3.5 Durée effective des événements

- **Durée par défaut** d'un rendez-vous : 30 minutes (si non spécifié).
- **Durée d'un no-show** : 10 minutes (le conseiller est libéré plus tôt).
- Les événements Care, Interne et OOO ont leur durée explicitement spécifiée.

### 3.6 Colonne journalière

Chaque jour affiche :

#### Métriques journalières (toujours visibles, même en mode replié)

- RDV clients : nombre confirmé / objectif 6 (barre de progression)
- Appels : nombre réalisé / nombre attendu (barre de progression)
- Suivi leads : durée totale disponible
- Tâches : traitées / total (barre de progression)
- SLA tâches : pourcentage de tâches traitées dans les délais (barre de progression)
- Signé : montant / objectif 15K€ (barre de progression, encadré en vert)

#### Liste des événements (masquable)

- Chaque événement est une carte cliquable montrant : heure, durée, nom/description.
- Pour les rendez-vous clients : badges "Lead" ou "Client" + badge tier (Tier 1/2/3) + badge "Tél" le cas échéant.
- Le jour courant est visuellement mis en avant (bordure foncée, fond légèrement teinté).
- Les jours non-courants ont leurs événements en opacité réduite (remontée à 100% au survol).
- Un indicateur rouge (flèche) pointe sur l'événement actuellement en cours pour le jour d'aujourd'hui.

### 3.7 Événements OOO — Ajustement des objectifs

La présence d'événements OOO dans la journée réduit proportionnellement les objectifs du jour selon la règle suivante :


| Durée totale OOO dans la journée          | Effet sur les objectifs du jour                |
| ----------------------------------------- | ---------------------------------------------- |
| < 4 heures                                | Aucun ajustement — objectifs normaux           |
| ≥ 4 heures et < 8 heures                  | **Demi-journée** — objectifs réduits de moitié |
| ≥ 8 heures ou événement "journée entière" | **Journée non travaillée** — objectifs retirés |


**Affichage de la colonne du jour selon le cas :**

- **Demi-journée (objectifs ÷ 2)** : les barres de progression et les dénominateurs sont présents mais reflètent les objectifs réduits (ex : 3 RDV au lieu de 6, 7 500 € au lieu de 15 000 €).
- **Journée non travaillée (objectifs = 0)** : les décomptes bruts restent visibles (nombre de RDV, appels, tâches, montant signé) mais les objectifs, barres de progression et pourcentages sont retirés.

**Impact sur les objectifs hebdomadaires :**

L'objectif hebdomadaire tient compte de ces ajustements. Chaque jour contribue à l'objectif de la semaine selon son coefficient :

- Jour travaillé normalement → coefficient 1
- Demi-journée OOO → coefficient 0,5
- Journée complète OOO → coefficient 0

> **Exemple :** un conseiller avec 1 journée complète OOO et 1 demi-journée OOO dans la semaine a un objectif hebdomadaire de RDV = 6 × (3 + 0,5 + 0) = 6 × 3,5 = 21 (au lieu de 30).

### 3.8 Événements "No-show"

Un rendez-vous marqué comme no-show est affiché avec :

- Bordure en pointillés rouges
- Heure barrée
- Icône "interdit" à la place de la durée

### 3.9 Clic sur un rendez-vous client — Modal de détail

Lorsque le conseiller clique sur un événement de type "Rendez-vous clients", une modale s'ouvre affichant :

1. **Les réponses aux questions du formulaire de réservation Calendly** — Lors de la prise de rendez-vous, le lead répond à des questions sur Calendly. Ces réponses sont récupérées via l'API Calendly et affichées ici pour préparer l'appel.
2. **Actions de suivi post-rendez-vous** :
  - **Confirmer la présence** — Le conseiller indique que le lead/client a bien participé au rendez-vous.
  - **Marquer comme no-show** — Le conseiller indique que le lead/client ne s'est pas présenté. Cela met à jour le statut de l'événement et recalcule le temps de suivi leads disponible (la durée effective passe à 10 minutes).

Ces deux actions font appel à l'**API Calendly** pour synchroniser le statut du rendez-vous.

---

## 4. Tableau des tâches

### 4.1 Types de tâches


| Type                  | Description                                          |
| --------------------- | ---------------------------------------------------- |
| **Demande de rappel** | Un lead ou client a demandé à être rappelé           |
| **Rétention livret**  | Action de rétention sur un compte épargne            |
| **Drop**              | Un prospect a abandonné son parcours de souscription |


### 4.2 Onglets et compteurs

La barre d'onglets permet de filtrer par type de tâche :

- **Tout** (affiche le total)
- **Demande de rappel** (avec compteur)
- **Drop** (avec compteur)
- **Rétention livret** (avec compteur)

### 4.3 Filtres et tri

#### Filtre par produit

Menu déroulant multi-sélection parmi les produits Goodvest :

- Assurance-vie
- Assurance-vie enfant
- Livret Goodvest
- Plan Épargne Retraite

Lorsqu'un filtre est actif, le bouton montre un badge avec le nombre de filtres sélectionnés. Un bouton "Réinitialiser" permet de tout désélectionner.

#### Options de tri

- **Par défaut** : ordre chronologique de création (plus récent en haut)
- **Plus en retard d'abord** : trié par SLA croissant (les tâches les plus en retard apparaissent en premier)
- **Montant le plus élevé** : trié par montant de projet décroissant

### 4.4 Colonnes du tableau


| Colonne       | Contenu                                                                |
| ------------- | ---------------------------------------------------------------------- |
| **Échéance**  | Date et heure de création (format "lun. 5 mai 14:16") + indicateur SLA |
| **Prospect**  | Nom complet + badges (Lead/Client, Tier 1/2/3)                         |
| **Téléphone** | Numéro cliquable (lien `tel:`) au format +33 X XX XX XX XX             |
| **Type**      | Badge coloré du type de tâche (visible uniquement en onglet "Tout")    |
| **Projet**    | Nom du produit + montant en euros + étape du parcours                  |


#### Étapes du parcours projet


| Étape        | Libellé affiché |
| ------------ | --------------- |
| proposition  | Proposition     |
| simulation   | Simulation      |
| souscription | Souscription    |
| documents    | Justificatifs   |
| envoi        | Envoyé          |


### 4.5 Indicateur SLA (temps restant pour traiter)

Chaque tâche possède un indicateur de temps restant avant dépassement du SLA.

#### Règle de calcul du temps restant

Le SLA représente le temps de travail effectif restant avant expiration du délai de traitement :

- **Valeur positive** = il reste du temps (ex : 10 → il reste 10 minutes de travail effectif)
- **Valeur négative** = le délai est dépassé (ex : -2944 → en retard de 2944 minutes de travail effectif)

#### Exclusions du décompte SLA

Le compteur SLA ne décompte que le **temps de travail disponible**. Les périodes suivantes sont exclues du calcul :

1. **Hors horaires de bureau** — Le temps entre 18h00 et 9h00 le lendemain (nuits), ainsi que les week-ends, ne compte pas dans le SLA.
2. **Événements OOO** — La durée des événements "Out of Office" est déduite du temps SLA disponible.
3. **Événements Interne** — La durée des réunions internes est déduite du temps SLA disponible.

En résumé, seul le temps pendant lequel le conseiller est effectivement disponible pour traiter ses tâches (créneaux "Suivi leads", "Rendez-vous clients" et "Care") est comptabilisé dans le SLA.

> **Exemple :** une tâche créée à 17h50 avec un SLA de 30 minutes. Il reste 10 minutes avant la fin de journée (18h00). Le lendemain, si le conseiller a une réunion interne de 9h00 à 10h00, le compteur SLA reprend à 10h00 et les 20 minutes restantes expirent à 10h20.

#### Format d'affichage


| Situation             | Format           | Exemple        | Couleur |
| --------------------- | ---------------- | -------------- | ------- |
| Dans les temps (< 1h) | `Xm`             | `10m`          | Vert    |
| Dans les temps (≥ 1h) | `Xh` ou `XhYY`   | `2h`, `1h30`   | Vert    |
| En retard (< 1h)      | `+Xm`            | `+45m`         | Rouge   |
| En retard (1h – 24h)  | `+Xh` ou `+XhYY` | `+3h`, `+2h30` | Rouge   |
| En retard (≥ 24h)     | `+XjYh`          | `+2j3h`        | Rouge   |


Le signe **"+"** indique un **dépassement** — le temps de travail effectif écoulé au-delà du SLA.

### 4.6 Actions sur une tâche

Au survol d'une ligne, une barre d'actions apparaît :


| Action             | Icône     | Comportement                                                                                                                             |
| ------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Marquer traité** | ✓ (vert)  | Passe la tâche en statut "Terminé" et la retire de la liste                                                                              |
| **Notes**          | Crayon    | **Ouvre le panneau latéral Notes pour le lead concerné** — permet au conseiller de consulter et éditer les notes associées à ce prospect |
| **Supprimer**      | ✕ (rouge) | Supprime la tâche                                                                                                                        |


### 4.7 En-tête du tableau

L'en-tête des colonnes est fixe (sticky) et reste visible lors du scroll dans le tableau.

---

## 5. Mise à jour en temps réel (subscriptions)

Les données du dashboard doivent se rafraîchir automatiquement à intervalles réguliers **sans action de l'utilisateur** (pas besoin de recharger la page) :


| Donnée                      | Comportement attendu                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Événements calendrier**   | Rafraîchissement périodique depuis Google Calendar pour refléter les ajouts, modifications ou suppressions d'événements          |
| **Tâches**                  | Rafraîchissement périodique pour afficher les nouvelles tâches, les changements de statut, et la mise à jour des indicateurs SLA |
| **Indicateur de l'en-tête** | Mise à jour toutes les 30 secondes pour refléter l'état courant (événement en cours / prochain événement)                        |
| **Métriques**               | Recalculées à chaque rafraîchissement de données                                                                                 |


Le mécanisme doit être un système de **souscription temps réel** (type WebSocket ou polling intelligent) pour que les changements soient visibles quasi-instantanément.

---

## 6. Intégrations externes

### 6.1 Google Calendar

- Le conseiller doit avoir une **connexion active** à son compte Google Calendar.
- Les événements sont synchronisés depuis cette connexion.
- La catégorisation des événements (Rendez-vous clients, Care, OOO, Interne) est déterminée à partir des métadonnées des événements Google Calendar.

### 6.2 API Calendly

- Les rendez-vous clients sont créés via Calendly.
- Lors du clic sur un rendez-vous client, les **réponses au formulaire de réservation** sont récupérées via l'API Calendly.
- Les actions "Confirmer la présence" et "Marquer comme no-show" sont synchronisées avec Calendly via son API.

---

## 7. Règles métier — Constantes


| Paramètre                         | Valeur     | Note                                              |
| --------------------------------- | ---------- | ------------------------------------------------- |
| Début de journée                  | 9h00       |                                                   |
| Fin de journée                    | 18h00      |                                                   |
| Durée par défaut d'un rendez-vous | 30 minutes | Si non spécifié par l'événement                   |
| Durée effective d'un no-show      | 10 minutes |                                                   |
| Objectif RDV clients / jour       | 6          | Constante système                                 |
| Appels par heure de suivi         | Variable   | Défini par le manager sur la page Objectifs       |
| Objectif collecte / jour          | Variable   | Défini par le manager sur la page Objectifs       |
| Seuil demi-journée OOO            | 4 heures   | OOO ≥ 4h → objectifs du jour ÷ 2                  |
| Seuil journée complète OOO        | 8 heures   | OOO ≥ 8h ou "all day" → objectifs du jour retirés |


Les objectifs hebdomadaires sont dérivés : **objectif journalier × somme des coefficients OOO** de chaque jour de la semaine (cf. section 3.7).

---

## 8. Badges et indicateurs visuels

### 8.1 Badge Prospect

- **Lead** : fond bleu clair, texte bleu, bordure bleue
- **Client** : fond vert clair, texte vert, bordure verte

### 8.2 Badge Tier

- Affichage neutre (fond gris) avec le texte "Tier 1", "Tier 2" ou "Tier 3"

### 8.3 Badge Tél

- Fond orange clair, texte "Tél" — indique que le rendez-vous est un appel téléphonique (par opposition à un rendez-vous vidéo/physique)

### 8.4 Badge Type de tâche

- **Demande de rappel** : vert
- **Rétention livret** : violet
- **Drop** : ambre

---

## 9. Barres de progression — Logique de couleur

Toutes les barres de progression suivent un gradient de couleur continu en 5 paliers :


| Taux d'atteinte | Couleur    |
| --------------- | ---------- |
| 0%              | Rouge      |
| 25%             | Orange     |
| 50%             | Jaune      |
| 75%             | Vert clair |
| 100%            | Vert foncé |


Pour les métriques où un pourcentage élevé est négatif (ex : no-shows), le gradient est inversé (100% = rouge).

---

## 10. Responsive et ergonomie

- Le dashboard est optimisé pour un affichage bureau large (max-width : 88rem).
- Le header et l'en-tête du tableau de tâches sont sticky pour rester visibles lors du scroll.
- Les actions de ligne n'apparaissent qu'au survol (hover) pour garder l'interface épurée.
- Les événements des jours non-courants sont affichés à opacité réduite pour focaliser l'attention sur le jour en cours.