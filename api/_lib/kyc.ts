/**
 * Pré-contrôle IA des documents KYC (POC) — définitions partagées.
 * Importé par le frontend (types + critères affichés) et par le module
 * serveur `api/_lib/claude.ts` (appel du modèle) : ne rien mettre ici
 * qui dépende de Node ou du SDK Anthropic.
 *
 * Linear: https://linear.app/goodvest/project/reduire-les-rejets-de-documents-au-kyc-via-un-pre-controle-ia-25aaa092a6b0
 */

export type DocTypeKey = 'identity-cni' | 'identity-passeport' | 'residence' | 'rib'

export type CriterionStatus = 'pass' | 'fail'

export interface ClientInfo {
  civilite: string
  prenoms: string
  nom: string
  dateNaissance: string
  nationalite: string
  adresse: string
  codePostal: string
  ville: string
  pays: string
}

/** Champs déclaratifs qu'une « mise à jour des informations » peut corriger. */
export type FixableField = keyof ClientInfo

export const FIXABLE_FIELDS: FixableField[] = [
  'civilite',
  'prenoms',
  'nom',
  'dateNaissance',
  'nationalite',
  'adresse',
  'codePostal',
  'ville',
  'pays',
]

export interface SuggestedFixEntry {
  field: FixableField
  /** Valeur lue sur le document (dateNaissance au format AAAA-MM-JJ). */
  value: string
}

/**
 * Valeurs brutes extraites du document, remplies AVANT toute évaluation de
 * critère (l'ordre du schéma structured-outputs force cette séquence).
 * Chaîne vide quand la valeur est absente ou illisible.
 */
export interface ExtractedValues {
  typeDocument: string
  nom: string
  prenoms: string
  dateNaissance: string
  nationalite: string
  adresse: string
  /** Date d'émission / de délivrance du document (AAAA-MM-JJ). */
  dateEmission: string
  /** Date d'expiration du document (AAAA-MM-JJ) — distincte de la date de délivrance. */
  dateExpiration: string
  iban: string
  bic: string
}

export const EXTRACTED_FIELDS: (keyof ExtractedValues)[] = [
  'typeDocument',
  'nom',
  'prenoms',
  'dateNaissance',
  'nationalite',
  'adresse',
  'dateEmission',
  'dateExpiration',
  'iban',
  'bic',
]

export interface CriterionDefinition {
  id: string
  /** Libellé affiché dans l'UI (repris des écrans d'onboarding). */
  label: string
  /** Instruction détaillée donnée au modèle pour évaluer ce critère. */
  instruction: string
  /**
   * Champs déclarés que ce critère compare au document. En cas d'incohérence,
   * le modèle doit proposer un suggestedFix avec les valeurs lues sur le document.
   */
  fixFields?: FixableField[]
  /**
   * Critère daté : le verdict est recalculé de façon déterministe côté serveur
   * à partir des valeurs extraites (le modèle lit les dates, le code les juge).
   */
  dateRule?: 'expiration' | 'recency3m'
}

export interface DocDefinition {
  key: DocTypeKey
  /** Description du document attendu, donnée au modèle. */
  expected: string
  criteria: CriterionDefinition[]
}

export interface PrecheckFile {
  name: string
  mimeType: string
  /** Contenu du fichier encodé en base64 (sans préfixe data:). */
  dataBase64: string
}

export interface PrecheckRequest {
  docType: DocTypeKey
  client: ClientInfo
  files: PrecheckFile[]
}

export interface CriterionResult {
  id: string
  label: string
  status: CriterionStatus
  detail: string
  /** Ce que le modèle a observé avant de conclure (audit / debug, non affiché). */
  observation?: string
  /** En cas d'incohérence document / déclaration : valeurs lues sur le document. */
  suggestedFix?: SuggestedFixEntry[]
}

