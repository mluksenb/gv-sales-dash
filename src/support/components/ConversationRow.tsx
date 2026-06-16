import { ExternalLink } from 'lucide-react'
import type { Conversation } from '../types'
import { intercomConversationUrl } from '../lib/intercom'
import { formatDate, relativeFromNow } from '../lib/format'
import { ChannelIcon, ResolutionBadge } from './ui'

interface Props {
  conversation: Conversation
  workspaceId: string
}

export function ConversationRow({ conversation: c, workspaceId }: Props) {
  const url = intercomConversationUrl(workspaceId, c.id)
  const title = c.title ?? c.topic

  return (
    <div className="group rounded-xl border border-slate-100 bg-white p-3.5 transition-colors hover:border-slate-200 hover:bg-slate-50/50">
      <div className="mb-2 flex items-center gap-2">
        <ChannelIcon medium={c.medium} className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500" title={formatDate(c.createdAt)}>
          {formatDate(c.createdAt)}
        </span>
        <span className="text-[11px] text-slate-300">·</span>
        <span className="text-[11px] text-slate-400">{relativeFromNow(c.createdAt)}</span>
        <div className="ml-auto">
          <ResolutionBadge resolution={c.resolution} />
        </div>
      </div>

      {c.title && (
        <div className="mb-0.5 text-sm font-semibold text-slate-800">{title}</div>
      )}

      <p className="text-[13px] leading-relaxed text-slate-600">
        {c.summary ?? <span className="italic text-slate-400">Pas de résumé disponible.</span>}
      </p>

      <div className="mt-2.5 flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-forest"
        >
          Intercom
          <ExternalLink className="h-3 w-3" />
        </a>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {c.secondaryTopics?.slice(0, 2).map((t) => (
            <span
              key={t}
              className="truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
