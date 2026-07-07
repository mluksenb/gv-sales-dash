import type { ReactNode } from 'react'
import type { ClientInfo, FixableField } from '../../../api/_lib/kyc'

interface Props {
  value: ClientInfo
  onChange: (value: ClientInfo) => void
  /** Champs venant d'être mis à jour automatiquement (surlignés en vert). */
  highlightedFields?: ReadonlySet<FixableField>
}

const FIELD_CLASS =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-500 focus:border-forest focus:ring-2 focus:ring-forest/15 placeholder:text-slate-400'

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function GroupTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</h3>
}

export function ClientInfoForm({ value, onChange, highlightedFields }: Props) {
  const set = (patch: Partial<ClientInfo>) => onChange({ ...value, ...patch })

  const fieldClass = (field: FixableField) =>
    `${FIELD_CLASS} ${
      highlightedFields?.has(field)
        ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300/50'
        : 'border-slate-200'
    }`

  return (
    <div className="space-y-6">
      <fieldset>
        <GroupTitle>Identité</GroupTitle>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Civilité">
            <select
              className={fieldClass('civilite')}
              value={value.civilite}
              onChange={(e) => set({ civilite: e.target.value })}
            >
              <option value="">—</option>
              <option value="Madame">Madame</option>
              <option value="Monsieur">Monsieur</option>
            </select>
          </Field>
          <Field label="Prénoms">
            <input
              className={fieldClass('prenoms')}
              value={value.prenoms}
              onChange={(e) => set({ prenoms: e.target.value })}
              placeholder="Maëlys-Gaëlle, Marie"
            />
          </Field>
          <Field label="Nom de famille">
            <input
              className={fieldClass('nom')}
              value={value.nom}
              onChange={(e) => set({ nom: e.target.value })}
              placeholder="Martin"
            />
          </Field>
          <Field label="Date de naissance">
            <input
              type="date"
              className={fieldClass('dateNaissance')}
              value={value.dateNaissance}
              onChange={(e) => set({ dateNaissance: e.target.value })}
            />
          </Field>
          <Field label="Nationalité">
            <input
              className={fieldClass('nationalite')}
              value={value.nationalite}
              onChange={(e) => set({ nationalite: e.target.value })}
              placeholder="Française"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="border-t border-slate-100 pt-5">
        <GroupTitle>Adresse</GroupTitle>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="N° et voie" className="sm:col-span-2 lg:col-span-3">
            <input
              className={fieldClass('adresse')}
              value={value.adresse}
              onChange={(e) => set({ adresse: e.target.value })}
              placeholder="12 rue de la Paix"
            />
          </Field>
          <Field label="Code postal">
            <input
              className={fieldClass('codePostal')}
              value={value.codePostal}
              onChange={(e) => set({ codePostal: e.target.value })}
              placeholder="75002"
            />
          </Field>
          <Field label="Ville">
            <input
              className={fieldClass('ville')}
              value={value.ville}
              onChange={(e) => set({ ville: e.target.value })}
              placeholder="Paris"
            />
          </Field>
          <Field label="Pays">
            <input
              className={fieldClass('pays')}
              value={value.pays}
              onChange={(e) => set({ pays: e.target.value })}
              placeholder="France"
            />
          </Field>
        </div>
      </fieldset>
    </div>
  )
}
