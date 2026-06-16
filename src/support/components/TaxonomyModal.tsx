import { useEffect, useState } from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen, X } from 'lucide-react'
import { categoryColor } from '../lib/categories'

interface Props {
  open: boolean
  onClose: () => void
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">{children}</h1>
  ),
  h2: ({ children }) => {
    const text = String(children)
    const color = categoryColor(text.replace(/^\d+\.\s*/, ''))
    return (
      <h2
        className="mb-3 mt-8 flex items-center gap-2 border-b border-slate-100 pb-2 text-lg font-bold text-slate-900 first:mt-0"
        style={{ scrollMarginTop: '5rem' }}
      >
        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
        {children}
      </h2>
    )
  },
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-[15px] font-bold text-slate-800">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-[13px] leading-relaxed text-slate-600">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1 text-[13px] text-slate-600">{children}</ul>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-6 border-slate-100" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 text-slate-500">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-slate-200 px-3 py-2 font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-600">{children}</td>
  ),
  tr: ({ children }) => <tr className="last:border-0">{children}</tr>,
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-700">
      {children}
    </code>
  ),
}

export function TaxonomyModal({ open, onClose }: Props) {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || markdown !== null) return
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}support-taxonomy.md`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        if (!cancelled) setMarkdown(text)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Erreur de chargement')
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, markdown])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="taxonomy-modal-title"
        className="fixed inset-x-4 top-[5vh] z-[70] mx-auto flex max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl sm:inset-x-8"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 id="taxonomy-modal-title" className="text-lg font-bold text-slate-900">
                Définitions de la taxonomie
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Comment l&apos;IA classe chaque conversation selon le besoin initial du client
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 scroll-soft">
          {loadError ? (
            <p className="text-sm text-red-600">
              Impossible de charger la taxonomie ({loadError}). Lancez{' '}
              <code className="rounded bg-red-50 px-1">npm run intercom:dashboard-data</code> pour
              générer <code className="rounded bg-red-50 px-1">public/support-taxonomy.md</code>.
            </p>
          ) : markdown === null ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-forest" />
              Chargement…
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </>
  )
}