export interface PrecheckResult {
  docType: DocTypeKey
  overall: CriterionStatus
  documentSummary: string
  criteria: CriterionResult[]
  /** Valeurs brutes lues sur le document (audit / debug). */
  extracted?: Partial<ExtractedValues>
}

const IDENTITY_COMMON: CriterionDefinition[] = [
  {
    id: 'validite',
    label: 'Document en cours de validité',
    dateRule: 'expiration',
    instruction:
      "Recopie la date d'expiration du document dans extracted.dateExpiration (attention : les pièces d'identité portent DEUX dates — la date de délivrance et la date d'expiration — ne les confonds jamais ; la date d'expiration est la plus tardive). Le calcul de validité est refait par le système à partir de cette valeur. Si la date d'expiration est illisible ou introuvable, laisse extracted.dateExpiration vide et mets le critère en échec.",
  },
  {
    id: 'qualite',
    label: 'Document entier, en couleur, net et sans reflet',
    instruction:
      "Vérifie que le document est photographié/scanné en entier, en couleur, que le texte est net et lisible, et qu'aucun reflet ou surexposition ne masque des informations.",
  },
  {
    id: 'bordures',
    label: 'Bordures du document bien visibles, fond contrasté',
    instruction:
      "Vérifie que les quatre bordures du document sont visibles dans l'image et que le document se détache d'un fond contrasté (document non coupé, non zoomé à l'excès).",
  },
  {
    id: 'identite',
    label: 'Nom et prénoms identiques aux informations déclarées',
    fixFields: ['nom', 'prenoms'],
    instruction:
      "Compare le nom de famille et les prénoms lus sur le document avec les informations déclarées par le client. L'identité doit être identique : attention aux accents, tirets, espaces et noms d'usage. Un nom d'usage présent sur le document est accepté s'il correspond au nom déclaré. Si les prénoms déclarés sont un sous-ensemble ordonné des prénoms du document (ex. premier prénom seul), considère que cela correspond mais signale-le dans le détail.",
  },
  {
    id: 'naissance',
    label: 'Date de naissance cohérente avec la déclaration',
    fixFields: ['dateNaissance'],
    instruction:
      'Compare la date de naissance lue sur le document avec la date de naissance déclarée. Elles doivent être identiques.',
  },
  {
    id: 'nationalite',
    label: 'Nationalité cohérente avec la déclaration',
    fixFields: ['nationalite'],
    instruction:
      "Compare la nationalité indiquée sur le document avec la nationalité déclarée (tolère les variantes de formulation : « Française », « FRA », « FRANÇAISE »).",
  },
]

