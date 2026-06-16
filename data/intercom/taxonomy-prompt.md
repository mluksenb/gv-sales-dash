# Classification support Goodvest (référence modèle)

## Méthodologie

- **topic** = besoin **initial** du client (une sous-catégorie exacte ci-dessous).
- **secondaryTopics** = 0 à 2 autres sous-catégories si des besoins distincts sont clairement exprimés (pas la résolution agent).
- **isSupportTicket** = `false` si le message n'est pas une vraie demande client/prospect Goodvest : prospection B2B entrant, spam, arnaque Meta/Trustpilot forwardée, candidature RH, mail tiers non adressé au support.
- **topicConfidence** = `high` si évident ; `medium` si frontière entre 2 catégories proches ; `low` si peu d'information ou cas atypique.

## Sous-catégories (libellé exact → définition courte)

| topic | Définition courte |
|-------|-------------------|
| Ouverture de compte / contrat | Démarrer ou débloquer une souscription (AV, PER, Livret) |
| Transfert contrat vers Goodvest | Transférer un contrat existant depuis un autre assureur |
| Validation de documents / KYC | Pièce justificative rejetée, bloquée ou en attente |
| Éligibilité & résidence fiscale | Peut-on souscrire selon résidence/statut fiscal |
| Choix de produit | Hésitation entre offres avant/pendant souscription |
| Modification d'infos de souscription | Corriger identité, adresse, co-souscripteur (hors email connexion) |
| Questions produit & Fonds | Comprendre un produit/fonds/mécanisme (contrat existant ou réflexion avancée) |
| Fiscalité & documents fiscaux | Attestations, IFI, PFU, déclaration sur placements détenus |
| Allocation & stratégie | Conseil répartition/diversification sans exécution |
| Frais & tarification | Coûts, commissions, tarifs |
| Gestion des risques / évolutions marchés | Inquiétude macro/marchés sans action demandée |
| Demande de RDV | Parler à un conseiller = besoin principal |
| Partenariat Helios | Friction spécifique canal Helios vs Goodvest direct |
| Suppression de compte | Fermer le compte utilisateur Goodvest |
| Changement d'email | Email de connexion/contact (hors incident sécurité) |
| Mot de passe / connexion / accès | Accès routine, MDP oublié (hors incident sécurité) |
| RGPD / données personnelles | Droits RGPD formels, DPO, effacement cadre juridique |
| Sécurité | Réaction incident cyberattaque/fuite juin 2026 ou alerte sécurité Goodvest |
| Suivi portefeuille | Performance, valorisation, comprendre son contrat |
| Bénéficiaires | Clause bénéficiaire assurance vie |
| RIB / compte bancaire | Changer le compte pour prélèvements/versements |
| Arbitrage / profil de risque | Exécuter un arbitrage ou changement de supports |
| Versements et prélèvements | Verser, prélèvements, montant, virement ; versement non visible / retard de crédit |
| Retrait & rachat | Sortir des fonds, rachat partiel/total, clôture contrat |
| Code promo / parrainage | Code non appliqué, parrainage |
| Offres commerciales | Offre commerciale Goodvest (hors code promo) |
| Préférences communication / désabonnement | Stop emails promo, préférences marketing |
| Message d'erreur | Erreur écran explicite, parcours bloqué avec erreur |
| Actualisation des données / données non à jour | Solde/valorisation faux ou périmé sans erreur explicite |
| Signature impossible | Blocage signature électronique contrat/avenant |
| Prospection / partenariat non sollicité | Spam, vente de services à Goodvest, arnaque partenariat |
| Recrutement | Candidature, stage, alternance chez Goodvest |
| Autre / non classifié | Client réel sans catégorie adaptée (< 5 % cible) |

## Désambiguïsation — pièges fréquents

| Situation | topic | Plutôt que |
|-----------|-------|------------|
| Réponse email incident sécurité + changement MDP | Sécurité | Mot de passe / connexion |
| « Quelles données ont fuité ? » post-incident | Sécurité | RGPD |
| Droit d'accès / effacement formel DPO | RGPD | Sécurité / Suppression de compte |
| « Stop les emails promo » | Préférences communication | RGPD |
| « Changer RIB prélèvements » | RIB / compte bancaire | Versements et prélèvements |
| « J'ai viré, pas visible » | Versements et prélèvements | Actualisation des données |
| « Comment faire un virement ? » | Versements et prélèvements | RIB / compte bancaire |
| « Où est mon attestation fiscale ? » | Fiscalité & documents fiscaux | Suivi portefeuille |
| Différence Goodvie/Goodlife avant souscription | Choix de produit | Questions produit & Fonds |
| « Comment fonctionne le fonds X ? » contrat ouvert | Questions produit & Fonds | Choix de produit |
| « Je veux arbitrer vers UC » | Arbitrage / profil de risque | Allocation & stratégie |
| « Comment diversifier ? » (conseil) | Allocation & stratégie | Arbitrage |
| Solde affiché clairement faux | Actualisation des données | Suivi portefeuille |
| Souscrit via Helios, pas d'accès reporting | Partenariat Helios | Suivi portefeuille |
| Transférer PER depuis autre assureur | Transfert contrat vers Goodvest | Ouverture de compte |
| CNI rejetée à la souscription | Validation documents / KYC | Signature impossible |
| Échec signature électronique | Signature impossible | Message d'erreur |
| Mail vente avis Trustpilot / Meta scam forwardé | Prospection | Recrutement |
| Vente pub magazine / formation B2B adressée à Goodvest | Prospection | Offres commerciales |
| Plateforme emploi tierce (tarifs, quotas) adressée à Goodvest | Prospection | Recrutement |
| Clôture AV pour récupérer fonds | Retrait & rachat | Suppression de compte |
| Modifier clause bénéficiaire | Bénéficiaires | Modification d'infos |

## Cas particuliers

- **Incident sécurité juin 2026 :** même si MDP, email, clôture ou app mobile → **Sécurité** si déclenché par la notification d'incident.
- **Livret Goodvest :** ouverture → Ouverture ou Choix de produit ; retrait → Retrait & rachat ; suivi → Suivi portefeuille.
- **Legapass / succession notariale large :** → Autre / non classifié.
- **Email forwardé (Fwd:/TR:) avec arnaque Meta/Facebook/Trustpilot :** → Prospection, isSupportTicket = false.
- **Offres commerciales** = promotions Goodvest vers clients existants/prospects ; **Prospection** = tout message entrant vendant un service à Goodvest (pub, magazine, formation cabinet, plateforme emploi).
- **Transcript vide :** topicConfidence = low (se baser sur subject/issueSummary avec prudence).
