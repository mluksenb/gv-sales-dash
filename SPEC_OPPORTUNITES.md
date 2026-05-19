# Spécification Produit — Opportunités (Fiche Client)

---

Ce document décrit la fonctionnalité **Opportunités** à intégrer dans la fiche client du back-office conseillers Goodvest. Il ne couvre que le **nouveau** : l’onglet Opportunités, le tableau des deals et le panneau latéral de détail.

**Hors périmètre** (déjà en place dans le back-office) :

- Structure générale de la fiche client (en-tête, identité, conseiller, synthèse financière, fil d’Ariane, etc.)
- Mécanisme existant de navigation par onglets et paramétrage d’URL associé
- Contenu des onglets Informations et Projets

---

## 1. Contexte et objectif

Un **deal** (opportunité commerciale) est une démarche de collecte ou de vente rattachée à un client ou prospect. Depuis la fiche client, le conseiller doit pouvoir :

1. Consulter **toutes les opportunités** du client dans un tableau filtrable et triable.
2. Ouvrir le **détail d’un deal** dans un panneau latéral, sans quitter la fiche.
3. Y voir l’**historique d’étapes**, le **montant**, la **source marketing**, les **projets liés** et les **tâches** associées.

Le même panneau de détail doit pouvoir être ouvert depuis le **Dashboard Conseiller** lorsqu’une tâche est liée à un deal (cf. § 6).

---

## 2. Intégration dans la fiche client

### 2.1 Nouvel onglet

- Ajouter un onglet **Opportunités** dans la barre d’onglets existante de la fiche client (position recommandée : entre Informations et Projets).
- Le fil d’Ariane doit refléter l’onglet actif (libellé « Opportunités » lorsque cet onglet est sélectionné).

### 2.2 Routage

Le back-office dispose déjà d’un mécanisme d’onglets via URL. Il faut **y ajouter une nouvelle valeur** pour cet onglet, par exemple : `opportunites` (à aligner sur les conventions de nommage déjà utilisées pour les autres onglets).

- L’URL doit permettre d’ouvrir directement la fiche client sur l’onglet Opportunités (lien profond, favori, retour navigateur).
- Le comportement de synchronisation URL ↔ onglet actif reste celui du produit existant ; seule la nouvelle valeur est à prendre en charge.

---

## 3. Modèle de données — Deal

Chaque opportunité est un enregistrement **Deal** rattaché au client dont on consulte la fiche.

### 3.1 Champs principaux


| Champ               | Type / valeurs                                                                 | Description                                                                 |
| ------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `id`                | string                                                                         | Identifiant technique interne                                               |
| `dealId`            | string                                                                         | Identifiant métier affiché — libellé utilisateur « Deal #[dealId] »         |
| `creation`          | datetime                                                                       | Date et heure de création du deal                                           |
| `type`              | `New Biz` \| `Cross-Sell` \| `Upsell`                                          | Type commercial                                                             |
| `source`            | `Direct` \| `Paid Search` \| `Organic Search` \| `AI Referral`                 | Canal d’acquisition (liste à valider côté métier si besoin)                   |
| `owner`             | string (référence conseiller)                                                  | Conseiller responsable du deal                                              |
| `montant`           | number (€)                                                                     | Montant actuel                                                              |
| `etape`             | cf. § 7                                                                        | Étape courante du pipeline                                                  |
| `projets`           | `DealProjet[]`                                                                 | Projets liés au deal                                                        |
| `closedDate`        | date \| null                                                                   | Date de clôture ; `null` tant que le deal n’est pas clôturé                 |
| `lastReachedEtape`  | étape pipeline \| null                                                         | Dernière étape atteinte avant passage en **Perdue** (obligatoire si Perdue) |
| `stageHistory`      | `DealStageEntry[]`                                                             | Historique chronologique des étapes                                         |
| `amountHistory`     | `DealAmountEntry[]`                                                            | Historique des révisions de montant                                         |
| `utm`               | objet UTM                                                                      | Paramètres de tracking (tous nullable)                                      |


### 3.2 Projet lié (`DealProjet`)


