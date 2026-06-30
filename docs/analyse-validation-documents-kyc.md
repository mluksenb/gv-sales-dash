# Analyse — Validation de documents / KYC

Document de synthèse sur les conversations support classées **Validation de documents / KYC** (taxonomie Goodvest), avec focus sur les écarts de performance entre résolution autonome par **Fin** et escalade vers un conseiller humain.

**Périmètre des données :** exports Intercom normalisés (`data/intercom/conversations/`), tickets support uniquement (`isSupportTicket: true`), sous-catégorie principale `topic = "Validation de documents / KYC"`.

**Workspace Intercom :** `rbag1a9i` — lien type : `https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/{id}`

---

## Vue d'ensemble

| Indicateur | Valeur |
|---|---:|
| Volume total (sous-catégorie principale) | **174** |
| Chat | **121** (70 %) |
| Email (humain uniquement) | **53** (30 %) |
| Résolu par Fin (chat) | **37** (**31 %**) |
| Escaladé vers humain (chat) | **84** (**69 %**) |
| Résolu confirmé (`fin_confirmed`) | **10** |
| Résolu présumé (`fin_assumed`) | **27** |

> **Note :** si l'on inclut les conversations où KYC apparaît en sous-catégorie secondaire, le volume monte à **192** conversations (136 chats, 28 % de résolution Fin).

**Lecture clé :** la catégorie KYC affiche l'un des **taux de résolution Fin les plus bas** du périmètre chat. Fin performe sur les questions « FAQ / politique documentaire », mais escalade quasi systématiquement dès qu'il s'agit d'un **dossier client bloqué** ou d'une **action sur le compte**.

---

## Le pattern central : FAQ vs. « mon dossier est bloqué »

### Ce que Fin résout bien (~31 % des chats)

Il s'agit surtout de **questions d'information**, pas d'actions sur un dossier :

| Type de demande | Taux Fin (approx.) | Exemples Intercom (résolus) |
|---|---:|---|
| Quels documents / pièces fournir ? | ~60 % | [215473455381175](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473455381175) (JOF / vente immo), [215473512304807](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473512304807) (pas de facture tel) |
| Délai normal de validation | ~40–55 % | [215473513558632](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473513558632), [215473663570091](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473663570091) |
| Attestation hébergement / factures au nom du conjoint | ~30 % | [215473468862580](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473468862580), [215473455658556](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473455658556) |
| Critères de documents acceptés | Variable | [215473465448150](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473465448150) |

Les cas **confirmés** se terminent souvent par Fin citant la base de connaissances et demandant « Avons-nous répondu à votre question ? ». Les cas **présumés** (27/37 résolus) : Fin explique un délai ou un statut sans confirmation explicite du client.

### Ce que Fin escalade (~69 % des chats)

**92 % des chats escaladés** (77/84) contiennent le message de routage dur :

> *« Ce type de demande nécessite l'intervention d'un conseiller, je vous transfère tout de suite. »*

Fin escalade dès que le client décrit une situation **opérationnelle ou spécifique au dossier** :

| Signal client | Exemples Intercom (escaladés) |
|---|---|
| Document **refusé** sans explication | [215473517097477](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473517097477), [215473616377552](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473616377552) |
| **Upload / ajout impossible** | [215473534381304](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473534381304), [215473608421805](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473608421805) |
| Dossier **bloqué** (impossible de signer / poursuivre) | [215473595408867](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473595408867), [215473503228465](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473503228465) |
| Validation **coincée** malgré des critères apparemment respectés | [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997) |
| Besoin d'**intervention manuelle** (relance, upload agent) | [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997), [215473576384585](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473576384585) |

Même quand Fin commence par une bonne réponse FAQ (ex. critères domicile), il escalade au **second message** si le client répond « ça ne marche toujours pas ».

---

## Motifs d'intention — volume, performance Fin et exemples

