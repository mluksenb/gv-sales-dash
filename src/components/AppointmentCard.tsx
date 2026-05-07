import type { Appointment } from '../types'
import { ProspectBadge, TierBadge, TelBadge } from './Badge'
import {
  CLIENT_MEETING_CATEGORY,
  EVENT_CATEGORY_STYLES,
  resolveAppointmentCategory,
} from '../constants/calendarEventStyles'

interface AppointmentCardProps {
  appointment: Appointment
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const { time, name, category, prospectType, tier, hasTel, timeHint } = appointment
  const durationLabel = timeHint ?? '30 min'
  const appointmentCategory = resolveAppointmentCategory(category)
  const isClientMeeting = appointmentCategory === CLIENT_MEETING_CATEGORY
  const eventPalette = EVENT_CATEGORY_STYLES[appointmentCategory]
  const eventTitle = isClientMeeting ? name : appointmentCategory

  return (
    <div
      className={`group relative rounded-lg px-2.5 py-2 border transition-all duration-200 cursor-pointer ${
        eventPalette.card
      } hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-sm font-bold leading-tight ${eventPalette.cardTitle}`}>
              {time}
            </span>
            <span className={`text-[11px] font-medium ${eventPalette.cardSubtitle}`}>
              {durationLabel}
            </span>
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
