# Cadrage en issues — Intégration Goodoffice ↔ Intercom : fiabilité du sync et enrichissement du contexte contact

Projet Linear cible : **Intégration Goodoffice ↔ Intercom : fiabilité du sync et contexte contact** · équipe **AI Ops** (à créer).

> Document de cadrage. Contenu en français, factuel, sans tiret cadratin. Séquence de 6 étapes (parents), déclinées en sous-issues. Label `Area > Care`. Toutes les issues sous AI Ops, équipe porteuse indiquée dans le corps. Les issues Marvin sont assignées à marvin.klap.externe@goodvest.fr ; les issues Data/Engineering restent non assignées.

---

## Description du projet (proposée)

### Summary
Fiabiliser la synchronisation Goodoffice vers Intercom et enrichir le contexte des contacts, pour débloquer des workflows plus puissants et améliorer la performance de l'agent IA Fin.

### Objectif
Deux axes : (1) vérifier et fiabiliser la synchronisation existante des contacts Goodoffice vers Intercom, en particulier la mise à jour de la désignation lead vers user lorsqu'un lead devient client ; (2) enrichir le contexte disponible au niveau du contact dans Intercom (produits/contrats actifs, étape d'onboarding, etc.) pour que Fin dispose du contexte nécessaire à des réponses précises et de meilleure qualité, puis le prouver sur un cas d'usage avant de généraliser.

### Contexte
Une intégration synchronise déjà les contacts de la base Goodvest (Goodoffice) vers Intercom. Retour terrain : doute sur l'application correcte de la désignation user aux contacts. L'attente Intercom standard est qu'un lead devient user quand il devient client ; il faut vérifier que cette bascule se produit bien. Par ailleurs, Fin ne résout aujourd'hui qu'une fraction des demandes ; l'insatisfaction vient souvent du manque de contexte à l'ouverture d'une conversation. Or Goodvest propose plusieurs produits, avec des providers et des processus différents : un contexte complet et à jour permettrait des réponses nettement plus précises.

### Périmètre
- Audit de la synchronisation existante et de la désignation lead vers user, avec remédiation si écart.
- Identification et priorisation des informations de contexte manquantes au niveau du contact.
- Choix de la méthode d'alimentation (push depuis Goodoffice, live ou planifié, vs pull via un endpoint interrogé à la volée).
- Implémentation par Data/Engineering.
- Preuve de concept sur un cas d'usage ciblé, puis généralisation à d'autres cas Fin.

### Hors-scope
- La refonte plus large de Fin au-delà des cas couverts par l'enrichissement de contexte.
- Toute évolution de l'intégration sans lien avec la fiabilité du sync ou le contexte contact.

### Parties prenantes
- **AI Ops (Marvin)** : audit, identification du contexte, choix de méthode, POC, pilotage de la généralisation.
- **Data / Engineering** : implémentation de l'alimentation (endpoint ou sync).
- **Care** : origine du retour, cas d'usage cibles.

### Design
Besoin de design : Non (intégration, données, configuration Intercom).

---

## Découpage en issues

### Étape 1 — Audit du sync Goodoffice vers Intercom et de la désignation lead vers user  *(parent, Marvin)*
- **1.1** Documenter l'implémentation de la synchronisation existante (déclencheurs, fréquence, champs synchronisés, mapping).
- **1.2** Auditer la mise à jour lead vers user lors de la conversion en client (cas de test réels, écarts constatés).
- **1.3** Remédier aux écarts identifiés (conditionnel, si l'audit révèle un dysfonctionnement).

### Étape 2 — Identifier les informations de contexte manquantes dans Intercom  *(parent, Marvin)*
- **2.1** Lister les champs de contexte utiles (produits/contrats actifs, étape d'onboarding, provider associé, etc.).
- **2.2** Prioriser ces champs selon leur impact attendu sur la performance de Fin.

### Étape 3 — Déterminer la méthode d'alimentation du contexte (push vs pull)  *(issue, Marvin + Data/Engineering)*
Évaluer et trancher : pousser l'information de Goodoffice vers Intercom (temps réel ou planifié), ou la tirer via un endpoint interrogé à la volée quand un agent a besoin de contexte. Critères : fraîcheur, latence, coût, complexité, compatibilité avec les workflows Fin.

### Étape 4 — Implémenter l'alimentation du contexte dans Intercom  *(parent, Data/Engineering)*
- **4.1** Mettre en place la source de données selon la méthode retenue (endpoint interne ou synchronisation).
- **4.2** Câbler les attributs de contexte dans Intercom (attributs contact / données custom exploitables par Fin et les workflows).

### Étape 5 — POC sur un cas d'usage ciblé  *(issue, Marvin)*
Choisir un cas d'usage précis dont les instructions d'agent Intercom sont claires et nécessitent de mobiliser la donnée nouvellement disponible. Vérifier que Fin exploite bien ce contexte ajouté et que la qualité de réponse s'améliore.

### Étape 6 — Généraliser l'enrichissement de contexte à d'autres cas Fin  *(parent, Marvin + Data/Engineering)*
- **6.1** Étendre les champs de contexte et les instructions d'agent aux cas d'usage prioritaires suivants.
- **6.2** Déploiement progressif et suivi de l'impact sur la résolution Fin.

### Dépendances entre étapes

```
Étape 1 (audit) ── indépendante (informe l'étape 4)
Étape 2 (contexte manquant) ──> Étape 3 (méthode) ──> Étape 4 (implémentation) ──> Étape 5 (POC) ──> Étape 6 (généralisation)
```

Ordre conseillé : l'audit (1) en parallèle ; puis 2 -> 3 -> 4 -> 5 -> 6.

---

## Questions ouvertes
1. **Nom du projet** : « Intégration Goodoffice ↔ Intercom : fiabilité du sync et contexte contact » convient-il ?
2. **Contact Data/Engineering** : y a-t-il un référent à assigner aux issues d'implémentation (étape 4, moitié étape 3) ?
