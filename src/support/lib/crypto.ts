/**
 * Password-based encryption for the dashboard data payload.
 *
 * Uses the Web Crypto API (available in browsers and Node >= 20), so the same
 * code encrypts at build time and decrypts in the browser:
 *   - key derivation: PBKDF2-HMAC-SHA256 with a random salt
 *   - cipher:         AES-256-GCM with a random IV (authenticated)
 *
 * The password never leaves the browser and is never stored in the payload.
 * Without it, the ciphertext is unusable even if the URL/file is shared.
 */

/** PBKDF2 work factor. Higher = slower brute force, slightly slower unlock. */
const PBKDF2_ITERATIONS = 600_000
const KEY_LENGTH_BITS = 256
const SALT_BYTES = 16
const IV_BYTES = 12

export interface EncryptedPayload {
  v: 1
  alg: 'AES-GCM'
  kdf: 'PBKDF2'
  hash: 'SHA-256'
  iterations: number
  /** base64-encoded PBKDF2 salt */
  salt: string
  /** base64-encoded AES-GCM IV */
  iv: string
  /** base64-encoded ciphertext (includes the GCM auth tag) */
  ct: string
}

function utf8(value: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(value) as Uint8Array<ArrayBuffer>
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    utf8(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Encrypts any JSON-serializable value with a password. */
export async function encryptJson(password: string, data: unknown): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS)
  const plaintext = utf8(JSON.stringify(data))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)

  return {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2',
    hash: 'SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ciphertext)),
  }
}

/** Thrown when the password is wrong (or the payload was tampered with). */
export class DecryptionError extends Error {
  constructor() {
    super('Decryption failed')
    this.name = 'DecryptionError'
  }
}

/** Decrypts a payload produced by {@link encryptJson}. */
export async function decryptJson<T>(password: string, payload: EncryptedPayload): Promise<T> {
  const salt = fromBase64(payload.salt)
  const iv = fromBase64(payload.iv)
  const key = await deriveKey(password, salt, payload.iterations)

  let plaintext: ArrayBuffer
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      fromBase64(payload.ct),
    )
  } catch {
    // AES-GCM auth tag mismatch -> wrong password or corrupted data.
    throw new DecryptionError()
  }

  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}