Classification par intention principale (chat, sous-catégorie principale, chevauchements possibles).

| Motif | Volume chat | Résolu Fin | Taux Fin | Escaladé | Exemples résolus | Exemples escaladés |
|---|---:|---:|---:|---:|---|---|
| Document refusé — comprendre / corriger | 35 | 7 | **20 %** | 28 | [215473468862580](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473468862580), [215473549765879](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473549765879) | [215473517097477](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473517097477), [215473616377552](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473616377552), [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997) |
| Délai / statut en attente | 47 | 19 | **40 %** | 28 | [215473513558632](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473513558632), [215473465564119](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473465564119) | [215473511410273](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473511410273), [215473528960427](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473528960427), [215473563391493](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473563391493) |
| CNI / identité — validation ou format | 51 | 14 | **27 %** | 37 | [215473468862580](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473468862580) | [215473517097477](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473517097477), [215473503228465](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473503228465), [215473511410273](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473511410273) |
| Justificatif de domicile | 50 | 12 | **24 %** | 38 | [215473465448150](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473465448150), [215473455658556](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473455658556) | [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997), [215473595408867](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473595408867), [215473576384585](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473576384585) |
| Upload / envoi bloqué (technique) | 13 | 1 | **8 %** | 12 | [215474181181688](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215474181181688) | [215473534381304](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473534381304), [215473659937854](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473659937854), [215473675448387](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473675448387) |
| Attestation hébergement / facture conjoint | 10 | 3 | **30 %** | 7 | [215473468862580](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473468862580) | [215473497577546](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473497577546), [215474151603062](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215474151603062) |
| Quels documents / pièces fournir | 5 | 3 | **60 %** | 2 | [215473455381175](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473455381175), [215473512304807](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473512304807) | [215474542340518](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215474542340518) |
| Débloquer souscription / signer | 47 | 6 | **13 %** | 41 | [215473465448150](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473465448150) | [215473497577546](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473497577546), [215473503228465](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473503228465), [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997) |

---

## Chats escaladés — ce que les conseillers corrigent réellement

Analyse des **84 chats escaladés** (motifs non exclusifs — une conversation peut toucher plusieurs thèmes).

| Cluster | Part des escaladés | Ce que fait le conseiller | Exemples Intercom |
|---|---:|---|---|
| CNI / identité refusée ou bloquée | ~54 % | Photo (pas scan), bordures visibles, plus de recul ; recto-verso ; relance validation manuelle | [215473517097477](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473517097477), [215473534381304](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473534381304), [215473503228465](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473503228465), [215473511410273](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473511410273) |
| Domicile refusé / non accepté | ~50 % | Attestation d'hébergement complète ; document < 3 mois ; **upload manuel par l'agent** si l'autovalidation échoue | [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997), [215473497651633](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473497651633), [215473530604407](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473530604407) |
| Upload / ajout impossible | ~40 % | Consignes photo/format (JPG vs PDF) ; parfois bug → upload manuel / remontée technique | [215473534381304](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473534381304), [215473608421805](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473608421805), [215473576384585](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473576384585) |
| En attente / délai anormal | ~63 % | Rassurer si dans les SLA ; **relance partenaire bancaire / conformité** si dépassement | [215473528960427](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473528960427), [215473511410273](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473511410273), [215473563391493](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473563391493) |
| Finaliser / signer bloqué | ~54 % | Déblocage après validation des pièces ; souvent conséquence des problèmes identité/domicile | [215473497577546](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473497577546), [215473503228465](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473503228465), [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997) |
| Téléphone / attestation ligne | ~24 % | Validation attestation ; règles facture mobile | [215473497651633](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473497651633), [215473563391493](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473563391493) |

### Exemples concrets tirés des transcripts

**CNI refusée** — [215473517097477](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473517097477)  
Client : *« Mon justificatif de CNI est refusé sans explication »* → Fin escalade immédiatement. Conseiller : *« mettre une photo et pas un scan… avec les bordures bien apparentes »*.