| Champ           | Type / valeurs        | Description                         |
| --------------- | --------------------- | ----------------------------------- |
| `projetId`      | string                | Identifiant projet                  |
| `projetName`    | string                | Libellé affiché                     |
| `provider`      | string                | Assureur / fournisseur              |
| `status`        | `Ouvert` \| `Clôturé` | Statut du projet                    |
| `creationDate`  | date                  | Date de création du projet          |


### 3.3 Historique d’étapes (`DealStageEntry`)


| Champ        | Description                         |
| ------------ | ----------------------------------- |
| `etape`      | Étape atteinte                      |
| `enteredAt`  | Horodatage d’entrée dans l’étape    |


### 3.4 Historique de montant (`DealAmountEntry`)


| Champ        | Description              |
| ------------ | ------------------------ |
| `montant`    | Montant à cette date     |
| `changedAt`  | Horodatage du changement |


### 3.5 Paramètres UTM


| Champ          | Type           |
| -------------- | -------------- |
| `utmSource`    | string \| null |
| `utmMedium`    | string \| null |
| `utmCampaign`  | string \| null |
| `utmContent`   | string \| null |


### 3.6 Lien tâche ↔ deal

Les tâches de type **Demande de rappel** et **Drop** peuvent référencer un deal (`dealId`, montant, étape, projet(s) associés). Ce lien permet d’ouvrir le panneau de détail du deal concerné (cf. § 6).

---

## 4. Onglet Opportunités — Tableau des deals

### 4.1 Filtres

Quatre filtres en **multi-sélection** (menus déroulants ou équivalent UI du back-office) :


| Dimension | Libellé par défaut (indicatif) | Valeurs                                                                 |
| --------- | ------------------------------ | ----------------------------------------------------------------------- |
| Type      | Tous les types                 | New Biz, Cross-Sell, Upsell                                             |
| Source    | Toutes les sources             | Valeurs distinctes présentes dans les deals du client                   |
| Owner     | Tous les owners                | Conseillers distincts présents comme owner sur les deals du client      |
| Étape     | Toutes les étapes              | Nouvelle, Contacté / RDV pris, Qualifié, Signé / Souscrit, Gagnée, Perdue |


**Logique de filtrage :**

- Entre dimensions : **ET** (un deal doit satisfaire chaque dimension pour laquelle au moins une valeur est sélectionnée).
- Au sein d’une dimension : **OU** (le deal doit correspondre à l’une des valeurs cochées).
- Possibilité de réinitialiser chaque filtre (revenir à « tout »).
- Lorsqu’une sélection est active, le libellé du filtre peut résumer la sélection (ex. une valeur seule, ou « Valeur1 +N »).

### 4.2 Colonnes


| Colonne    | Triable | Contenu                                                                 |
| ---------- | ------- | ----------------------------------------------------------------------- |
| Création   | Oui     | Date de création du deal                                                |
| Type       | Oui     | Type commercial (New Biz, Cross-Sell, Upsell)                           |
| Projet     | Oui     | Voir § 4.4                                                              |
| Montant    | Oui     | Montant actuel en euros ; traitement visuel distinct si étape **Perdue** |
| Étape      | Oui     | Représentation compacte de la progression dans le pipeline (cf. § 7)    |
| Statut     | Non     | Libellé de l’étape courante                                             |
| Close Date | Oui     | Date de clôture, ou placeholder si absente                              |
| Source     | Oui     | Canal d’acquisition                                                     |
| Owner      | Oui     | Conseiller responsable (identité lisible : nom et/ou avatar)            |


### 4.3 Tri

- Clic sur l’en-tête d’une colonne triable : tri ascendant ; second clic : descendant.
- Colonne active identifiable pour l’utilisateur.
- Ordre par défaut : ordre renvoyé par l’API (ou règle métier à définir côté back-end si besoin).
- Règles particulières :
  - **Montant** : tri numérique.
  - **Close Date** : les valeurs vides en fin de liste en tri ascendant.
  - **Projet** : tri sur le nom du **premier** projet lié.

### 4.4 Cellule Projet


| Cas                    | Comportement                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| Un seul projet lié     | Afficher le nom du projet ; action possible vers la fiche projet si le produit le prévoit |
| Plusieurs projets liés | Afficher un libellé du type « N projets » ; permettre de lister tous les noms (popover, menu, etc.) |


