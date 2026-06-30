export type ProfileTab = 'informations' | 'opportunites' | 'projets' | 'timeline'

export const PROFILE_TAB_PARAM = 'tab'
export const DEFAULT_PROFILE_TAB: ProfileTab = 'informations'

export function getProfileTabFromUrl(search: string): ProfileTab {
  const tab = new URLSearchParams(search).get(PROFILE_TAB_PARAM)
  if (tab === 'informations' || tab === 'projets' || tab === 'opportunites' || tab === 'timeline') {
    return tab
  }
  return DEFAULT_PROFILE_TAB
}

export function profileUrl(tab: ProfileTab): string {
  return `/profile?${PROFILE_TAB_PARAM}=${tab}`
}
