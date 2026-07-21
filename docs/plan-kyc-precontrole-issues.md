# Pré-contrôle IA des documents KYC — découpage des issues Linear

> Document de travail préparatoire à la création des issues dans Linear.
> Projet : [Réduire les rejets de documents au KYC via un pré-contrôle IA](https://linear.app/goodvest/project/reduire-les-rejets-de-documents-au-kyc-via-un-pre-controle-ia-25aaa092a6b0)
> Équipe : **AI Ops** (toutes les issues ; le travail cross-équipe est signalé par les parties prenantes de chaque issue).

## Références communes

- **POC fonctionnel** : https://gv-sales-dash.vercel.app/docs-ai.html
- **Repo de handoff** : https://github.com/mluksenb/gv-kyc-precheck (public) — livré le 07/07/2026 (AI-249 ✅). C'est ce repo, et lui seul, qui sert de point de départ aux développeurs.
- Le POC couvre : 3 types de documents (pièce d'identité CNI/passeport, justificatif de domicile, RIB), critères détaillés par document avec statut pass/fail, comparaison aux informations déclarées, correction en un clic des informations déclarées à partir des valeurs lues sur le document, gestion d'erreur fail-open, modèle Claude Haiku 4.5 en structured outputs.

---

## Vue d'ensemble et dépendances

> ✅ Issues créées dans Linear le 07/07/2026 — identifiants ci-dessous.

| # | Linear | Issue | Dépend de | Bloque |
|---|--------|-------|-----------|--------|
| 1 | AI-244 | Cadrage — périmètre des documents et critères de validité | — | 2, 6, 10 |
| 2 | AI-245 | Spec produit — feedback, corrections et règles d'override | 1 (+ éclairé par 10) | 3, 9 |
| 3 | AI-246 | Design — intégration au parcours d'onboarding | 2 | 9 |
| 4 | AI-247 | Infra IA — fournisseur(s), redondance et résilience | — | 5, 7 |
| 5 | AI-248 | Conformité — RGPD, DPA et politique de confidentialité | 4 | mise en production (9) |
| 6 | AI-249 | Port du POC vers un repo GitHub dédié | 1 (souhaitable) | 7 |
| 7 | AI-250 | Build backend — service de pré-contrôle branché au backend Goodvest | 1, 4, 6 | 8, 9 |
| 8 | AI-251 | Build back-office — Hub Documents / KYC dans Goodoffice (tracking, QC, auditabilité) | 7 | — |
| 9 | AI-252 | Build front-end — intégration finale au parcours d'onboarding | 2, 3, 7 (+ prod : 5) | — |
| 10 | AI-253 | Évaluation de fiabilité par critère (jeu de test) | 1 | éclaire 2 et 4 |

Séquencement suggéré — deux pistes parallèles après le cadrage :

- **Vague 1 (parallélisable)** : 1 Cadrage · 4 Infra IA (instruction) · 6 Repo
- **Vague 2** : 10 Évaluation · 2 Spec produit · 5 Conformité
- **Vague 3 — deux pistes en parallèle** :
  - piste *client* : 3 Design (spec + maquettes) ;
  - piste *build* : 7 Backend → 8 Back-office (indépendants du front client).
- **Vague 4** : 9 Front-end onboarding — connecte les deux pistes ; activation en production après feu vert conformité (5).

---

## Issue 1 — Cadrage : périmètre des documents et critères de validité

**Objectif.** Arrêter la liste des documents couverts au lancement et formaliser, pour chacun, les critères de validité exigés par le(s) tiers — la matrice qui pilote tout le reste (prompts, UI, tracking).

**Contenu.**
- Confirmer les 3 documents du POC (pièce d'identité CNI/passeport, justificatif de domicile, RIB) et leurs critères, en les validant avec Care/Ops contre les exigences réelles des tiers.
- Statuer sur l'extension au cas **« hébergement chez un tiers »**, repéré sur les wireframes du nouveau parcours d'onboarding et absent du POC. Il introduit **deux documents supplémentaires** :
  - l'**attestation d'hébergement** (lettre du tiers hébergeant) — critères pressentis : datée, signée, mentionne l'identité de l'hébergeant et de l'hébergé, adresse identique à l'adresse déclarée ;
  - la **pièce d'identité de l'hébergeant** (en cours de validité) — mêmes critères qualité que la pièce d'identité du souscripteur, mais comparée à l'identité de l'hébergeant.
  - ⚠️ Nouveauté structurelle : ce cas introduit une **cohérence inter-documents** (le signataire de l'attestation doit correspondre à la pièce d'identité de l'hébergeant), là où le POC ne compare qu'un document aux informations déclarées. À chiffrer dans la logique de pré-contrôle.
- Cartographier les variations par produit (chaque produit requiert un jeu de documents différent, selon le tiers qui réalise les contrôles — cf. périmètre du projet Linear).

**Livrables.** Matrice documents × critères × produits validée par Care/Ops ; décision go/no-go sur l'hébergement chez un tiers au lancement.

**Parties prenantes.** AI Ops (pilotage), Care/Ops (critères tiers), Produit.

**Dépendances.** Aucune — point de départ. Bloque la spec produit (2), le repo de handoff (6, pour figer les définitions de critères) et l'évaluation (10).

---

## Issue 2 — Spec produit : feedback, corrections et règles d'override

**Objectif.** Trancher les règles produit du pré-contrôle et les formaliser dans une spec (étape 1 du cycle de vie d'une feature), en prenant le POC comme benchmark.

**Décisions à trancher.**
1. **Granularité du feedback** : affiche-t-on chaque critère avec le système feu vert / feu rouge comme dans le POC, ou une restitution simplifiée (globale + seulement les critères en échec) ?
2. **Ton des messages d'échec** : prose générée par l'IA (« voici ce que j'ai observé / ce qu'il me faut » — riche mais visiblement générée) **vs** messages factuels de type erreur classique (rédigés à l'avance, paramétrés par les valeurs extraites). Impact direct sur la perception client et la maîtrise du wording.
3. **Correction en un clic** : conserve-t-on la mise à jour automatique des informations déclarées à partir des valeurs lues sur le document (démontrée dans le POC : nom, date de naissance, nationalité, adresse) ? Si oui, avec quel garde-fou (confirmation explicite, champs exclus…) ?
4. **Override humain** : dans quelles circonstances le client peut-il soumettre malgré un critère en échec ?
   - option A : override global (toujours possible, le pré-contrôle reste indicatif) ;
   - option B : override **par critère** — permissif sur les critères sujets aux faux positifs (ex. reflets, bordures), bloquant sur ceux où la confiance est haute (ex. document expiré, mauvais type de document). L'issue 10 (évaluation) fournit les taux de faux positifs pour arbitrer critère par critère.
5. Règles transverses : comportement fail-open en cas d'indisponibilité de l'IA (jamais bloquant — acquis du projet), nombre de tentatives, comportement quand les informations déclarées changent après une analyse.

**Livrables.** Document « Spec produit » dans Linear (cinématique, règles métier, cas limites, critères d'acceptation), décisions 1–4 actées.

**Parties prenantes.** Produit (pilotage), AI Ops, Design, Care.

**Dépendances.** Périmètre documenté (1) ; les données de fiabilité (10) éclairent la décision 4.

---

## Issue 3 — Design : intégration au parcours d'onboarding

**Objectif.** Concevoir l'intégration du pré-contrôle dans les écrans du **nouveau parcours d'onboarding actuellement en production**, en utilisant le POC comme benchmark fonctionnel et en chiffrant l'écart entre l'existant et la cible.

**Contenu.**
- Audit des écrans documents du parcours live vs le POC : qu'est-ce qui s'intègre tel quel, qu'est-ce qui demande adaptation (zones d'upload par face recto/verso, toggle « un seul document », affichage des critères, cartes de critères en échec avec actions) ?
- Maquettes des états : en attente, analyse en cours, conforme, non conforme (cartes critère + actions « Changer de document » / « Mettre à jour les informations »), pré-contrôle indisponible (fail-open), override.
- Parcours de correction : retour vers l'étape déclarative concernée (idéalement lien direct — cf. périmètre projet), surlignage des champs corrigés automatiquement.
- Application du design system Goodvest (le POC est volontairement approximatif sur ce point).
- Responsive / mobile — l'onboarding se fait beaucoup sur mobile.

**Livrables.** Spec design (étape 2 du cycle) + maquettes validées.

**Parties prenantes.** Design (pilotage), Produit, AI Ops, Tech.

**Dépendances.** Spec produit (2) — les décisions granularité / ton / override déterminent les écrans à dessiner. Bloque le build front-end (9). Peut avancer **en parallèle de la piste build** (7, 8).

---

## Issue 4 — Infra IA : fournisseur(s), redondance et résilience

**Objectif.** Décider de l'architecture d'appel aux modèles ; l'implémentation se fait dans le build backend (7).

**Options à instruire.**
1. **Mono-fournisseur** (comme le POC : Claude Haiku 4.5 en direct, modèle surclassable par variable d'environnement) — simple, un seul DPA, mais un point de défaillance (atténué par le fail-open).
2. **Fournisseur principal + secours applicatif** : ex. Claude Haiku 4.5 avec bascule sur Gemini Flash-Lite en cas d'erreur — redondance maîtrisée, deux DPA, deux prompts/schémas à maintenir.
3. **OpenRouter par défaut** : redondance intégrée côté routeur — moins de code, mais un intermédiaire supplémentaire dans la chaîne de traitement des données (impact conformité, cf. issue 5) et moins de contrôle fin (structured outputs, versions de modèles).

**Contenu.**
- Bench rapide coût / latence / qualité sur les documents du jeu de test (issue 10) pour le ou les modèles candidats.
- Décision d'architecture (ordre de bascule, timeouts, télémétrie des erreurs fournisseur) documentée pour le build backend (7).
- Rappel d'exigence projet : une défaillance IA ne bloque **jamais** la soumission (fail-open), quelle que soit l'option.

**Livrables.** Décision documentée (ADR courte) + spécification du module d'appel.

**Parties prenantes.** AI Ops (pilotage), Tech.

**Dépendances.** Aucune pour instruire ; la **décision** conditionne la revue conformité (5) — la liste des destinataires des données en dépend — et le build backend (7).

---

## Issue 5 — Conformité : RGPD, DPA et politique de confidentialité

**Objectif.** Sécuriser juridiquement l'envoi de documents d'identité et de données personnelles sensibles à un ou plusieurs fournisseurs d'IA tiers — nouveau traitement pour Goodvest.

**Contenu.**
- Revue avec l'équipe conformité : base légale, DPA avec chaque fournisseur retenu (Anthropic, et le cas échéant Google / OpenRouter), localisation des traitements, options de non-rétention des données (zero data retention) et leurs contraintes.
- Mise à jour du registre des traitements et de la liste des sous-traitants ; mise à jour de la politique de confidentialité si nécessaire.
- Information du client dans le parcours (mention au moment de l'upload ?) — à coordonner avec Design (3).
- Règles de conservation côté Goodvest des artefacts du pré-contrôle (documents, verdicts, extraits) — à articuler avec les besoins d'auditabilité de l'issue 8 (le tracking exige de conserver ; la minimisation exige de limiter : arbitrage à documenter).

**Livrables.** Avis conformité écrit, DPA signé(s), politique de confidentialité à jour, règles de rétention actées.

**Parties prenantes.** Conformité (pilotage), AI Ops, Care.

**Dépendances.** Choix fournisseur(s) (4). **Bloque la mise en production** du parcours client (9) — pas le développement.

---

## Issue 6 — Port du POC vers un repo GitHub dédié

**Objectif.** Livrer un repo propre, autonome et documenté, contenant tout le code du pré-contrôle : c'est le point de départ unique des développeurs pour les issues de build (7, 8, 9).

**Contenu.**
- Porter l'ensemble de la logique du POC : fonction d'analyse (définitions de critères par document, construction du prompt, schéma structured outputs, appel modèle), composants UI de référence (zones d'upload, cartes de critères, actions de correction), préparation des fichiers côté client (compression, base64, limites de taille).
- Nettoyer les spécificités du prototype et documenter : README d'architecture, variables d'environnement (`CLAUDE_API_KEY`, `CLAUDE_PRECHECK_MODEL`), guide « comment ajouter un type de document / un critère », limites connues (4,5 Mo par requête sur les fonctions Vercel, compression des images côté client).
- Intégrer les définitions de critères issues du cadrage (1) si disponibles à ce stade.

**Livrables.** Repo GitHub dédié + README de handoff ; le POC déployé reste la démo vivante.

**Parties prenantes.** AI Ops (Marvin).

**Dépendances.** Souhaitable après le cadrage (1) pour figer les critères, mais peut démarrer avant. Bloque le build backend (7).

---

## Issue 7 — Build backend : service de pré-contrôle branché au backend Goodvest

**Objectif.** Reconstruire le cœur du POC en conditions réelles : un service de pré-contrôle fonctionnel, branché directement au backend Goodvest, indépendant du front client — la piste *build* peut avancer pendant que la piste *client* (spec produit, design) se joue.

**Contenu.**
- Endpoint(s) de pré-contrôle côté plateforme : réception des fichiers (tailles, formats), récupération des informations déclarées du lead, appel modèle selon l'architecture retenue (4), fail-open.
- Implémentation du module d'appel IA décidé en 4 (fournisseur(s), bascule, timeouts, télémétrie).
- **Persistance des analyses** : chaque tentative (document soumis, verdict global, verdicts par critère, corrections appliquées, overrides, horodatage, lead) est stockée — c'est la matière première du back-office (8) et une exigence d'auditabilité (5). Modèle de données co-conçu avec l'issue 8 pour éviter une migration.
- Testable sans front client : par API directe (ou une page de test interne type POC) pour valider le comportement de bout en bout avant l'intégration onboarding.

**Livrables.** Service en environnement de staging, appelable par API, avec persistance des analyses ; documentation d'interface pour le front (9) et le back-office (8).

**Parties prenantes.** Tech (pilotage), AI Ops.

**Dépendances.** Critères (1), décision infra (4), repo de handoff (6). Bloque 8 et 9. **Parallélisable avec 2, 3.**

---

## Issue 8 — Build back-office : Hub Documents / KYC dans Goodoffice

**Objectif.** Garder les humains dans la boucle : faire évoluer la page existante **« Documents à valider »** de Goodoffice (https://goodoffice.goodvest.fr/documents-a-valider) en un **Hub Documents / KYC** — plutôt que de créer une page séparée. Constructible indépendamment du front client, dès que le backend (7) persiste les analyses.

**Point de départ.** La page existante surface déjà les documents en attente de validation manuelle (dont ceux qui requièrent toujours une revue humaine) et les rejets remontés par le tiers après coup. Le hub y ajoute la dimension pré-contrôle IA (verdicts en amont), pour une vue unifiée du cycle de vie documentaire : soumission → pré-contrôle IA → validation manuelle éventuelle → verdict tiers.

**Contenu.**
- **Stats par catégorie de document et par période** :
  - nombre de tentatives de soumission ;
  - part approuvée par l'IA / part rejetée ;
  - taux d'abandon post-rejet : clients qui, après un rejet, n'aboutissent jamais à un document conforme (signal de friction critique) ;
  - répartition en % des motifs de rejet les plus fréquents, par type de document ;
  - à terme : croisement pré-contrôle IA × verdict tiers (le pré-contrôle a-t-il prédit le rejet ?) — la page existante affiche déjà les rejets tiers, le rapprochement des deux est la vraie valeur du hub.
- **Drill-down** : depuis un motif de rejet (ex. justificatifs de domicile rejetés pour raison X), ouvrir un panneau listant les tentatives concernées avec les documents soumis consultables et un lien vers la fiche du lead dans Goodoffice.
- **Auditabilité** : pour toute décision du pré-contrôle, pouvoir reconstituer qui a soumis quoi, quel verdict a été rendu critère par critère, quelles corrections/overrides ont suivi. Rétention conforme aux règles actées en 5.
- Boucle qualité : ces données alimentent le réglage des prompts/critères (retour vers 10) et la politique d'override par critère (2).

**Livrables.** Hub Documents / KYC dans Goodoffice, extension de la page « Documents à valider » : vues stats + drill-down + accès aux documents et aux fiches leads, aux côtés des flux existants (validation manuelle, rejets tiers).

**Parties prenantes.** AI Ops (pilotage), Tech (Goodoffice), Care.

**Dépendances.** Persistance livrée par le build backend (7). Indépendant du front client (9).

---

## Issue 9 — Build front-end : intégration finale au parcours d'onboarding

**Objectif.** Connecter les deux pistes : implémenter les écrans du pré-contrôle dans le parcours d'onboarding live, conformément aux maquettes (3) et aux règles produit (2), sur le service backend livré en 7.

**Contenu.**
- Écrans conformes aux maquettes : upload par document (recto/verso, toggle document unique), états d'analyse, restitution des critères selon la granularité actée, cartes de critères en échec avec actions.
- Parcours de correction : « Changer de document », « Mettre à jour les informations » (si retenu en 2) avec lien direct / retour vers l'étape déclarative concernée et surlignage des champs corrigés.
- Règles d'override implémentées telles qu'actées (globales ou par critère).
- Fail-open : le parcours n'est jamais bloqué par une indisponibilité de l'IA.
- Rollout progressif : feature flag / activation par produit, mesure avant-après du taux de rejet tiers (KPI du projet).

**Livrables.** Parcours en production derrière feature flag ; activation après le feu vert conformité (5).

**Parties prenantes.** Tech (pilotage), Design, Produit, AI Ops.

**Dépendances.** Spec produit (2), maquettes (3), backend (7). La mise en production (pas le dev) est bloquée par 5.

---

## Issue 10 — Évaluation de fiabilité par critère (jeu de test)

**Objectif.** Mesurer objectivement ce que vaut le pré-contrôle avant de le mettre devant des clients — et fournir les données qui permettent d'arbitrer la politique d'override (2) et le choix de modèle (4).

**Contenu.**
- Constituer un jeu de test de documents réels anonymisés (ou spécimens) par type : conformes, non conformes pour chaque motif, cas limites (reflets, photos sombres, noms composés, accents, noms d'usage).
- Mesurer par critère : taux de faux positifs (critère rejeté à tort — friction client) et de faux négatifs (critère validé à tort — rejet tiers en aval).
- Identifier les critères « haute confiance » (candidats au blocage sans override) vs « sujets à faux positifs » (override permissif) — input direct de la décision 4 de l'issue 2.
- Comparer les modèles candidats (Haiku 4.5 vs Sonnet 4.6, et le second fournisseur éventuel) sur ce même jeu — input de l'issue 4.

**Livrables.** Jeu de test versionné (dans le repo de handoff), grille de résultats par critère et par modèle, recommandations.

**Parties prenantes.** AI Ops (pilotage), Care (fourniture de cas réels).

**Dépendances.** Critères figés par le cadrage (1).

---

## Hors périmètre de ce découpage

- Le remplacement des contrôles KYC officiels du tiers (le pré-contrôle reste indicatif et en amont — hors-scope du projet Linear).
- La création effective du repo de handoff (issue 6) et le build Linear : à faire après validation de ce document.
