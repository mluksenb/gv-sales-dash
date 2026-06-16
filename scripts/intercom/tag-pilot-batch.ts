#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CONVERSATIONS_DIR } from './storage.ts'

export const pilotClassifications = [
  { id: '17060', topic: 'Préférences communication / désabonnement', confidence: 'high', note: '' },
  { id: '215474562142684', topic: 'Validation de documents / KYC', confidence: 'high', note: '' },
  {
    id: '215474570273048',
    topic: 'Prospection / partenariat non sollicité',
    confidence: 'high',
    note: 'Email Meta scam forwardé à hello@',
  },
  {
    id: '215474571684578',
    topic: 'Prospection / partenariat non sollicité',
    confidence: 'medium',
    note: 'Pitch B2B entrant (Trophées innovation)',
  },
  {
    id: '215474573838428',
    topic: 'Choix de produit',
    confidence: 'medium',
    note: 'Livret co-souscription : frontière avec Questions produit & Fonds',
  },
  { id: '215474578230890', topic: 'Prospection / partenariat non sollicité', confidence: 'high', note: '' },
  {
    id: '215474580179388',
    topic: 'RGPD / données personnelles',
    confidence: 'medium',
    note: 'Abandon PER + effacement — frontière Suppression de compte',
  },
  {
    id: '215474580456976',
    topic: 'Autre / non classifié',
    confidence: 'low',
    note: "Accusé réception auto d'un tiers, pas une demande client Goodvest",
  },
  {
    id: '215474581277010',
    topic: 'Sécurité',
    confidence: 'high',
    note: 'Devrait avoir été capté par le tag automatique incident',
  },
  {
    id: '215474584162290',
    topic: 'Sécurité',
    confidence: 'high',
    note: 'Post-fuite + MDP — pas Mot de passe / connexion',
  },
  { id: '215474585326860', topic: 'Retrait & rachat', confidence: 'high', note: '' },
  {
    id: '215474587569428',
    topic: 'Sécurité',
    confidence: 'high',
    note: "Changement email déclenché par fuite — pas Changement d'email",
  },
  {
    id: '215474590497690',
    topic: "Changement d'email",
    confidence: 'medium',
    note: "Email + autres infos profil : frontière Modification d'infos de souscription",
  },
  {
    id: '215474594909514',
    topic: 'Prospection / partenariat non sollicité',
    confidence: 'high',
    note: 'Résumé Gemini sur-interprète comme inquiétude client',
  },
  { id: '215474601143749', topic: 'Prospection / partenariat non sollicité', confidence: 'high', note: '' },
  {
    id: '215474608939048',
    topic: 'Versements et prélèvements',
    confidence: 'medium',
    note: '2 sujets : versement bloqué (primaire) + calendrier prélèvements',
  },
  { id: '215474611396033', topic: 'Retrait & rachat', confidence: 'high', note: 'Clôture livret' },
  {
    id: '215474615016989',
    topic: 'Transfert contrat vers Goodvest',
    confidence: 'high',
    note: 'Inclut questions fonctionnement PER — secondaire',
  },
  { id: '215474618332638', topic: 'Éligibilité & résidence fiscale', confidence: 'high', note: '' },
  { id: '215474624728823', topic: 'Questions produit & Fonds', confidence: 'high', note: '' },
  { id: '215474630973184', topic: 'Prospection / partenariat non sollicité', confidence: 'high', note: '' },
  {
    id: '215474636509526',
    topic: 'Autre / non classifié',
    confidence: 'medium',
    note: 'Legapass/notaire — pas de catégorie dédiée',
  },
  {
    id: '215474640884587',
    topic: 'Questions produit & Fonds',
    confidence: 'medium',
    note: 'Sortie structuré : info vs exécution (Retrait & rachat)',
  },
  { id: '215474649729651', topic: 'Versements et prélèvements', confidence: 'high', note: '' },
  { id: '215474651012678', topic: 'Prospection / partenariat non sollicité', confidence: 'high', note: 'Phishing badge Meta' },
] as const

async function main(): Promise<void> {
  for (const { id, topic } of pilotClassifications) {
    const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`)
    const conversation = JSON.parse(await readFile(filePath, 'utf8'))
    conversation.topic = topic
    await writeFile(filePath, `${JSON.stringify(conversation, null, 2)}\n`)
  }
  console.log(`Tagged ${pilotClassifications.length} conversations`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
