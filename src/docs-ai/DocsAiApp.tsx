import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, User } from 'lucide-react'
import type { ClientInfo, FixableField } from '../../api/_lib/kyc'
import { ClientInfoForm } from './components/ClientInfoForm'
import { DocumentCard } from './components/DocumentCard'

const INITIAL_CLIENT: ClientInfo = {
  civilite: '',
  prenoms: '',
  nom: '',
  dateNaissance: '',
  nationalite: 'Française',
  adresse: '',
  codePostal: '',
  ville: '',
  pays: 'France',
}

const CLIENT_STORAGE_KEY = 'docs-ai-client-info'

function loadStoredClient(): ClientInfo {
  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEY)
    if (raw) return { ...INITIAL_CLIENT, ...(JSON.parse(raw) as Partial<ClientInfo>) }
  } catch {
    // stockage indisponible ou JSON corrompu : on repart des valeurs par défaut
  }
  return INITIAL_CLIENT
}

export function DocsAiApp() {
  const [client, setClient] = useState<ClientInfo>(loadStoredClient)
  const [clientVersion, setClientVersion] = useState(0)

  const handleClientChange = (value: ClientInfo) => {
    setClientVersion((version) => version + 1)
    setClient(value)
    try {
      localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(value))
    } catch {
      // quota plein ou stockage bloqué : la saisie reste utilisable sans persistance
    }
  }

  /** Champs venant d'être corrigés automatiquement, surlignés en vert quelques secondes. */
  const [highlightedFields, setHighlightedFields] = useState<ReadonlySet<FixableField>>(new Set())
  const highlightTimer = useRef<number | undefined>(undefined)
  const clientSectionRef = useRef<HTMLElement>(null)

  useEffect(() => () => window.clearTimeout(highlightTimer.current), [])

  /** Correction déclenchée depuis une carte document ; renvoie la version résultante. */
  const applyClientPatch = (patch: Partial<ClientInfo>): number => {
    handleClientChange({ ...client, ...patch })
    setHighlightedFields(new Set(Object.keys(patch) as FixableField[]))
    window.clearTimeout(highlightTimer.current)
    highlightTimer.current = window.setTimeout(() => setHighlightedFields(new Set()), 3500)
    clientSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return clientVersion + 1
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-forest">
          <ShieldCheck className="size-4" />
          POC · Pré-contrôle IA des documents KYC
        </p>
        <h1 className="mt-2 font-serif text-3xl text-slate-900 sm:text-4xl">
          Vérification des documents avant soumission
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
          Chaque document déposé fait l'objet d'un pré-contrôle par une IA (Claude Haiku 4.5) :
          adéquation au type de document attendu, qualité de la capture et cohérence avec les
          informations déclarées. Ces vérifications en interne précèdent l'envoi des documents aux
          tiers qui les exigent.
        </p>
      </header>

      <section
        ref={clientSectionRef}
        className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 font-serif text-2xl text-slate-900">
          <User className="size-5 text-forest" />
          Informations du client
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Les informations déclarées lors de la souscription. Les documents déposés sont comparés à
          ces valeurs.
        </p>
        <div className="mt-5">
          <ClientInfoForm value={client} onChange={handleClientChange} highlightedFields={highlightedFields} />
        </div>
      </section>

      <h2 className="mt-10 font-serif text-2xl text-slate-900">Documents à vérifier</h2>
      <p className="mt-1 text-sm text-slate-500">
        Déposez un document : le pré-contrôle se lance automatiquement et détaille chaque critère.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-1">
        <DocumentCard
          title="Pièce d'identité"
          kinds={[
            {
              key: 'identity-cni',
              label: "Carte d'identité",
              slots: [
                { id: 'recto', label: 'Recto de votre document' },
                { id: 'verso', label: 'Verso de votre document' },
              ],
              combined: {
                toggleLabel: 'Recto et verso sur un seul document.',
                slot: { id: 'recto-verso', label: 'Recto et verso de votre document' },
              },
            },
            {
              key: 'identity-passeport',
              label: 'Passeport',
              slots: [{ id: 'passeport', label: "Pages d'informations et de signature" }],
            },
          ]}
          client={client}
          clientVersion={clientVersion}
          onApplyClientPatch={applyClientPatch}
        />
        <DocumentCard
          title="Justificatif de domicile"
          kinds={[
            {
              key: 'residence',
              label: 'Justificatif de domicile',
              slots: [{ id: 'justificatif', label: 'Votre justificatif de domicile' }],
            },
          ]}
          client={client}
          clientVersion={clientVersion}
          onApplyClientPatch={applyClientPatch}
        />
        <DocumentCard
          title="Relevé d'identité bancaire"
          kinds={[{ key: 'rib', label: 'RIB', slots: [{ id: 'rib', label: 'Votre RIB' }] }]}
          client={client}
          clientVersion={clientVersion}
          onApplyClientPatch={applyClientPatch}
        />
      </div>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        POC interne Goodvest — pré-contrôle indicatif réalisé via l'API Claude (Anthropic). En cas
        d'indisponibilité de l'IA, la soumission n'est jamais bloquée (fail-open).
      </footer>
    </div>
  )
}
