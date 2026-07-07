import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  PenLine,
  RefreshCw,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react'
import type {
  ClientInfo,
  CriterionResult,
  DocTypeKey,
  PrecheckFile,
  PrecheckResult,
} from '../../../api/_lib/kyc'
import { getDocDefinition } from '../../../api/_lib/kyc'
import { ACCEPT_ATTRIBUTE, FileValidationError, prepareFile } from '../lib/files'

interface SlotDef {
  id: string
  label: string
}

interface DocKindOption {
  key: DocTypeKey
  label: string
  slots: SlotDef[]
  /** Option « recto et verso sur un seul document » : remplace les slots par un slot unique. */
  combined?: { toggleLabel: string; slot: SlotDef }
}

interface Props {
  title: string
  /** Variantes du document (ex. CNI / passeport). La première est sélectionnée par défaut. */
  kinds: DocKindOption[]
  client: ClientInfo
  /** Incrémenté par le parent à chaque modification des informations client. */
  clientVersion: number
  /** Applique une correction aux informations déclarées ; renvoie la nouvelle version. */
  onApplyClientPatch: (patch: Partial<ClientInfo>) => number
}

type Phase = 'idle' | 'analyzing' | 'done' | 'error'

export function DocumentCard({ title, kinds, client, clientVersion, onApplyClientPatch }: Props) {
  const [kind, setKind] = useState<DocTypeKey>(kinds[0].key)
  const [combined, setCombined] = useState(false)
  const [slotFiles, setSlotFiles] = useState<Record<string, PrecheckFile | undefined>>({})
  const [fileError, setFileError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<PrecheckResult | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [analyzedVersion, setAnalyzedVersion] = useState(0)
  /** Critères en échec « corrigés » via la mise à jour des informations déclarées. */
  const [fixedCriteria, setFixedCriteria] = useState<Set<string>>(new Set())

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const activeKind = kinds.find((option) => option.key === kind) ?? kinds[0]
  const activeSlots = combined && activeKind.combined ? [activeKind.combined.slot] : activeKind.slots
  const definition = getDocDefinition(kind)!

  const orderedFiles = (slots: SlotDef[], record: Record<string, PrecheckFile | undefined>) =>
    slots.map((slot) => record[slot.id]).filter((f): f is PrecheckFile => Boolean(f))

  const analyze = (docType: DocTypeKey, docFiles: PrecheckFile[]) => {
    abortRef.current?.abort()
    setFixedCriteria(new Set())
    if (docFiles.length === 0) {
      setPhase('idle')
      setResult(null)
      setApiError(null)
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setPhase('analyzing')
    setApiError(null)
    const startedVersion = clientVersion
    fetch('/api/kyc-precheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType, client, files: docFiles }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error((data as { error?: string } | null)?.error ?? `Erreur ${response.status}`)
        }
        setResult(data as PrecheckResult)
        setAnalyzedVersion(startedVersion)
        setPhase('done')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setResult(null)
        setApiError(error instanceof Error ? error.message : 'Erreur inconnue')
        setPhase('error')
      })
  }

  const setSlotFile = (slotId: string, file: PrecheckFile | null) => {
    const next = { ...slotFiles, [slotId]: file ?? undefined }
    setSlotFiles(next)
    analyze(kind, orderedFiles(activeSlots, next))
  }

  const fillSlot = async (slotId: string, incoming: FileList | File[]) => {
    setFileError(null)
    const file = Array.from(incoming)[0]
    if (!file) return
    try {
      setSlotFile(slotId, await prepareFile(file))
    } catch (error) {
      setFileError(error instanceof FileValidationError ? error.message : 'Impossible de lire ce fichier.')
    }
  }

  const changeKind = (next: DocTypeKey) => {
    if (next === kind) return
    setKind(next)
    setCombined(false)
    setSlotFiles({})
    analyze(next, [])
  }

  const toggleCombined = () => {
    if (!activeKind.combined) return
    setCombined(!combined)
    setSlotFiles({})
    analyze(kind, [])
  }

  /** Action « Changer de document » : remet le conteneur à son état initial. */
  const resetDocument = () => {
    setSlotFiles({})
    setFileError(null)
    analyze(kind, [])
  }

  /** Action « Mettre à jour les informations » : applique les valeurs lues sur le document. */
  const applyFix = (criterion: CriterionResult) => {
    if (!criterion.suggestedFix?.length) return
    const patch = Object.fromEntries(
      criterion.suggestedFix.map((f) => [f.field, f.value]),
    ) as Partial<ClientInfo>
    const nextVersion = onApplyClientPatch(patch)
    // La correction rend la déclaration cohérente avec l'analyse : pas de bandeau « obsolète ».
    setAnalyzedVersion(nextVersion)
    setFixedCriteria((prev) => new Set(prev).add(criterion.id))
  }

  const failedCriteria =
    phase === 'done' && result
      ? result.criteria.filter((c) => c.status !== 'pass' && !fixedCriteria.has(c.id))
      : []
  const effectiveOverall: 'pass' | 'fail' | null =
    phase === 'done' && result ? (failedCriteria.length === 0 ? 'pass' : 'fail') : null

  const isStale = phase === 'done' && analyzedVersion !== clientVersion

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-serif text-xl text-slate-900">{title}</h3>
        <StatusChip phase={phase} overall={effectiveOverall} />
      </header>

      {kinds.length > 1 && (
        <div className="mt-4 inline-flex w-fit rounded-full bg-slate-100 p-1">
          {kinds.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => changeKind(option.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                kind === option.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className={`mt-4 grid gap-3 ${activeSlots.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {activeSlots.map((slot) => (
          <UploadSlot
            key={`${kind}-${combined}-${slot.id}`}
            slot={slot}
            file={slotFiles[slot.id]}
            onFiles={(incoming) => void fillSlot(slot.id, incoming)}
            onRemove={() => setSlotFile(slot.id, null)}
          />
        ))}
      </div>

      {activeKind.combined && (
        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={combined}
            onClick={toggleCombined}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              combined ? 'bg-forest' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
                combined ? 'left-4.5' : 'left-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-slate-600" onClick={toggleCombined}>
            {activeKind.combined.toggleLabel}
          </span>
        </label>
      )}

      {fileError && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="size-4 shrink-0" />
          {fileError}
        </p>
      )}

      {isStale && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="size-4 shrink-0" />
          Les informations client ont changé depuis cette analyse.
          <button
            type="button"
            onClick={() => analyze(kind, orderedFiles(activeSlots, slotFiles))}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-200"
          >
            <RefreshCw className="size-3.5" /> Relancer
          </button>
        </p>
      )}

      {phase === 'error' && (
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 shrink-0" />
            Pré-contrôle indisponible
          </p>
          <p className="mt-1 text-xs">
            {apiError} — en production, la soumission continuerait sans pré-contrôle (fail-open).
          </p>
          <button
            type="button"
            onClick={() => analyze(kind, orderedFiles(activeSlots, slotFiles))}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-200"
          >
            <RefreshCw className="size-3.5" /> Réessayer
          </button>
        </div>
      )}

      <CriteriaList
        phase={phase}
        definition={definition}
        result={result}
        fixedCriteria={fixedCriteria}
        onChangeDocument={resetDocument}
        onApplyFix={applyFix}
      />
    </section>
  )
}

function CriteriaList({
  phase,
  definition,
  result,
  fixedCriteria,
  onChangeDocument,
  onApplyFix,
}: {
  phase: Phase
  definition: NonNullable<ReturnType<typeof getDocDefinition>>
  result: PrecheckResult | null
  fixedCriteria: Set<string>
  onChangeDocument: () => void
  onApplyFix: (criterion: CriterionResult) => void
}) {
  if (phase === 'done' && result) {
    const evaluated = definition.criteria.map(
      (criterion) =>
        result.criteria.find((c) => c.id === criterion.id) ?? {
          id: criterion.id,
          label: criterion.label,
          status: 'fail' as const,
          detail: '',
        },
    )
    const failed = evaluated.filter((c) => c.status !== 'pass' && !fixedCriteria.has(c.id))
    const passed = evaluated.filter((c) => c.status === 'pass' || fixedCriteria.has(c.id))

    return (
      <div className="mt-5 space-y-5 border-t border-slate-100 pt-4">
        {failed.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-red-500">
              Critères non respectés
            </h4>
            <ul className="mt-3 space-y-3">
              {failed.map((criterion) => (
                <li key={criterion.id} className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                  <div className="flex items-start gap-2.5 text-sm">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                    <div>
                      <p className="font-medium text-red-700">{criterion.label}</p>
                      {criterion.detail && (
                        <p className="mt-0.5 text-xs text-slate-600">{criterion.detail}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 pl-6.5">
                    <button
                      type="button"
                      onClick={onChangeDocument}
                      className="flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      <UploadCloud className="size-3.5" /> Changer de document
                    </button>
                    {criterion.suggestedFix && criterion.suggestedFix.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onApplyFix(criterion)}
                        className="flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-forest-600"
                      >
                        <PenLine className="size-3.5" /> Mettre à jour les informations
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {passed.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Critères respectés
            </h4>
            <ul className="mt-3 space-y-2.5">
              {passed.map((criterion) => (
                <li key={criterion.id} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <p className="text-slate-700">
                    {criterion.label}
                    {fixedCriteria.has(criterion.id) && (
                      <span className="ml-2 rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-medium text-forest">
                        Informations mises à jour
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Critères à respecter</h4>
      <ul className="mt-3 space-y-2.5">
        {definition.criteria.map((criterion) => (
          <li key={criterion.id} className="flex items-start gap-2.5 text-sm">
            {phase === 'analyzing' ? (
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-slate-300" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-slate-200" />
            )}
            <p className="text-slate-700">{criterion.label}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function UploadSlot({
  slot,
  file,
  onFiles,
  onRemove,
}: {
  slot: SlotDef
  file: PrecheckFile | undefined
  onFiles: (incoming: FileList | File[]) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-forest/25 bg-forest-50/60 px-4 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest text-white">
          <FileText className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
          <p className="text-xs text-slate-500">{slot.label}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          aria-label={`Retirer ${file.name}`}
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        onFiles(e.dataTransfer.files)
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
        dragOver ? 'border-forest bg-forest-50' : 'border-slate-200 bg-slate-50/60 hover:border-forest/50 hover:bg-forest-50/50'
      }`}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-forest text-white">
        <UploadCloud className="size-4.5" />
      </span>
      <p className="text-sm font-medium text-slate-700">{slot.label}</p>
      <p className="text-xs text-slate-400">Formats acceptés : PDF, JPG et PNG. max 5 Mo</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function StatusChip({ phase, overall }: { phase: Phase; overall: 'pass' | 'fail' | null }) {
  if (phase === 'analyzing') {
    return (
      <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-semibold text-slate-600">
        <Loader2 className="size-4 animate-spin" /> Analyse en cours…
      </span>
    )
  }
  if (phase === 'done' && overall) {
    return overall === 'pass' ? (
      <span className="flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white animate-fade-in">
        <CheckCircle2 className="size-4" /> Conforme
      </span>
    ) : (
      <span className="flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1.5 text-sm font-semibold text-white animate-fade-in">
        <XCircle className="size-4" /> Non conforme
      </span>
    )
  }
  if (phase === 'error') {
    return (
      <span className="flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1.5 text-sm font-semibold text-amber-800">
        <AlertTriangle className="size-4" /> Indisponible
      </span>
    )
  }
  return (
    <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-400">
      En attente de document
    </span>
  )
}
