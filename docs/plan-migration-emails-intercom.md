# Cadrage en issues — Migration des échanges email clients vers Intercom

Projet Linear cible : **Migration des échanges email clients vers Intercom** · équipe **AI Ops** (à créer).

> Document de cadrage. Contenu en français, factuel, sans tiret cadratin. Structure en dépendances (une par équipe porteuse), déclinées en sous-issues. Label `Area > Care`. Toutes les issues sous AI Ops, l'équipe porteuse est indiquée dans le corps.

---

## Description du projet (proposée)

### Summary
Rapatrier tous les échanges email avec les clients et leads vers Intercom, y compris ceux qui arrivent aujourd'hui dans les boîtes Gmail personnelles, pour bénéficier du triage, de la résolution par Fin, de la visibilité et de la catégorisation.

### Objectif
Faire d'Intercom le canal unique des échanges email avec les clients et leads. Aujourd'hui deux canaux coexistent : Intercom (triage + résolution IA en progression) et les boîtes Gmail personnelles des membres (contournement d'Intercom). Les emails qui atterrissent en Gmail personnel peuvent être manqués (absence, congés), n'apparaissent pas dans les dashboards de volume support, et ne sont pas catégorisés. On veut détecter ces emails et les faire (re)passer par Intercom.

### Contexte
Les clients écrivent parfois directement à l'adresse Gmail nominative d'un membre plutôt qu'à l'adresse support générique, contournant Intercom. Solution technique retenue (variante Reply-To, la plus propre pour l'automatisation) : détecter les nouveaux emails entrants sur les boîtes des employés via l'API Gmail (`watch()` + notifications push Pub/Sub, délégation à l'échelle du domaine depuis un service account) ; matcher l'expéditeur contre la base clients/leads (ou l'API Contacts d'Intercom) ; si match, réémettre le message vers l'adresse entrante Intercom depuis une adresse relais dédiée (`relay@…`, enregistrée comme Company Email Address) avec un en-tête `Reply-To: client@…`. Intercom crée alors la conversation avec le client comme participant, et elle suit le triage, Fin et le reporting habituels.

Limite connue (v1) : la détection ne s'applique qu'à la création d'une nouvelle conversation, pas aux nouveaux messages d'une conversation existante. Un client qui répond au fil d'un échange existant génère une nouvelle conversation Intercom. On accepte cette limite en v1 ; la déduplication / le re-threading sont différés.

### Périmètre
- Recensement des membres en contact avec leads/clients et attribution d'un compte Intercom.
- Relais Gmail vers Intercom (spécifié par AI Ops, construit par Tech/Infra) : interception, matching, réémission Reply-To, étiquetage/archivage de l'email d'origine dans Gmail.
- Cadrage conformité / RGPD de la surveillance des boîtes.
- Configuration Intercom : vues, réglages utilisateurs, et décision sur le traitement des emails interceptés (Fin, différenciation vs support générique, workflows).
- Onboarding des membres nouvellement sur Intercom.
- Déploiement pilote sur un sous-ensemble d'employés avant généralisation.

### Hors-scope
- Déduplication / re-threading des réponses dans un fil existant (différé après v1).
- Généralisation à tous les employés avant validation du pilote.

### Parties prenantes
- **AI Ops (Marvin)** : spécification du relais, configuration Intercom.
- **Tech / Infra / IT** : construction du relais, service account, délégation domaine, Pub/Sub, hébergement, comptes Intercom.
- **Care / Ops** : recensement des membres, décision de traitement des emails, onboarding.
- **Conformité / Sécurité** : base légale et cadrage de l'interception des boîtes (information des salariés, limitation aux emails clients).

### Design
Besoin de design : Non (backend, configuration Intercom, opérations).

---

## Solution technique (référence pour l'issue de spécification)

- **Variante retenue : Reply-To.** Conditions de détection côté Intercom : l'expéditeur est une Company Email Address enregistrée, un en-tête `Reply-To` existe et diffère du `From`, une seule adresse dans `Reply-To`, et cette adresse n'est pas elle-même une adresse de la société.
- **Pipeline** : Gmail `watch()` (push Pub/Sub) sur les boîtes employés via délégation domaine -> à chaque nouvel entrant, matcher l'expéditeur (base clients/leads ou API Contacts Intercom) -> si match, réémettre le corps vers l'adresse entrante Intercom depuis `relay@…` avec `Reply-To: client@…` -> Intercom crée la conversation avec le client comme participant.
- **Variante de secours : Fwd.** Intercom attribue la conversation au client si l'adresse émettrice est un admin du workspace, le sujet commence par « Fwd: » et le corps contient le motif d'email transféré standard. Plus fragile (parsing), non retenue par défaut.
- **Limite** : détection à la création de conversation uniquement (pas sur les messages d'un fil existant).

---

## Découpage en issues

### Dépendance 1 — Care / Ops : Recensement et comptes Intercom  *(issue parente)*
- **1.1** Recenser tous les membres ayant une interface avec leads ou clients (Care/Ops + managers).
- **1.2** Créer ou activer les comptes Intercom manquants (Tech/IT + AI Ops).

### Dépendance 2 — Relais Gmail vers Intercom  *(issue parente, AI Ops spécifie / Tech-Infra construit)*
- **2.1** Cadrage conformité / RGPD de l'interception des boîtes (Conformité/Sécurité) : base légale, information des salariés, limitation stricte aux emails clients/leads. *Préalable bloquant.*
- **2.2** Spécifier la solution technique (relais Reply-To, `watch()`/Pub/Sub, délégation domaine, matching contacts) — AI Ops / Marvin.
- **2.3** Provisionner l'accès Google Workspace : service account, délégation à l'échelle du domaine, topics/souscriptions Pub/Sub — Tech/IT/Sécurité.
- **2.4** Construire le relais : `watch()` sur boîtes employés, matching expéditeur, réémission vers l'adresse entrante Intercom depuis `relay@…` avec `Reply-To` — Tech/Infra.
- **2.5** Étiqueter et/ou archiver l'email d'origine dans Gmail après relais — Tech/Infra.
- **2.6** Pilote sur un sous-ensemble d'employés + validation bout-en-bout (détection, matching, création de conversation, reporting) — AI Ops + Tech.

### Dépendance 3 — AI Ops / Care : Intégration dans Intercom  *(issue parente)*
- **3.1** Décider du traitement des emails interceptés : Fin déclenché ou non, différenciation vs support générique, routage — AI Ops + Care.
- **3.2** Configurer les vues et réglages utilisateurs pour distinguer emails de boîtes personnelles vs adresse support générique — AI Ops.
- **3.3** Adapter les workflows Intercom selon la décision (tags, routage, déclenchement Fin) — AI Ops.

### Dépendance 4 — Care / AI Ops : Onboarding Intercom  *(issue parente)*
- **4.1** Former les membres nouvellement sur Intercom à son usage.
- **4.2** Documentation et support post-bascule.

### Dépendances entre lots

```
Dépendance 1 (comptes) ─────────────> Dépendance 2 (pilote) et Dépendance 4 (onboarding)
2.1 conformité ──> 2.4 construction du relais
2.2 spec + 2.3 provisioning Workspace ──> 2.4 ──> 2.5 ──> 2.6 pilote
Dépendance 3.1 (décision traitement) ──> 2.6 pilote (pour traiter correctement les emails interceptés)
Dépendance 2 (relais live) ──> Dépendance 3.2 / 3.3 (config effective)
```

Ordre conseillé : recensement + comptes (1) et cadrage conformité (2.1) + spec (2.2) en parallèle ; puis provisioning (2.3) et construction (2.4-2.5) ; décision de traitement (3.1) avant le pilote (2.6) ; puis config Intercom (3.2-3.3) et onboarding (4).

---

## Questions ouvertes
1. **Nom du projet** : « Migration des échanges email clients vers Intercom » convient-il ?
2. **Adresse relais** : `relay@goodvest.fr` (ou autre) à enregistrer comme Company Email Address ?
3. **Matching des contacts** : base clients/leads interne ou API Contacts Intercom (ou les deux) comme source de vérité ?
4. **Étiquetage Gmail** : label seul, ou label + archivage, pour l'email d'origine ?
