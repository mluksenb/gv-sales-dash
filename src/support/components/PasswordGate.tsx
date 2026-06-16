import { useState, type FormEvent } from 'react'
import { Lock, Loader2, ShieldAlert } from 'lucide-react'

interface PasswordGateProps {
  onSubmit: (password: string) => void
  unlocking: boolean
  error: string | null
}

export function PasswordGate({ onSubmit, unlocking, error }: PasswordGateProps) {
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = password.trim()
    if (value && !unlocking) onSubmit(value)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white shadow-sm">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900">
            Support Insights · Goodvest
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ces données sont chiffrées. Saisissez le mot de passe pour les consulter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            disabled={unlocking}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/20 disabled:opacity-60"
          />

          {error && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={unlocking || !password.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {unlocking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Déchiffrement…
              </>
            ) : (
              'Déverrouiller'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
          Le mot de passe ne quitte jamais votre navigateur et n'est jamais transmis à un serveur.
        </p>
      </div>
    </div>
  )
}
