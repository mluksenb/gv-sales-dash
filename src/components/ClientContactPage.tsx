import { useEffect, useId, useRef, useState } from 'react'
import {
  ArrowLeft,
  BanknoteArrowDown,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Mail,
  MessageCircle,
  MessageSquareWarning,
  MoreHorizontal,
  PencilLine,
  PiggyBank,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SetPageFn } from '../App'

interface ClientContactPageProps {
  setPage: SetPageFn
}

const BRAND_TEAL = '#00665C'

const ADVISOR = {
  name: 'Marvin Luksenberg',
  photo: '/advisor-marvin.png',
}

type ContactStep = 'main' | 'more' | 'channel'

interface RequestOption {
  id: string
  title: string
  description?: string
  icon: LucideIcon
}

const MAIN_OPTIONS: RequestOption[] = [
  {
    id: 'projet',
    title: "Nouveau projet d'épargne ou d'investissement",
    description:
      "J'aimerais me renseigner sur les différents produits que propose Goodvest (Assurance vie, PER, livret ...)",
    icon: PiggyBank,
  },
  {
    id: 'versement',
    title: 'Réaliser un versement',
    description: "J'aimerais créditer mon contrat",
    icon: Wallet,
  },
  {
    id: 'modification',
    title: 'Modifier une information sur mon compte ou mon contrat',
    description: 'Adresse e-mail ou postale, numéro de téléphone, bénéficiaires ...',
    icon: PencilLine,
  },
  {
    id: 'plus',
    title: "Plus d'options",
    icon: MoreHorizontal,
  },
]

const MORE_OPTIONS: RequestOption[] = [
  {
    id: 'retrait',
    title: 'Effectuer un retrait',
    description: "J'aimerais réaliser un retrait partiel ou total depuis l'un de mes contrats.",
    icon: BanknoteArrowDown,
  },
  {
    id: 'reclamation',
    title: 'Transmettre une réclamation',
    description: "J'aimerais vous faire part de mon insatisfaction.",
    icon: MessageSquareWarning,
  },
  {
    id: 'autre',
    title: 'Autre chose',
    description: "Ma demande porte sur un sujet non mentionné jusqu'ici.",
    icon: CircleHelp,
  },
]

const CHANNEL_OPTIONS: RequestOption[] = [
  {
    id: 'chat',
    title: 'Écrire par chat',
    description: 'Discutez avec nous en direct depuis votre espace client.',
    icon: MessageCircle,
  },
  {
    id: 'email',
    title: 'Envoyer un e-mail',
    description: 'Écrivez-nous, réponse sous 24h (jours ouvrés).',
    icon: Mail,
  },
  {
    id: 'rdv',
    title: 'Prendre rendez-vous',
    description: 'Discutez en visio ou par téléphone avec votre conseiller.',
    icon: Calendar,
  },
]

/** Channel ids available per request topic, always rendered in CHANNEL_OPTIONS order. */
const CHANNELS_BY_REQUEST: Record<string, string[]> = {
  projet: ['rdv'],
  versement: ['email', 'rdv'],
  modification: ['rdv'],
  retrait: ['rdv'],
  reclamation: ['email', 'rdv'],
  autre: ['chat'],
}