const DOC_DEFINITIONS: Record<DocTypeKey, DocDefinition> = {
  'identity-cni': {
    key: 'identity-cni',
    expected:
      "Une carte nationale d'identité en cours de validité, recto ET verso (soit deux images, soit un fichier unique contenant les deux faces).",
    criteria: [
      {
        id: 'type-document',
        label: "Le document est une carte nationale d'identité",
        instruction:
          "Vérifie que le document fourni est bien une carte nationale d'identité (et non un autre document : passeport, permis de conduire, titre de séjour, etc.).",
      },
      {
        id: 'recto-verso',
        label: 'Recto et verso fournis',
        instruction:
          "Vérifie que le recto ET le verso de la carte sont fournis (dans un ou plusieurs fichiers). Si une seule face est visible, le critère est en échec : précise quelle face manque.",
      },
      ...IDENTITY_COMMON,
    ],
  },
  'identity-passeport': {
    key: 'identity-passeport',
    expected:
      "Un passeport en cours de validité : page d'informations ET page de signature contenant la signature du titulaire.",
    criteria: [
      {
        id: 'type-document',
        label: 'Le document est un passeport',
        instruction:
          "Vérifie que le document fourni est bien un passeport (et non un autre document d'identité).",
      },
      {
        id: 'pages',
        label: "Page d'informations + page de signature contenant la signature",
        instruction:
          "Vérifie que la page d'informations (avec photo et zone MRZ) est fournie ET que la page de signature est fournie avec une signature manuscrite visible. Si la signature est absente ou la page manquante, le critère est en échec.",
      },
      ...IDENTITY_COMMON,
    ],
  },
  residence: {
    key: 'residence',
    expected:
      "Un justificatif de domicile daté de moins de 3 mois, au nom du client, mentionnant l'adresse déclarée.",
    criteria: [
      {
        id: 'type-accepte',
        label:
          "Document accepté : facture d'électricité, de gaz, d'eau, d'assurance habitation, d'internet, de téléphone fixe ou mobile, ou quittance de loyer",
        instruction:
          "Vérifie que le document appartient à la liste des justificatifs acceptés : facture d'électricité, de gaz, d'eau, d'assurance habitation, d'internet, de téléphone fixe ou mobile, ou quittance de loyer. Tout autre type de document est refusé.",
      },
      {
        id: 'pas-attestation',
        label: "N'est pas une attestation de contrat (énergie ou assurance)",
        instruction:
          "Vérifie que le document est une facture ou une quittance, et NON une attestation de contrat (attestation de contrat d'énergie, attestation d'assurance habitation…). Les attestations de contrat sont explicitement refusées.",
      },
      {
        id: 'date-recente',
        label: 'Daté de moins de 3 mois',
        dateRule: 'recency3m',
        instruction:
          "Recopie la date d'émission du document (date de la facture ou de la quittance) dans extracted.dateEmission. Le calcul « moins de 3 mois » est refait par le système à partir de cette valeur. Si aucune date d'émission n'est lisible, laisse extracted.dateEmission vide et mets le critère en échec.",
      },
      {
        id: 'nom-prenom',
        label: 'Comporte le nom et le prénom déclarés',
        fixFields: ['nom', 'prenoms'],
        instruction:
          'Vérifie que le nom et le prénom du client déclarés figurent sur le document (titulaire de la facture ou du bail).',
      },
      {
        id: 'adresse',
        label: "L'adresse correspond à l'adresse déclarée",
        fixFields: ['adresse', 'codePostal', 'ville', 'pays'],
        instruction:
          "Compare l'adresse du logement figurant sur le document (adresse de fourniture/du bien, pas l'adresse de facturation si différente) avec l'adresse déclarée (voie, code postal, ville, pays). Tolère les abréviations usuelles (av./avenue, bd/boulevard…).",
      },
      {
        id: 'lisibilite',
        label: 'Document entier et lisible',
        instruction:
          'Vérifie que le document est fourni en entier et que les informations clés (émetteur, date, nom, adresse) sont nettes et lisibles.',
      },
    ],
  },
  rib: {
    key: 'rib',
    expected: "Un relevé d'identité bancaire (RIB) au nom du client.",
    criteria: [
      {
        id: 'type-document',
        label: "Le document est un relevé d'identité bancaire (RIB)",
        instruction:
          "Vérifie que le document est bien un RIB / relevé d'identité bancaire (et non un relevé de compte, une carte bancaire ou un autre document).",
      },
      {
        id: 'titulaire',
        label: 'Le RIB est au nom du client',
        fixFields: ['nom', 'prenoms'],
        instruction:
          'Compare le nom du titulaire du compte avec le nom et le prénom déclarés par le client. Le RIB doit être au nom du client (un compte joint mentionnant le client est accepté, signale-le dans le détail).',
      },
      {
        id: 'coordonnees',
        label: 'IBAN et BIC complets et lisibles',
        instruction:
          "Vérifie que l'IBAN et le BIC sont présents, complets et lisibles, et que l'IBAN a un format plausible (ex. FR76 suivi de 23 caractères pour un IBAN français).",
      },
      {
        id: 'qualite',
        label: 'Document net et entier',
        instruction:
          'Vérifie que le document est fourni en entier, net, sans zone coupée ou masquée.',
      },
    ],
  },
}

