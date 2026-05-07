import { Ban } from 'lucide-react'
import type { Appointment } from '../types'
import { ProspectBadge, TierBadge, TelBadge } from './Badge'
import {
  CLIENT_MEETING_CATEGORY,
  EVENT_CATEGORY_STYLES,
  resolveAppointmentCategory,
} from '../constants/calendarEventStyles'
import { parseDurationMinutes } from '../utils/calendarMetrics'

interface AppointmentCardProps {
  appointment: Appointment
}

function formatDurationLabel(timeHint?: string): string {
  const totalMinutes = parseDurationMinutes(timeHint)

  if (totalMinutes < 60) {
    return `${totalMinutes}m`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (minutes === 0) {
    return `${hours}h`
  }
  return `${hours}h${minutes.toString().padStart(2, '0')}m`
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const { time, name, category, prospectType, tier, hasTel, timeHint, noShow } = appointment
  const durationLabel = formatDurationLabel(timeHint)
  const appointmentCategory = resolveAppointmentCategory(category)
  const isClientMeeting = appointmentCategory === CLIENT_MEETING_CATEGORY
  const eventPalette = EVENT_CATEGORY_STYLES[appointmentCategory]
  const eventTitle = name.trim() || appointmentCategory

  return (
    <div
      className={`group relative rounded-lg px-2.5 py-2 border transition-all duration-200 cursor-pointer ${
        eventPalette.card
      } hover:shadow-md hover:-translate-y-0.5`}
      style={noShow ? { borderStyle: 'dashed', borderWidth: '1.5px', borderColor: 'rgb(239 68 68 / 0.5)' } : undefined}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-sm font-bold leading-tight ${eventPalette.cardTitle} ${noShow ? 'line-through' : ''}`}>
              {time}
            </span>
            {noShow ? (
              <Ban size={14} className={`shrink-0 ${eventPalette.cardTitle} opacity-60`} />
            ) : (
              <span className={`text-[11px] font-medium ${eventPalette.cardSubtitle}`}>
                {durationLabel}
              </span>
            )}
          </div>
          <p className={`text-[11px] mt-0.5 truncate font-medium ${eventPalette.cardSubtitle}`}>
            {eventTitle}
          </p>
          {isClientMeeting && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {hasTel && <TelBadge />}
              <ProspectBadge type={prospectType} />
              {tier && <TierBadge tier={tier} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
