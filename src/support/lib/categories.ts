/** Stable accent colour per top-level taxonomy category. */
export const CATEGORY_COLORS: Record<string, string> = {
  'Souscription & KYC': '#0f5132',
  'Information & Conseil': '#2563eb',
  'Gestion de compte': '#7c3aed',
  'Gestion de contrat actif': '#0891b2',
  Transactions: '#db2777',
  'Promotions & Offres': '#d97706',
  'Problèmes techniques': '#dc2626',
  Divers: '#64748b',
}

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#64748b'
}