export function getDocDefinition(key: DocTypeKey): DocDefinition | undefined {
  return DOC_DEFINITIONS[key]
}

export function buildPrompt(def: DocDefinition, client: ClientInfo, fileCount: number): string {
  const today = new Date().toISOString().slice(0, 10)
  const criteriaBlock = def.criteria
    .map((c) => {
      const lines = [`- id: ${c.id}`, `  critère: ${c.label}`, `  consigne: ${c.instruction}`]
      if (c.fixFields?.length) {
        lines.push(`  champs déclarés comparés (pour suggestedFix) : ${c.fixFields.join(', ')}`)
      }
      return lines.join('\n')
    })
    .join('\n')
  return `Tu es un agent de pré-contrôle documentaire KYC pour Goodvest, une plateforme d'épargne responsable française.
Un client en cours de souscription vient de soumettre un document. Ton rôle est de vérifier, au premier regard, si ce document risque d'être rejeté par le tiers qui réalise les contrôles officiels, afin de donner un feedback immédiat au client. Ce pré-contrôle est indicatif : il ne remplace pas la validation officielle.

Date du jour : ${today}

Document attendu : ${def.expected}
Nombre de fichiers fournis : ${fileCount}

Informations déclarées par le client lors de la souscription :
- Civilité : ${client.civilite || '(non renseignée)'}
- Prénoms : ${client.prenoms || '(non renseignés)'}
- Nom de famille : ${client.nom || '(non renseigné)'}
- Date de naissance : ${client.dateNaissance || '(non renseignée)'}
- Nationalité : ${client.nationalite || '(non renseignée)'}
- Adresse : ${[client.adresse, client.codePostal, client.ville, client.pays].filter(Boolean).join(', ') || '(non renseignée)'}

Procède en deux temps, dans cet ordre :

ÉTAPE 1 — EXTRACTION (champ "extracted", à remplir en premier).
Recopie VERBATIM les valeurs brutes lues sur le document, sans interprétation : type de document observé, nom, prénoms, date de naissance, nationalité, adresse, date d'émission/délivrance, date d'expiration, IBAN, BIC. Dates au format AAAA-MM-JJ. Chaîne vide pour toute valeur absente ou illisible — n'invente jamais.
⚠️ Les pièces d'identité portent DEUX dates distinctes : la date de délivrance (extracted.dateEmission) et la date d'expiration (extracted.dateExpiration). Ne les confonds jamais.

ÉTAPE 2 — ÉVALUATION. Évalue chacun des critères suivants sur la base des valeurs extraites et de ton observation visuelle du document :
${criteriaBlock}

Règles :
- Pour chaque critère, remplis d'abord "observation" (ce que tu constates factuellement, en citant les valeurs extraites pertinentes), PUIS conclus avec "status" : la conclusion doit découler logiquement de l'observation.
- Pour chaque critère, rends un statut "pass" ou "fail".
- En cas de doute sérieux ou d'information illisible/introuvable, choisis "fail" et explique pourquoi : mieux vaut demander une correction maintenant qu'un rejet plus tard.
- Le champ "detail" doit être une phrase courte en français, orientée client : si le critère échoue, explique précisément le problème et ce que le client doit corriger (re-upload d'un document conforme, ou correction de l'information déclarée si c'est elle qui est erronée).
- Le champ "suggestedFix" : si un critère échoue UNIQUEMENT à cause d'une incohérence entre le document et les informations déclarées, et que la valeur est lisible sur le document, renseigne un élément par champ concerné (parmi les "champs déclarés comparés" du critère) avec la valeur exacte lue sur le document. Formats : dateNaissance en AAAA-MM-JJ ; nationalite en français usuel (ex. « Sud-africaine ») ; nom et prénoms avec leur casse usuelle (ex. « Da Silva », « Sebastian Eduardo »). Dans tous les autres cas (document inadéquat, illisible, critère réussi), laisse suggestedFix vide.
- Le champ "documentSummary" décrit en une ou deux phrases ce que tu as identifié (type de document, émetteur, nom lu, dates pertinentes).
- Réponds uniquement avec le JSON demandé.`
}