### 4.5 Interaction sur les lignes

- Clic sur une ligne : ouvre le panneau latéral de détail pour ce deal.
- La ligne du deal ouvert doit être identifiable (état sélectionné).
- Aucun résultat après filtrage : message explicite du type « Aucun deal ne correspond aux filtres sélectionnés ».

---

## 5. Panneau latéral — Détail d’une opportunité

Panneau latéral (drawer) superposé au contenu de la fiche, ancré à droite. Le contenu principal de la fiche reste visible en arrière-plan ; le panneau se ferme sans quitter la fiche.

### 5.1 Ouverture et fermeture

- **Ouverture** : au clic sur une ligne du tableau, ou depuis une tâche dashboard liée (§ 6).
- **Fermeture** : action explicite de fermeture, clic sur la zone de fond assombrie, ou ouverture d’un autre deal dans le tableau.
- Un seul deal affiché à la fois dans le panneau.

### 5.2 En-tête du panneau

| Élément              | Contenu                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| Titre                | `Deal #[dealId]` et type commercial                                     |
| Date de création     | Libellé du type « Créé le [date] »                                      |
| Montant actuel       | Montant principal mis en avant                                          |
| Historique montant   | Si plusieurs entrées dans `amountHistory` : permettre de déplier la liste chronologique (montant + date par ligne) ; la dernière entrée correspond au montant actuel |
| Progression d’étape  | Voir § 5.4                                                              |

**Deal Perdue :** le montant principal doit être clairement distingué des deals actifs (ex. barré ou atténué — choix UI laissé à l’implémentation).

### 5.3 Historique des montants (dans l’en-tête)

Affiché uniquement si `amountHistory` contient **plus d’une** entrée.

Pour chaque révision : montant et date (`changedAt`). La révision courante doit être identifiable dans la liste.

### 5.4 Progression et historique d’étapes (dans l’en-tête)

**Vue synthétique (repliée par défaut) :**

- Représentation de la progression dans le pipeline sur les étapes « positives » (Nouvelle → Gagnée), sans inclure **Perdue** comme étape de la barre.
- Libellé de l’étape courante.
- Durée dans l’étape courante : temps écoulé depuis la dernière entrée de `stageHistory` jusqu’à maintenant (affichage en jours, heures/minutes selon la durée).
- Si `stageHistory` n’est pas vide : action pour déplier le détail.

**Deal Perdue :**

- L’étape affichée est **Perdue**.
- La barre de progression reflète l’avancement jusqu’à `lastReachedEtape` (et non au-delà).

**Journal déplié :**

Pour chaque entrée de `stageHistory` :

| Information | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| Étape       | Libellé de l’étape                                                          |
| Durée       | Temps passé dans cette étape avant la suivante ; pour l’étape courante, jusqu’à maintenant |
| Date        | `enteredAt`                                                                 |

L’étape courante doit être identifiable dans le journal. Possibilité de replier le journal.

### 5.5 Corps du panneau — Cartes

Le corps du panneau défile indépendamment de l’en-tête. Contenu organisé en **cartes** empilées.

#### 5.5.1 Carte Source

| Contenu fixe | `source` (canal d’acquisition) |
| Expansion    | Si au moins un paramètre UTM est renseigné : section repliable listant `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` (valeur ou indication d’absence) |

#### 5.5.2 Carte Détails clés

Deux champs **modifiables** par le conseiller (persistance côté serveur) :

**Owner**

- Affichage du conseiller actuel.
- Édition : sélection dans la liste des conseillers éligibles, avec recherche/filtrage si la liste est longue.

**Close date**

- Libellé du type « Close date ».
- Affichage de la date de clôture ou d’un libellé « Non définie » si `closedDate` est null.
- Édition : sélecteur de date.

#### 5.5.3 Carte Projets liés

- Titre avec le **nombre** de projets liés.
- Section repliable.
- Pour chaque projet : nom, statut (Ouvert / Clôturé), fournisseur, date de création.
- Lien ou navigation vers la fiche projet si le back-office le prévoit déjà ailleurs.

#### 5.5.4 Carte Tâches

Liste des tâches dont le `dealId` correspond au deal affiché (même source que le dashboard conseiller).

