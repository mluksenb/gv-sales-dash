import type { StoredConversation } from './types.ts'

/** Subcategory labels from the support taxonomy. */
export const TOPIC_SECURITY = 'Sécurité'

/** Breach / cyberattack wording in subject lines. */
const SUBJECT_INCIDENT =
  /incident de s[eé]curit[eé]|cyber\s*attaque|cyberattaque|fuite (de )?donn[eé]es?|faille de s[eé]curit[eé]|signalement anssi/i

/** Official Goodvest incident notification or reply thread markers. */
const TRANSCRIPT_CANNED_INCIDENT =
  /suite à (votre communication sur )?l.incident|information importante\s*:\s*incident|cyberattaque survenue|cyberattaque.*2 juin|données personnelles affectées|incident de sécurité sur vos données/i

/** Customer or agent mentions of the June 2026 breach / security incident. */
const TRANSCRIPT_BREACH_MENTION =
  /fuite (de )?donn[eé]es?|victime d['’]une (cyberattaque|fuite)|bonjourlafuite|bonjour la fuite|cyberattaque.*fuite|fuite.*cyberattaque|annonce (de la )?fuite|suite à la fuite|à la suite de l['’]annonce.*fuite|donn[eé]es (personnelles )?(affect|compromis|expos|copi|fuit|récupér)|pert[eé] de (mes )?donn[eé]es|notification.*incident|communication.*incident de s[eé]curit|cet incident|concerné.*fuite|risques liés à cette fuite|information-de-securite|information de s[eé]curit[eé]/i

/** Account changes explicitly motivated by the breach (not routine password/email updates). */
const TRANSCRIPT_INCIDENT_ACCOUNT_ACTION =
  /suite à .*(fuite|incident|cyberattaque).*(mot de passe|email|adresse mail|e-mail)|(?:mot de passe|email|adresse mail|e-mail).*(?:suite à|à la suite|car ).*(?:fuite|incident|cyberattaque)|(?:changer|modifi(?:er|cation)).*(?:mot de passe|email|adresse).*(?:fuite|incident)|(?:fuite|incident).*(?:changer|modifi(?:er|cation)).*(?:mot de passe|email|adresse)/i

const SUMMARY_INCIDENT =
  /incident de s[eé]curit[eé]|notification d.incident|suite à un incident de s[eé]curit|donn[eé]es personnelles.*compromis|informations personnelles.*compromis|transmission s[eé]curis[eé]e|fuite (de )?donn[eé]es?|cyberattaque|suite à (?:la |l['’])?(?:annonce|communication).*fuite|expos(?:é|ition).*fuite|suite à une fuite/i

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

/**
 * True when the conversation is a customer response to the June 2026
 * security-incident notification (cyberattack / data breach comms).
 */
export function isSecurityIncidentResponse(conversation: StoredConversation): boolean {
  const subject = conversation.subject ?? ''
  const transcript = conversation.transcript ?? ''
  const summary = conversation.issueSummary ?? ''

  if (SUBJECT_INCIDENT.test(subject)) {
    return true
  }

  if (
    TRANSCRIPT_CANNED_INCIDENT.test(transcript) ||
    TRANSCRIPT_BREACH_MENTION.test(transcript) ||
    TRANSCRIPT_INCIDENT_ACCOUNT_ACTION.test(transcript)
  ) {
    return true
  }

  if (matchesAny(summary, [SUMMARY_INCIDENT])) {
    return true
  }

  return false
}