**Upload CNI échoue** — [215473534381304](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473534381304)  
Client envoie 1 PDF recto + 1 PDF verso → Fin escalade. Conseiller : *« reprendre la photo avec un peu plus de recul »*.

**Domicile bloqué malgré critères OK** — [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997)  
Fin donne d'abord les critères FAQ, puis escalade au 2ᵉ message. Conseiller upload manuellement ; remontée équipe technique sur bug d'autovalidation.

**JOF / vente immo (résolu confirmé)** — [215473455381175](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473455381175)  
Fin explique le justificatif d'origine des fonds et les pièces pour une vente immobilière → client confirme.

**Hébergement / factures conjoint (résolu confirmé)** — [215473468862580](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473468862580)  
Fin détaille attestation d'hébergement + pièces du conjoint ; relevé épargne non accepté comme domicile.

---

## Résolu vs. escaladé — comparaison côte à côte

| Ce que dit le client | Comportement Fin | Issue type | Exemples |
|---|---|---|---|
| *« Qu'est-ce que le JOF ? »* / *« Que fournir sans facture tel ? »* | Répond depuis la KB | **Résolu** | [215473455381175](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473455381175), [215473512304807](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473512304807) |
| *« Combien de temps pour la validation ? »* (début de parcours) | Donne les fourchettes SLA | **Résolu** (souvent présumé) | [215473513558632](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473513558632), [215474030252706](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215474030252706) |
| *« Mon CNI est refusé »* | Transfert immédiat | **Escaladé** | [215473517097477](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473517097477) |
| *« Impossible de télécharger ma CNI »* | Transfert immédiat | **Escaladé** | [215473534381304](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473534381304) |
| *« Mon justificatif répond aux critères mais ne passe pas »* | FAQ puis transfert au suivi | **Escaladé** | [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997) |
| *« Ça fait > 72 h, y a un souci ? »* | Parfois rassure, parfois transfère | **Mixte** | Résolu : [215473513558632](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473513558632) — Escaladé : [215473511410273](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473511410273) |

### Conversations résolues confirmées (échantillon)

| ID | Résumé |
|---|---|
| [215473455381175](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473455381175) | JOF et documents pour vente immobilière |
| [215473465448150](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473465448150) | Pièces nécessaires sans facture de téléphone |
| [215473468862580](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473468862580) | Domicile — factures au nom du mari, attestation hébergement |
| [215473513558632](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473513558632) | Délai validation dossier Goodlife |
| [215473663570091](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473663570091) | Délai avant signature assurance vie |
| [215473783252024](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473783252024) | Domicile + RIB en attente depuis 2 jours (livret) |

---

## Canal email (53 conversations — 100 % humain)

Fin n'intervient jamais sur l'email. Les motifs reprennent ceux du chat :

| Motif | Volume email | Exemples |
|---|---:|---|
| Délai / statut en attente | 23 | [215473465857822](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473465857822), [215473478525204](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473478525204) |
| Débloquer souscription / signer | 24 | [215473465857822](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473465857822), [215473478525204](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473478525204) |
| Document refusé | 14 | [215473481674985](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473481674985), [215473549047525](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473549047525) |
| CNI / identité | 13 | [215473481674985](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473481674985) |
| Justificatif domicile | 10 | [215473594229138](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473594229138) |

Réduire les relances « où en est mon dossier ? » (notifications proactives, statuts in-app) impacterait le **volume total** de la catégorie, pas seulement le taux Fin.

---

## Leviers à fort impact sur le volume

Classés par **volume escaladé × facilité de correction**.

### 1. Playbook Fin « document refusé » (plus gros levier)