**Filtres :**

| Dimension | Options                                                                 |
| --------- | ----------------------------------------------------------------------- |
| Statut    | Toutes ; À traiter (statut ≠ terminé) ; Validées (statut = terminé)     |
| Type      | Tous ; Demande de rappel ; Rétention livret ; Drop                      |

**Pour chaque tâche afficher :**

- Type de tâche et statut.
- Owner (conseiller).
- Si en cours : échéance.
- Si terminée : date de validation et indicateur SLA (aligné sur la spec Dashboard).
- Actions : marquer comme traitée ; rouvrir si déjà traitée ; supprimer (comportement aligné sur le dashboard).

Messages vides : « Aucune tâche » ou « Aucune tâche ne correspond aux filtres » selon le cas.

---

## 6. Ouverture depuis le Dashboard Conseiller

Fonctionnalité transverse à intégrer en parallèle ou après la fiche client :

1. Les tâches **Demande de rappel** et **Drop** affichent un rappel du deal lié : identifiant `Deal #…`, montant, étape, projet(s).
2. Clic sur ce rappel : ouverture du **même panneau latéral** de détail deal.
3. Les tâches **Rétention livret** (liées à un projet, pas à un deal) n’utilisent pas ce mécanisme.

**Cas limite :** depuis le dashboard, si le deal n’est pas déjà chargé en contexte, l’application doit soit charger le deal (API dédiée), soit naviguer vers la fiche client du membre concerné avec le panneau ouvert — à trancher selon l’architecture du back-office.

---

## 7. Règles métier — Pipeline et états

### 7.1 Ordre des étapes

Pipeline principal (dans l’ordre) :

1. Nouvelle  
2. Contacté / RDV pris  
3. Qualifié  
4. Signé / Souscrit  
5. Gagnée  

Étape terminale négative :

6. **Perdue** — hors séquence de progression « positive » ; nécessite `lastReachedEtape` pour afficher jusqu’où le deal était parvenu.

Les transitions d’étape et l’alimentation de `stageHistory` / `amountHistory` sont gérées par le back-end (hors édition manuelle dans ce panneau).

### 7.2 Affichage — Deal Perdue (règles fonctionnelles)


| Zone              | Comportement attendu                                                |
| ----------------- | ------------------------------------------------------------------- |
| Montant (tableau) | Distinction visuelle par rapport aux deals actifs                     |
| Montant (panneau) | Montant non présenté comme un objectif actif (ex. barré / atténué) |
| Barre progression | Progression figée au niveau de `lastReachedEtape`                  |
| Étape affichée    | **Perdue** dans le statut et l’historique                           |

### 7.3 Représentation de la progression (tableau)

- Vue compacte sur les 5 étapes « positives » (icône ou indicateur par étape).
- L’étape courante doit être identifiable.
- **Perdue** : progression affichée jusqu’à `lastReachedEtape`, pas au-delà.
- Info-bulle ou équivalent au survol : libellé de chaque étape.

---

## 8. API et persistance


| Besoin                         | Comportement attendu                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Liste des deals                | Endpoint (ou champ agrégé fiche client) retournant tous les deals du membre          |
| Détail deal                    | Données complètes pour le panneau (incl. historiques, UTM, projets)                  |
| Filtres / tri tableau          | Côté client sur la liste chargée, ou côté serveur si volume important                |
| Modification owner             | Mise à jour persistée ; rafraîchissement tableau + panneau                           |
| Modification close date        | Idem                                                                                 |
| Historiques étape / montant    | Lecture seule ; alimentés par les transitions métier                                 |
| Tâches dans le panneau         | Même API / règles que le dashboard ; actions traiter / rouvrir / supprimer synchronisées |
| Rafraîchissement               | Après action ou changement métier, les vues liste et panneau reflètent l’état à jour sans rechargement complet de page si possible |

---

## 9. Formats d’affichage (indicatifs)

- **Montants** : devise EUR, format français (séparateur de milliers, euros entiers ou selon règle produit existante).
- **Dates** : format français cohérent avec le reste du back-office (date seule ou date + heure selon le champ).
- Les choix de composants UI (drawer, table, filtres) restent alignés sur le design system du back-office existant.
