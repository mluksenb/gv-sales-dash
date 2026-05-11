import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Save, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { format, addWeeks, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { StickyHeader } from './StickyHeader'
import { teamMembers, getTeamMemberWeekSchedule } from '../data/mockData'
import {
  computeWeeklyMetrics,
  progressColor,
  appointmentProgressColor,
  formatK,
  formatKEuros,
  WEEKLY_COLLECTE_TARGET,
  DAILY_COLLECTE_TARGET,
  EXPECTED_CALLS_PER_HOUR,
  getParisToday,
} from '../utils/calendarMetrics'
import type { Page } from '../App'
import type { TeamMemberMetrics } from '../utils/calendarMetrics'

interface ObjectivesPageProps {
  setPage: (page: Page) => void
}

const TEAL = '#1a3a3a'

type SortColumn = 'name' | 'rdv' | 'noshow' | 'appels' | 'taches' | 'sla' | 'signe'
type SortDir = 'asc' | 'desc'

function getSortValue(col: SortColumn, metrics: TeamMemberMetrics, name: string): number | string {
  switch (col) {
    case 'name': return name
    case 'rdv': return metrics.meetingsDone
    case 'noshow': return metrics.noShowPercent
    case 'appels': return metrics.callsDone
    case 'taches': return metrics.tasksDone
    case 'sla': return metrics.slaPercent
    case 'signe': return metrics.collecte
  }
}

function MetricCell({
  percent,
  label,
  color,
  dark,
}: {
  percent: number
  label: string
  color: string
  dark?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: dark ? `${TEAL}15` : '#e5e7eb' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-[11px] font-semibold whitespace-nowrap shrink-0"
        style={{ color: dark ? TEAL : '#374151' }}
      >
        {label}
      </span>
    </div>
  )
}

function computeTotals(
  rows: { metrics: TeamMemberMetrics; weeklyTarget: number }[],
) {
  let meetings = 0
  let meetingsTarget = 0
  let clientMeetingsForNoShow = 0
  let noShows = 0
  let calls = 0
  let callsExp = 0
  let tasksDone = 0
  let tasksTotal = 0
  let slaNum = 0
  let collecte = 0
  let collecteTarget = 0

  for (const { metrics, weeklyTarget: ct } of rows) {
    meetings += metrics.meetingsDone
    meetingsTarget += metrics.meetingsTarget
    const memberClientTotal =
      metrics.noShowPercent > 0
        ? Math.round(metrics.meetingsDone / (1 - metrics.noShowPercent / 100))
        : metrics.meetingsDone
    clientMeetingsForNoShow += memberClientTotal
    noShows += Math.round((memberClientTotal * metrics.noShowPercent) / 100)
    calls += metrics.callsDone
    callsExp += metrics.callsExpected
    tasksDone += metrics.tasksDone
    tasksTotal += metrics.tasksTotal
    slaNum += Math.round((metrics.tasksDone * metrics.slaPercent) / 100)
    collecte += metrics.collecte
    collecteTarget += ct
  }

  const noShowPct = clientMeetingsForNoShow > 0 ? Math.round((noShows / clientMeetingsForNoShow) * 100) : 0
  const callsPct = callsExp > 0 ? Math.min((calls / callsExp) * 100, 100) : 0
  const tasksPct = tasksTotal > 0 ? Math.min((tasksDone / tasksTotal) * 100, 100) : 0
  const slaPct = tasksDone > 0 ? Math.min((slaNum / tasksDone) * 100, 100) : 0
  const meetingPct = meetingsTarget > 0 ? Math.min((meetings / meetingsTarget) * 100, 100) : 0
  const collectePct = collecteTarget > 0 ? Math.min((collecte / collecteTarget) * 100, 100) : 0

  return {
    meetings, meetingsTarget, meetingPct,
    noShowPct,
    calls, callsExp, callsPct,
    tasksDone, tasksTotal, tasksPct,
    slaPct,
    collecte, collecteTarget, collectePct,
  }
}

const RADIUS = 12

const signeColStyle: React.CSSProperties = {
  backgroundColor: `${TEAL}08`,
  borderLeft: `2px solid ${TEAL}`,
  borderRight: `2px solid ${TEAL}`,
}

const signeHeadStyle: React.CSSProperties = {
  ...signeColStyle,
  backgroundColor: `${TEAL}0d`,
  borderTop: `2px solid ${TEAL}`,
  borderTopLeftRadius: RADIUS,
  borderTopRightRadius: RADIUS,
}

const signeLastStyle: React.CSSProperties = {
  ...signeColStyle,
  borderBottom: `2px solid ${TEAL}`,
  borderBottomLeftRadius: RADIUS,
  borderBottomRightRadius: RADIUS,
}

const signeEditStyle: React.CSSProperties = {
  borderLeft: `2px solid ${TEAL}`,
  borderRight: `2px solid ${TEAL}`,
  backgroundColor: `${TEAL}06`,
}

const signeEditHeadStyle: React.CSSProperties = {
  ...signeEditStyle,
  borderTop: `2px solid ${TEAL}`,
  backgroundColor: `${TEAL}0d`,
  borderTopLeftRadius: RADIUS,
  borderTopRightRadius: RADIUS,
}

const signeEditLastStyle: React.CSSProperties = {
  ...signeEditStyle,
  borderBottom: `2px solid ${TEAL}`,
  borderBottomLeftRadius: RADIUS,
  borderBottomRightRadius: RADIUS,
}

const totalRowStyle: React.CSSProperties = {
  backgroundColor: `${TEAL}12`,
}

const totalBottomBorder: React.CSSProperties = {
  borderBottom: `2px solid ${TEAL}30`,
}

function SortIcon({ column, sortCol, sortDir }: { column: SortColumn; sortCol: SortColumn | null; sortDir: SortDir }) {
  if (sortCol !== column) {
    return <ArrowUpDown size={10} className="text-gray-400 ml-0.5 shrink-0" />
  }
  return sortDir === 'asc'
    ? <ArrowUp size={10} className="shrink-0" style={{ color: TEAL }} />
    : <ArrowDown size={10} className="shrink-0" style={{ color: TEAL }} />
}

export function ObjectivesPage({ setPage }: ObjectivesPageProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [collecteTargets, setCollecteTargets] = useState<Record<string, number>>({})
  const [callsTargets, setCallsTargets] = useState<Record<string, number>>({})
  const [draftTargets, setDraftTargets] = useState<Record<string, number>>({})
  const [draftCallsTargets, setDraftCallsTargets] = useState<Record<string, number>>({})
  const [editing, setEditing] = useState(false)
  const [sortCol, setSortCol] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const weekStart = addWeeks(startOfWeek(getParisToday(), { weekStartsOn: 1 }), weekOffset)
  const weekLabel = `Semaine du ${format(weekStart, 'd MMMM yyyy', { locale: fr })}`

  const memberMetrics = useMemo(() => {
    return teamMembers.map((member) => {
      const memberIndex = teamMembers.findIndex((m) => m.id === member.id)
      const schedule = getTeamMemberWeekSchedule(member.id, weekOffset)
      const dailyTarget = collecteTargets[member.id] ?? DAILY_COLLECTE_TARGET
      const weeklyTarget = dailyTarget * 5
      const callsPerHour = callsTargets[member.id] ?? EXPECTED_CALLS_PER_HOUR
      const metrics = computeWeeklyMetrics(schedule, weeklyTarget, (memberIndex + 1) * 50, callsPerHour)
      return { member, metrics, dailyTarget, weeklyTarget, callsPerHour }
    })
  }, [weekOffset, collecteTargets, callsTargets])

  const sortedMetrics = useMemo(() => {
    if (!sortCol) return memberMetrics
    const sorted = [...memberMetrics].sort((a, b) => {
      const va = getSortValue(sortCol, a.metrics, a.member.name)
      const vb = getSortValue(sortCol, b.metrics, b.member.name)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return sorted
  }, [memberMetrics, sortCol, sortDir])

  const totals = useMemo(() => computeTotals(memberMetrics), [memberMetrics])

  function handleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  function startEditing() {
    const drafts: Record<string, number> = {}
    const callsDrafts: Record<string, number> = {}
    for (const m of teamMembers) {
      drafts[m.id] = collecteTargets[m.id] ?? DAILY_COLLECTE_TARGET
      callsDrafts[m.id] = callsTargets[m.id] ?? EXPECTED_CALLS_PER_HOUR
    }
    setDraftTargets(drafts)
    setDraftCallsTargets(callsDrafts)
    setEditing(true)
  }

  function saveObjectives() {
    setCollecteTargets({ ...draftTargets })
    setCallsTargets({ ...draftCallsTargets })
    setEditing(false)
  }

  function cancelEditing() {
    setEditing(false)
  }

  const thBtn = 'flex items-center justify-center gap-0.5 w-full cursor-pointer select-none uppercase'

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <StickyHeader page="objectifs" setPage={setPage} />

      <div className="mx-auto w-full max-w-[88rem] p-6 space-y-6">
        {/* Week selector */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-[220px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Team table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <colgroup>
                <col style={{ width: 140 }} />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                    <button onClick={() => handleSort('name')} className={thBtn} style={{ justifyContent: 'flex-start' }}>
                      Conseiller
                      <SortIcon column="name" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-2 border-l border-gray-100">
                    <button onClick={() => handleSort('rdv')} className={thBtn}>
                      RDV clients
                      <SortIcon column="rdv" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-2 border-l border-gray-100">
                    <button onClick={() => handleSort('noshow')} className={thBtn}>
                      No-shows
                      <SortIcon column="noshow" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-2 border-l border-gray-100">
                    <button onClick={() => handleSort('appels')} className={thBtn}>
                      Appels
                      <SortIcon column="appels" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-2 border-l border-gray-100">
                    <button onClick={() => handleSort('taches')} className={thBtn}>
                      Tâches
                      <SortIcon column="taches" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-2 border-l border-gray-100">
                    <button onClick={() => handleSort('sla')} className={thBtn}>
                      SLA tâches
                      <SortIcon column="sla" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                  <th
                    className="text-center text-[11px] font-bold uppercase tracking-wider py-3 px-2"
                    style={{ ...(editing ? signeEditHeadStyle : signeHeadStyle), color: TEAL }}
                  >
                    <button onClick={() => handleSort('signe')} className={thBtn} style={{ color: TEAL }}>
                      Signé
                      <SortIcon column="signe" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Team totals row */}
                <tr style={totalRowStyle}>
                  <td className="px-4 py-5" style={totalBottomBorder}>
                    <span className="text-xs font-bold" style={{ color: TEAL }}>
                      Équipe
                    </span>
                  </td>
                  <td className="px-2 py-5 border-l border-gray-100" style={totalBottomBorder}>
                    <MetricCell
                      percent={totals.meetingPct}
                      label={`${totals.meetings} / ${totals.meetingsTarget}`}
                      color={appointmentProgressColor(totals.meetings / teamMembers.length / 5)}
                    />
                  </td>
                  <td className="px-2 py-5 border-l border-gray-100" style={totalBottomBorder}>
                    <MetricCell
                      percent={totals.noShowPct}
                      label={`${totals.noShowPct}%`}
                      color={progressColor(totals.noShowPct, false)}
                    />
                  </td>
                  <td className="px-2 py-5 border-l border-gray-100" style={totalBottomBorder}>
                    {editing ? (
                      <span className="flex items-center justify-center text-[11px] font-bold" style={{ color: TEAL }}>
                        —
                      </span>
                    ) : (
                      <MetricCell
                        percent={totals.callsPct}
                        label={`${totals.calls} / ${totals.callsExp}`}
                        color={progressColor(totals.callsPct, true)}
                      />
                    )}
                  </td>
                  <td className="px-2 py-5 border-l border-gray-100" style={totalBottomBorder}>
                    <MetricCell
                      percent={totals.tasksPct}
                      label={`${totals.tasksDone} / ${totals.tasksTotal}`}
                      color={progressColor(totals.tasksPct, true)}
                    />
                  </td>
                  <td className="px-2 py-5 border-l border-gray-100" style={totalBottomBorder}>
                    <MetricCell
                      percent={totals.slaPct}
                      label={`${Math.round(totals.slaPct)}%`}
                      color={progressColor(totals.slaPct, true)}
                    />
                  </td>
                  <td
                    className="px-2 py-5"
                    style={editing
                      ? { ...signeEditStyle, backgroundColor: `${TEAL}10` }
                      : { ...signeColStyle, backgroundColor: `${TEAL}18` }
                    }
                  >
                    {editing ? (
                      <span className="flex items-center justify-center text-[11px] font-bold" style={{ color: TEAL }}>
                        {formatKEuros(Object.values(draftTargets).reduce((s, v) => s + v, 0))} / j
                      </span>
                    ) : (
                      <MetricCell
                        percent={totals.collectePct}
                        label={`${formatK(totals.collecte)} / ${formatKEuros(totals.collecteTarget)}`}
                        color={progressColor(totals.collectePct, true)}
                        dark
                      />
                    )}
                  </td>
                </tr>

                {/* Individual rows */}
                {sortedMetrics.map(({ member, metrics, dailyTarget, weeklyTarget, callsPerHour }, index) => {
                  const isLast = index === sortedMetrics.length - 1
                  return (
                    <tr
                      key={member.id}
                      className={!isLast ? 'border-b border-gray-100' : ''}
                    >
                      <td className="px-4 py-5">
                        <span className="text-xs font-semibold text-gray-900 truncate block">
                          {member.name}
                        </span>
                      </td>
                      <td className="px-2 py-5 border-l border-gray-100">
                        <MetricCell
                          percent={metrics.meetingPercent}
                          label={`${metrics.meetingsDone} / ${metrics.meetingsTarget}`}
                          color={appointmentProgressColor(metrics.meetingsDone / 5)}
                        />
                      </td>
                      <td className="px-2 py-5 border-l border-gray-100">
                        <MetricCell
                          percent={metrics.noShowPercent}
                          label={`${Math.round(metrics.noShowPercent)}%`}
                          color={progressColor(metrics.noShowPercent, false)}
                        />
                      </td>
                      <td className="px-2 py-5 border-l border-gray-100">
                        {editing ? (
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={String(draftCallsTargets[member.id] ?? callsPerHour)}
                              onChange={(e) => {
                                const parsed = Number.parseInt(e.target.value, 10)
                                if (!Number.isNaN(parsed) && parsed > 0) {
                                  setDraftCallsTargets((prev) => ({
                                    ...prev,
                                    [member.id]: parsed,
                                  }))
                                }
                              }}
                              className="w-full text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center outline-none transition-colors"
                              style={{ borderColor: `${TEAL}40` }}
                              onFocus={(e) => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = `0 0 0 2px ${TEAL}15` }}
                              onBlur={(e) => { e.target.style.borderColor = `${TEAL}40`; e.target.style.boxShadow = 'none' }}
                            />
                            <span className="text-[11px] font-medium ml-1 shrink-0" style={{ color: `${TEAL}80` }}>/ h</span>
                          </div>
                        ) : (
                          <MetricCell
                            percent={metrics.callsPercent}
                            label={`${metrics.callsDone} / ${metrics.callsExpected}`}
                            color={progressColor(metrics.callsPercent, true)}
                          />
                        )}
                      </td>
                      <td className="px-2 py-5 border-l border-gray-100">
                        <MetricCell
                          percent={metrics.tasksPercent}
                          label={`${metrics.tasksDone} / ${metrics.tasksTotal}`}
                          color={progressColor(metrics.tasksPercent, true)}
                        />
                      </td>
                      <td className="px-2 py-5 border-l border-gray-100">
                        <MetricCell
                          percent={metrics.slaPercent}
                          label={`${Math.round(metrics.slaPercent)}%`}
                          color={progressColor(metrics.slaPercent, true)}
                        />
                      </td>
                      <td
                        className="px-2 py-5"
                        style={editing
                          ? (isLast ? signeEditLastStyle : signeEditStyle)
                          : (isLast ? signeLastStyle : signeColStyle)
                        }
                      >
                        {editing ? (
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={String((draftTargets[member.id] ?? dailyTarget) / 1000).replace('.', ',')}
                              onChange={(e) => {
                                const parsed = Number.parseFloat(e.target.value.replace(',', '.'))
                                if (!Number.isNaN(parsed) && parsed > 0) {
                                  setDraftTargets((prev) => ({
                                    ...prev,
                                    [member.id]: Math.round(parsed * 1000),
                                  }))
                                }
                              }}
                              className="w-full text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center outline-none transition-colors"
                              style={{ borderColor: `${TEAL}40` }}
                              onFocus={(e) => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = `0 0 0 2px ${TEAL}15` }}
                              onBlur={(e) => { e.target.style.borderColor = `${TEAL}40`; e.target.style.boxShadow = 'none' }}
                            />
                            <span className="text-[11px] font-medium ml-1 shrink-0" style={{ color: `${TEAL}80` }}>K€/j</span>
                          </div>
                        ) : (
                          <MetricCell
                            percent={metrics.collectePercent}
                            label={`${formatK(metrics.collecte)} / ${formatKEuros(weeklyTarget)}`}
                            color={progressColor(metrics.collectePercent, true)}
                            dark
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer actions */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <div />
            {editing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={saveObjectives}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
                  style={{ backgroundColor: TEAL }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f2828' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = TEAL }}
                >
                  <Save size={14} />
                  Enregistrer les objectifs
                </button>
              </div>
            ) : (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border"
                style={{ color: TEAL, borderColor: `${TEAL}30` }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${TEAL}08` }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Pencil size={14} />
                Modifier les objectifs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