- **~35 chats**, taux Fin **~20 %**
- Exemples escaladés : [215473517097477](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473517097477), [215473616377552](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473616377552)
- **Action :** arbre de décision avant escalade — photo vs scan, bordures, expiration, recto-verso, nom ≠ domicile → hébergement
- **Impact estimé :** 20–25 escalades en moins si Fin résout la moitié

### 2. Erreurs upload / format

- **~13 chats** (motif strict upload), **~8 %** Fin ; élargi aux mentions upload dans escaladés : **~34**
- Exemples : [215473534381304](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473534381304), [215473608421805](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473608421805)
- **Action produit :** messages d'erreur explicites (« scan détecté », « bords coupés », « document expiré »)
- **Action Fin :** consignes JPG, photo unique, recul, pas de PDF scan
- **Impact estimé :** 15–20 escalades en moins

### 3. Domicile + attestation hébergement

- **~50 chats**, taux Fin **~24 %**
- Exemple résolu : [215473468862580](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473468862580) — Exemples escaladés : [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997), [215474151603062](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215474151603062)
- **Action :** checklist + modèle attestation ; que faire si autovalidation bloquée > 24 h
- **Impact estimé :** 10–15 escalades en moins

### 4. Validation bloquée / SLA dépassé

- **~47 chats** délai/statut, Fin **~40 %** (meilleur bucket)
- Fin OK sur fourchettes 48–72 h / 2 semaines ; échec quand *« > 72 h »*, *« depuis 9/15/30 jours »*
- Exemples escaladés : [215473511410273](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473511410273), [215473533351207](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473533351207) (présumé, 9 jours)
- **Action :** workflow Fin si délai > SLA → expliquer + proposer relance (vs escalade aveugle) ; emails de statut proactifs
- **Impact estimé :** 8–12 conversations en moins (Fin + produit)

### 5. Règle de routage Fin (plafond structurel)

- **77/84** escaladés passent par la règle « intervention conseiller requise »
- **Action :** réduire le périmètre d'escalade automatique ; laisser Fin tenter le playbook (§1–3) avant transfert
- **Impact estimé :** taux Fin **31 % → 45–50 %** sans changement produit majeur

### 6. Bugs d'autovalidation (produit)

- Agents uploadent manuellement quand le document « répond aux critères » mais ne passe pas — voir [215473471354997](https://app.intercom.com/a/inbox/rbag1a9i/inbox/shared/all/conversation/215473471354997)
- **Action :** corriger les faux négatifs de validation automatique
- **Impact :** baisse des contacts répétés et des escalades « dossier bloqué »

---

## Recommandations priorisées

| Priorité | Action | Effort | Impact volume / Fin |
|:---:|---|---|---|
| 1 | Playbook Fin CNI refusée + upload | Contenu + routage | Très élevé |
| 2 | Messages de rejet explicites in-app | Produit | Élevé |
| 3 | KB attestation hébergement / conjoint complète | Contenu | Moyen-élevé |
| 4 | Gestion SLA-aware (normal vs anormal) | Fin + produit | Moyen |
| 5 | Assouplir la règle d'escalade automatique | Config Fin | Structurel |
| 6 | Corriger bugs autovalidation | Produit / tech | Réduction contacts répétés |

---

## Méthodologie

- **Source :** fichiers `data/intercom/conversations/{id}.json` (transcripts normalisés, PII retirée)
- **Filtre :** `topic = "Validation de documents / KYC"`, `isSupportTicket = true`
- **Métriques Fin :** chat uniquement (`fin_confirmed`, `fin_assumed`, `fin_escalated`) ; email = `human_only`
- **Classification thématique :** mots-clés sur `issueSummary`, `aiTitle`, `subject` et extrait de transcript ; chevauchements possibles entre clusters
- **Date d'analyse :** juin 2026 — rejouer `npm run intercom:dashboard-data` après nouveaux exports pour mettre à jour

---

*Document généré à partir de l'analyse des exports Intercom Goodvest — catégorie Souscription & KYC / Validation de documents / KYC.*
