/** Top-level taxonomy categories from data/intercom/taxonomy.md */
export const TOPIC_CATEGORIES = [
  'Souscription & KYC',
  'Information & Conseil',
  'Gestion de compte',
  'Gestion de contrat actif',
  'Transactions',
  'Promotions & Offres',
  'Problèmes techniques',
  'Divers',
] as const

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number]

/** Exact subcategory labels from data/intercom/taxonomy.md */
export const TOPIC_LABELS = [
  'Ouverture de compte / contrat',
  'Transfert contrat vers Goodvest',
  'Validation de documents / KYC',
  'Éligibilité & résidence fiscale',
  'Choix de produit',
  "Modification d'infos de souscription",
  'Questions produit & Fonds',
  'Fiscalité & documents fiscaux',
  'Allocation & stratégie',
  'Frais & tarification',
  'Gestion des risques / évolutions marchés',
  'Demande de RDV',
  'Partenariat Helios',
  'Suppression de compte',
  "Changement d'email",
  'Mot de passe / connexion / accès',
  'RGPD / données personnelles',
  'Sécurité',
  'Suivi portefeuille',
  'Bénéficiaires',
  'RIB / compte bancaire',
  'Arbitrage / profil de risque',
  'Versements et prélèvements',
  'Retrait & rachat',
  'Code promo / parrainage',
  'Offres commerciales',
  'Préférences communication / désabonnement',
  "Message d'erreur",
  'Actualisation des données / données non à jour',
  'Signature impossible',
  'Prospection / partenariat non sollicité',
  'Recrutement',
  'Autre / non classifié',
] as const

export type TopicLabel = (typeof TOPIC_LABELS)[number]

export const TOPIC_PROSPECTION = 'Prospection / partenariat non sollicité' as const

const TOPIC_LABEL_SET = new Set<string>(TOPIC_LABELS)

export function isValidTopicLabel(label: string): label is TopicLabel {
  return TOPIC_LABEL_SET.has(label)
}

/** Deprecated subcategory labels merged into the current taxonomy. */
export const DEPRECATED_TOPIC_ALIASES: Record<string, TopicLabel> = {
  'Versement non visible / retard': 'Versements et prélèvements',
}

export function resolveTopicLabel(topic: string): string {
  return DEPRECATED_TOPIC_ALIASES[topic] ?? topic
}

/** Maps each subcategory (`topic`) to its parent category. */
export const TOPIC_TO_CATEGORY: Record<TopicLabel, TopicCategory> = {
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
  'Sécurité': 'Gestion de compte',
  'Suivi portefeuille': 'Gestion de contrat actif',
  'Bénéficiaires': 'Gestion de contrat actif',
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
  'Recrutement': 'Divers',
  'Autre / non classifié': 'Divers',
}

export function topicCategoryFor(topic: string | undefined): TopicCategory | undefined {
  if (!topic?.trim()) return undefined
  const resolved = resolveTopicLabel(topic.trim())
  if (!isValidTopicLabel(resolved)) return 'Divers'
  return TOPIC_TO_CATEGORY[resolved]
}
