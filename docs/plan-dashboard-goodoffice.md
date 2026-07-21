# Cadrage en issues — Dashboard Goodoffice : raisons de contact & performance Fin (agent IA)

Projet Linear cible : [Dashboard Goodoffice : raisons de contact & performance Fin (agent IA)](https://linear.app/goodvest/project/dashboard-goodoffice-raisons-de-contact-and-performance-fin-agent-ia-0508b3b3ac8c/overview) · équipe **AI Ops**.

> Document de cadrage. Une fois validé, chaque « Issue » sera créée dans Linear sous ce projet. Contenu en français, factuel, sans tiret cadratin. Label `Area > Care` sur toutes les issues.

---

## Contexte

Le prototype `goodvest-proto` contient un dashboard analytique support (`support.html` + `src/support/`) construit sur les ~3 500 conversations Intercom déjà enrichies. L'objectif est de **reconstruire ce dashboard dans Goodoffice, sur données live**, alimenté par la table de conversations enrichies du projet « catégorisation ongoing » (sync AI-182).

Décisions (validées avec Marvin) :
- **Plateforme** : page custom dans Goodoffice.
- **Source de données** : table enrichie Goodoffice.
- **Dépendance** : dépend du projet catégorisation (données enrichies persistées en live, AI-182).
- **Périmètre v1** : tout ce que fait le prototype.
- **Modèle de livraison** : comme pour le projet catégorisation, Marvin livre **un nouveau repo public** contenant tout le nécessaire pour reproduire le dashboard. Ce repo encode déjà les définitions de métriques et le contrat de données (c'était tout l'objet du support dashboard) ; il n'y a donc **pas** d'issues séparées « figer les métriques » ou « contrat de données ». Le dev Goodoffice intègre ensuite cette référence sur données live.

### Référence : ce que fait le prototype (à répliquer en v1)

| Bloc | Contenu | Fichier de référence |
|---|---|---|
| KPI (4 cartes) | Volume total (+ split chat/email), taux d'escalade, taux de résolution autonome Fin (jauge), part de résolutions confirmées par le client | `src/support/components/KpiRow.tsx` |
| Raisons de contact | Arbre catégorie -> sous-sujets, volume + part %, toggle sujets secondaires, définitions taxonomie | `ContactReasons.tsx`, `TaxonomyModal.tsx` |
| Volume dans le temps | Histogramme hebdo empilé par état de résolution | `TrendChart.tsx` |
| Performance Fin par sujet | Matrice de priorité (bulles) + table triable (volume, barre résolution empilée, taux résolution/escalade) | `PriorityMatrix.tsx`, `FinPerformanceTable.tsx` |
| Priorités d'amélioration | Encart top sujets fort volume / faible résolution | `SupportApp.tsx` |
| Détail conversation | Panneau drill-down + lien d'ouverture Intercom | `ConversationPanel.tsx` |
| Filtres | Canal (all/chat/email), date (7/14/30/90/all), supportOnly, recherche | `FilterBar.tsx`, `lib/metrics.ts` |
| Calculs | KPIs, formules, états de résolution, couleurs catégories | `lib/metrics.ts`, `lib/resolution.ts`, `lib/categories.ts` |

Graphiques entièrement en SVG/CSS (aucune librairie de charting).

### Sémantique Fin & formules (encodées dans la lib de référence)

États : `fin_confirmed`, `fin_assumed`, `fin_escalated`, `human_only`. Fin n'intervient que sur le **chat** ; les emails sont `human_only`.

- `resolvedRate = (fin_confirmed + fin_assumed) / total`
- `escalatedRate = fin_escalated / total`
- `finResolvedRate = fin_resolved / finScopeTotal` (périmètre = chat, ou filtré)
- `confirmedShare = fin_confirmed / (fin_confirmed + fin_assumed)`
- `priorityScore = volume × (1 - resolvedRate)`

---

## Vue d'ensemble du découpage

**Lot Marvin (brique de référence)**
- Issue 1 — Créer le repo public de référence du dashboard

**Lot dev Goodoffice (intégration live)**
- Issue 2 — Calculer les métriques côté Goodoffice sur la table enrichie
- Issue 3 — Construire la page dashboard dans Goodoffice (UI + filtres)
- Issue 4 — Accès, placement et permissions
- Issue 5 — Recette et validation des chiffres

### Dépendances

```
[Projet catégorisation — table enrichie live (AI-182)] ──> Issue 2
Issue 1 ──> Issue 2 ──┐
Issue 1 ──> Issue 3   ├──> Issue 3 ──> Issue 4
                      └──> Issue 5 (avec Issue 3)
```

### Labels et conventions
- **Area** : `Care` sur toutes les issues. Pas de milestone.
- Besoin de design : **Non** (le repo de référence fixe le design ; application du design system Goodoffice à l'intégration).

---

## Issue 1 — Créer le repo public de référence du dashboard

**Lot / Porteur** : Marvin
**Area** : Care

### Objectif
Livrer un repo public contenant tout le nécessaire pour reproduire le dashboard de performance (raisons de contact + performance Fin) : composants UI, lib de calcul, et types d'entrée. C'est le livrable de Marvin pour le dev ; il encode déjà les définitions de métriques et le contrat de données.

### Périmètre
- Nouveau repo public (nom proposé : `goodvest-support-dashboard`), repartant de `src/support/` du prototype.
- Porter les composants (`KpiRow`, `ContactReasons`, `TrendChart`, `PriorityMatrix`, `FinPerformanceTable`, `StackedResolutionBar`, `FilterBar`, `TaxonomyModal`, `ConversationPanel`) et la lib (`metrics.ts`, `resolution.ts`, `categories.ts`, `format.ts`).
- Entrée = liste de conversations enrichies ; le **type d'entrée fait office de contrat de données**. Retirer le chiffrement et le password gate (`crypto.ts`, `PasswordGate.tsx`).
- Aligner les couleurs d'accent par catégorie avec le composant de timeline (cohérence avec AI-179).
- README en français documentant les métriques (formules Fin, raisons de contact, fenêtres), la forme d'entrée attendue, et un jeu de données d'exemple. Aucune donnée client versionnée.
- Prototype live de référence à fournir.

### Hors-scope
- L'intégration dans Goodoffice (Issues 2 à 5).

### Critères d'acceptation
- Repo public en place, dashboard de référence fonctionnel sur données d'exemple.
- README documentant métriques + forme d'entrée (contrat de données).

### Dépendances
Aucune (s'appuie sur le prototype existant).

---

## Issue 2 — Calculer les métriques côté Goodoffice sur la table enrichie

**Lot / Porteur** : développeur Goodoffice
**Area** : Care

### Objectif
Implémenter, sur la table enrichie, les agrégations et filtres produisant le payload du dashboard, en suivant la lib de référence (Issue 1).

### Périmètre
- KPIs (volume, split canal, taux de résolution Fin, escalade, confirmation), raisons de contact (primaire + secondaires), tendance hebdomadaire par état de résolution, performance Fin par sujet, priorités d'amélioration.
- Filtres : canal (all/chat/email), date (7/14/30/90/all), supportOnly, recherche.
- Périmètre Fin = chat ; emails = `human_only`. Le contrat de données correspond aux champs consommés par le repo de référence.

### Hors-scope
- Le rendu (Issue 3).

### Critères d'acceptation
- Toutes les métriques de la référence calculées sur données live.

### Dépendances
Dépend de la table enrichie live (projet catégorisation, AI-182) et de l'Issue 1.

---

## Issue 3 — Construire la page dashboard dans Goodoffice (UI + filtres)

**Lot / Porteur** : développeur Goodoffice
**Area** : Care

### Objectif
Construire la page custom dans Goodoffice en réutilisant les composants de référence (Issue 1), branchée sur le calcul (Issue 2), filtres inclus.

### Périmètre
- Tous les blocs du prototype : rangée KPI (dont jauge), arbre des raisons de contact (toggle secondaires, définitions taxonomie), histogramme hebdomadaire empilé, matrice de priorité, table de performance Fin triable, encart priorités d'amélioration, panneau de détail conversation (drill-down + lien Intercom).
- Barre de filtres (canal, date, supportOnly, recherche) recalculant l'ensemble des vues.

### Hors-scope
- L'accès (Issue 4).

### Critères d'acceptation
- La page rend tous les blocs du prototype sur données live, filtres opérationnels.

### Dépendances
Dépend des Issues 1 et 2.

---

## Issue 4 — Accès, placement et permissions

**Lot / Porteur** : développeur Goodoffice
**Area** : Care

### Objectif
Définir où vit la page dans Goodoffice et qui y accède.

### Périmètre
- Emplacement dans la navigation Goodoffice.
- Périmètre d'accès (pôle Care, management) et contrôle d'accès.

### Hors-scope
- Rien d'exclu à ce stade.

### Critères d'acceptation
- Page accessible aux profils visés, non accessible aux autres.

### Dépendances
Dépend de l'Issue 3.

---

## Issue 5 — Recette et validation des chiffres

**Lot / Porteur** : développeur Goodoffice (avec Marvin)
**Area** : Care

### Objectif
Vérifier la justesse des métriques live avant mise à disposition.

### Périmètre
- Comparer les métriques live à un échantillon connu (et au prototype sur le même périmètre).
- Vérifier la sémantique de résolution (email = `human_only`, périmètre chat pour le taux Fin), le comptage des sujets secondaires, les fenêtres temporelles, le comportement des filtres et du drill-down.

### Hors-scope
- Rien d'exclu à ce stade.

### Critères d'acceptation
- Écarts expliqués ou corrigés ; chiffres validés sur un échantillon.

### Dépendances
Dépend des Issues 2 et 3.

---

## Questions ouvertes
1. **Nom du repo** : `goodvest-support-dashboard` convient-il ?
2. **Lien cross-projet** : poser une dépendance Linear explicite de l'Issue 2 vers AI-182 (table enrichie live) ?
