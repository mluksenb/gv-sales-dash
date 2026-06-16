import { useCallback, useEffect, useRef, useState } from 'react'
import type { DashboardData } from '../types'
import { DecryptionError, decryptJson, type EncryptedPayload } from './crypto'

/**
 * sessionStorage (not localStorage) so the password survives a page refresh
 * within the same tab but is dropped when the tab/browser closes.
 */
const PASSWORD_STORAGE_KEY = 'support-insights-password'

export type DataStatus = 'loading' | 'locked' | 'unlocking' | 'ready' | 'error'

export interface DataController {
  status: DataStatus
  data: DashboardData | null
  /** Fatal error fetching the encrypted payload (not a wrong password). */
  error: string | null
  /** Set when the last unlock attempt used an incorrect password. */
  attemptError: string | null
  unlock: (password: string) => void
  lock: () => void
}

export function useDashboardData(): DataController {
  const [status, setStatus] = useState<DataStatus>('loading')
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attemptError, setAttemptError] = useState<string | null>(null)

  const payloadRef = useRef<EncryptedPayload | null>(null)

  const tryDecrypt = useCallback(async (password: string, persist: boolean) => {
    const payload = payloadRef.current
    if (!payload) return
    setStatus('unlocking')
    setAttemptError(null)
    try {
      const decrypted = await decryptJson<DashboardData>(password, payload)
      if (persist) sessionStorage.setItem(PASSWORD_STORAGE_KEY, password)
      setData(decrypted)
      setStatus('ready')
    } catch (err) {
      sessionStorage.removeItem(PASSWORD_STORAGE_KEY)
      setStatus('locked')
      setAttemptError(
        err instanceof DecryptionError
          ? 'Mot de passe incorrect.'
          : 'Impossible de déchiffrer les données.',
      )
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPlaintext(): Promise<DashboardData | null> {
      if (!import.meta.env.DEV) return null
      const url = `${import.meta.env.BASE_URL}support-data.json`
      try {
        const res = await fetch(url)
        if (!res.ok) return null
        return (await res.json()) as DashboardData
      } catch {
        return null
      }
    }

    async function loadEncrypted(): Promise<void> {
      const url = `${import.meta.env.BASE_URL}support-data.enc.json`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = (await res.json()) as EncryptedPayload
      if (cancelled) return
      payloadRef.current = payload
      const saved = sessionStorage.getItem(PASSWORD_STORAGE_KEY)
      if (saved) {
        void tryDecrypt(saved, true)
      } else {
        setStatus('locked')
      }
    }

    void (async () => {
      try {
        const plaintext = await loadPlaintext()
        if (cancelled) return
        if (plaintext) {
          setData(plaintext)
          setStatus('ready')
          return
        }
        await loadEncrypted()
      } catch (err: unknown) {
        if (cancelled) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tryDecrypt])

  const unlock = useCallback(
    (password: string) => {
      void tryDecrypt(password, true)
    },
    [tryDecrypt],
  )

  const lock = useCallback(() => {
    sessionStorage.removeItem(PASSWORD_STORAGE_KEY)
    setData(null)
    setAttemptError(null)
    setStatus('locked')
  }, [])

  return { status, data, error, attemptError, unlock, lock }
}