function RequestOptionCard({
  option,
  onSelect,
}: {
  option: RequestOption
  onSelect: () => void
}) {
  const isCompact = !option.description
  const Icon = option.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3.5 text-left transition-all hover:border-[#00665C]/35 hover:bg-[#00665C]/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00665C]/25 ${
        isCompact ? 'items-center' : 'items-start'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
          isCompact ? '' : 'mt-0.5'
        }`}
        style={{ backgroundColor: BRAND_TEAL }}
      >
        <Icon size={17} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold leading-snug text-[#2c2c2c]">{option.title}</div>
        {option.description ? (
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#8a8a8a]">{option.description}</p>
        ) : null}
      </div>
      <ChevronRight
        size={16}
        className={`shrink-0 text-gray-300 transition-colors group-hover:text-[#00665C] ${
          isCompact ? '' : 'mt-1'
        }`}
      />
    </button>
  )
}

function ChannelStep({
  selectedOption,
  onSelectChannel,
}: {
  selectedOption: RequestOption
  onSelectChannel: () => void
}) {
  const SelectedIcon = selectedOption.icon
  const allowedIds = new Set(CHANNELS_BY_REQUEST[selectedOption.id] ?? ['chat', 'email', 'rdv'])
  const channels = CHANNEL_OPTIONS.filter((option) => allowedIds.has(option.id))

  return (
    <>
      <div className="rounded-xl border border-[#016F6C] bg-[#016F6C] px-3.5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
          Objet sélectionné
        </p>
        <div className="mt-2 flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
            <SelectedIcon size={15} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-snug text-white">
              {selectedOption.title}
            </p>
            {selectedOption.description ? (
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/75">
                {selectedOption.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <h2 className="mt-5 text-[17px] font-semibold tracking-tight text-[#2c2c2c]">
        Comment souhaitez-vous nous contacter&nbsp;?
      </h2>

      <div className="mt-4 flex flex-col gap-2.5">
        {channels.map((option) => (
          <RequestOptionCard key={option.id} option={option} onSelect={onSelectChannel} />
        ))}
      </div>
    </>
  )
}

export function ClientContactPage({ setPage }: ClientContactPageProps) {
  const [contactOpen, setContactOpen] = useState(false)
  const [step, setStep] = useState<ContactStep>('main')
  const [selectedOption, setSelectedOption] = useState<RequestOption | null>(null)
  const [channelReturnStep, setChannelReturnStep] = useState<'main' | 'more'>('main')
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const openContact = () => {
    setStep('main')
    setSelectedOption(null)
    setChannelReturnStep('main')
    setContactOpen(true)
  }

  const closeContact = () => {
    setContactOpen(false)
    setStep('main')
    setSelectedOption(null)
    setChannelReturnStep('main')
  }

  const goBack = () => {
    if (step === 'channel') {
      setStep(channelReturnStep)
      setSelectedOption(null)
      return
    }
    if (step === 'more') {
      setStep('main')
    }
  }

  useEffect(() => {
    if (!contactOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (step === 'channel' || step === 'more') goBack()
      else closeContact()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contactOpen, step, channelReturnStep])

  const selectRequestOption = (option: RequestOption, from: 'main' | 'more') => {
    if (option.id === 'plus') {
      setStep('more')
      return
    }
    setSelectedOption(option)
    setChannelReturnStep(from)
    setStep('channel')
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex w-full items-center gap-4 px-6 py-5 md:px-10">
          <button
            type="button"
            onClick={() => setPage('home')}
            aria-label="Retour à l'accueil"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft size={18} />
          </button>

          <header className="flex min-w-0 flex-1 items-center justify-between gap-6">
            <div className="min-w-0 shrink">
              <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#2c2c2c]">
                Bonjour Albane
              </h1>
              <p className="mt-1 truncate text-sm leading-snug text-[#8a8a8a]">
                Retrouvez ici toutes les informations sur vos investissements.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 md:gap-5">
              <button
                type="button"
                onClick={openContact}
                aria-haspopup="dialog"
                aria-expanded={contactOpen}
                className="flex items-center gap-3 rounded-lg py-1 pr-1 text-left transition-colors hover:bg-gray-50"
              >
                <img
                  src="/advisors.png?v=2"
                  alt=""
                  className="h-11 w-auto shrink-0"
                />
                <div className="min-w-0">
                  <div className="whitespace-nowrap text-sm font-medium leading-tight text-[#2c2c2c]">
                    Contactez votre conseiller
                  </div>
                  <div className="mt-0.5 whitespace-nowrap text-xs leading-tight text-[#8a8a8a]">
                    Envoyer un message ou prendre rendez-vous
                  </div>
                </div>
                <ChevronDown size={16} className="shrink-0 text-[#9a9a9a]" />
              </button>

              <button
                type="button"
                className="shrink-0 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: BRAND_TEAL }}
              >
                Effectuer un versement
              </button>
            </div>
          </header>
        </div>
      </div>

      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-black/40"
            onClick={closeContact}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-[540px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <p id={titleId} className="text-sm font-medium text-[#8a8a8a]">
                  Votre conseiller :
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={ADVISOR.photo}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <p className="text-base font-semibold text-[#2c2c2c]">{ADVISOR.name}</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeContact}
                aria-label="Fermer la fenêtre"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5">
              {(step === 'more' || step === 'channel') && (
                <button
                  type="button"
                  onClick={goBack}
                  className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#00665C] transition-opacity hover:opacity-80"
                >
                  <ArrowLeft size={15} />
                  Retour
                </button>
              )}

              {step === 'channel' && selectedOption ? (
                <ChannelStep
                  selectedOption={selectedOption}
                  onSelectChannel={closeContact}
                />
              ) : (
                <>
                  <h2 className="text-[17px] font-semibold tracking-tight text-[#2c2c2c]">
                    Quel est l&apos;objet de votre demande&nbsp;?
                  </h2>

                  <div className="mt-4 flex flex-col gap-2.5">
                    {(step === 'more' ? MORE_OPTIONS : MAIN_OPTIONS).map((option) => (
                      <RequestOptionCard
                        key={option.id}
                        option={option}
                        onSelect={() =>
                          selectRequestOption(option, step === 'more' ? 'more' : 'main')
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