/** Forme du JSON attendu du modèle (garanti par le schéma structured-outputs côté serveur). */
export interface RawModelOutput {
  extracted?: Partial<Record<keyof ExtractedValues, string>>
  documentSummary?: string
  criteria?: Array<{
    id?: string
    observation?: string
    status?: string
    detail?: string
    suggestedFix?: Array<{ field?: string; value?: string }>
  }>
}

function parseIsoDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Verdict déterministe des critères datés : le modèle lit les dates
 * (extraction), le code les compare à la date du jour — jamais l'inverse.
 */
function applyDateRule(
  rule: NonNullable<CriterionDefinition['dateRule']>,
  extracted: Partial<Record<keyof ExtractedValues, string>>,
): { status: CriterionStatus; detail: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (rule === 'expiration') {
    const expiration = parseIsoDate(extracted.dateExpiration)
    if (!expiration) {
      return { status: 'fail', detail: "La date d'expiration n'a pas pu être lue sur le document." }
    }
    return expiration >= today
      ? { status: 'pass', detail: `Document valide jusqu'au ${formatFr(expiration)}.` }
      : { status: 'fail', detail: `Le document a expiré le ${formatFr(expiration)}. Veuillez fournir un document en cours de validité.` }
  }

  // recency3m
  const emission = parseIsoDate(extracted.dateEmission)
  if (!emission) {
    return { status: 'fail', detail: "La date d'émission n'a pas pu être lue sur le document." }
  }
  const threshold = new Date(today)
  threshold.setMonth(threshold.getMonth() - 3)
  return emission >= threshold
    ? { status: 'pass', detail: `Document daté du ${formatFr(emission)} (moins de 3 mois).` }
    : { status: 'fail', detail: `Le document est daté du ${formatFr(emission)}, soit plus de 3 mois. Veuillez fournir un justificatif plus récent.` }
}

/** Rabat la sortie du modèle sur la liste de critères de référence du document. */
export function toPrecheckResult(def: DocDefinition, parsed: RawModelOutput): PrecheckResult {
  const extracted = parsed.extracted ?? {}
  const byId = new Map((parsed.criteria ?? []).map((c) => [c.id, c]))
  const criteria: CriterionResult[] = def.criteria.map((c) => {
    const found = byId.get(c.id)
    if (!found && !c.dateRule) {
      return { id: c.id, label: c.label, status: 'fail', detail: "Ce critère n'a pas pu être évalué." }
    }
    const allowedFields = c.fixFields ?? []
    const suggestedFix = (found?.suggestedFix ?? [])
      .filter(
        (f): f is SuggestedFixEntry =>
          typeof f.field === 'string' &&
          typeof f.value === 'string' &&
          f.value.trim() !== '' &&
          allowedFields.includes(f.field as FixableField),
      )
    const base: CriterionResult = {
      id: c.id,
      label: c.label,
      status: found?.status === 'pass' ? 'pass' : 'fail',
      detail: found?.detail ?? '',
      ...(found?.observation ? { observation: found.observation } : {}),
      ...(suggestedFix.length > 0 ? { suggestedFix } : {}),
    }
    // Les critères datés sont tranchés par le code, pas par le modèle.
    if (c.dateRule) {
      const verdict = applyDateRule(c.dateRule, extracted)
      return { ...base, status: verdict.status, detail: verdict.detail }
    }
    return base
  })

  return {
    docType: def.key,
    overall: criteria.every((c) => c.status === 'pass') ? 'pass' : 'fail',
    documentSummary: parsed.documentSummary ?? '',
    criteria,
    extracted,
  }
}
