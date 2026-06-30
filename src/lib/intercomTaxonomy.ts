/** Intercom taxonomy mirrored from data/intercom/taxonomy.md (scripts/intercom/taxonomy-labels.ts). */

export const INTERCOM_TOPIC_CATEGORIES = [
  'Souscription & KYC',
  'Information & Conseil',
  'Gestion de compte',
  'Gestion de contrat actif',
  'Transactions',
  'Promotions & Offres',
  'Problèmes techniques',
  'Divers',
] as const

export type IntercomTopicCategory = (typeof INTERCOM_TOPIC_CATEGORIES)[number]

export const INTERCOM_TOPIC_TO_CATEGORY: Record<string, IntercomTopicCategory> = {
  'Ouverture de compte / contrat': 'Souscription & KYC',
  'Transfert contrat vers Goodvest': 'Souscription & KYC',
  'Validation de documents / KYC': 'Souscription & KYC',
  'Éligibilité & résidence fiscale': 'Souscription & KYC',
  'Choix de produit': 'Souscription & KYC',
  "Modification d'infos de souscription": 'Souscription & KYC',
  'Questions produit & Fonds': 'Information & Conseil',
  'Fiscalité & documents fiscaux': 'Information & Conseil',
  'Allocation & stratégie': 'Information & Conseil',
  'Frais & tarification': 'Information & Conseil',
  'Gestion des risques / évolutions marchés': 'Information & Conseil',
  'Demande de RDV': 'Information & Conseil',
  'Partenariat Helios': 'Information & Conseil',
  'Suppression de compte': 'Gestion de compte',
  "Changement d'email": 'Gestion de compte',
  'Mot de passe / connexion / accès': 'Gestion de compte',
  'RGPD / données personnelles': 'Gestion de compte',
  Sécurité: 'Gestion de compte',
  'Suivi portefeuille': 'Gestion de contrat actif',
  Bénéficiaires: 'Gestion de contrat actif',
  'RIB / compte bancaire': 'Gestion de contrat actif',
  'Arbitrage / profil de risque': 'Gestion de contrat actif',
  'Versements et prélèvements': 'Transactions',
  'Retrait & rachat': 'Transactions',
  'Code promo / parrainage': 'Promotions & Offres',
  'Offres commerciales': 'Promotions & Offres',
  'Préférences communication / désabonnement': 'Promotions & Offres',
  "Message d'erreur": 'Problèmes techniques',
  'Actualisation des données / données non à jour': 'Problèmes techniques',
  'Signature impossible': 'Problèmes techniques',
  'Prospection / partenariat non sollicité': 'Divers',
  Recrutement: 'Divers',
  'Autre / non classifié': 'Divers',
}

export const INTERCOM_TOPICS_BY_CATEGORY: Record<IntercomTopicCategory, string[]> =
  INTERCOM_TOPIC_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = Object.entries(INTERCOM_TOPIC_TO_CATEGORY)
        .filter(([, cat]) => cat === category)
        .map(([topic]) => topic)
      return acc
    },
    {} as Record<IntercomTopicCategory, string[]>,
  )

export const ALL_INTERCOM_TOPICS = INTERCOM_TOPIC_CATEGORIES.flatMap(
  (category) => INTERCOM_TOPICS_BY_CATEGORY[category],
)

export function allIntercomTopicsSelected(selected: Set<string>): boolean {
  return ALL_INTERCOM_TOPICS.every((topic) => selected.has(topic))
}
