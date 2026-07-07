import type { PrecheckFile } from '../../../api/_lib/kyc'

export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const ACCEPT_ATTRIBUTE = '.pdf,.jpg,.jpeg,.png'

/** Limite affichée au client, alignée sur l'onboarding. */
const MAX_FILE_SIZE = 5 * 1024 * 1024
/** Au-delà, une image est recompressée côté client (limite de 4,5 Mo par requête sur les fonctions Vercel). */
const IMAGE_COMPRESSION_THRESHOLD = 2.5 * 1024 * 1024
/** Un PDF ne peut pas être recompressé côté client : plafond plus strict. */
const MAX_PDF_SIZE = 3.2 * 1024 * 1024

export class FileValidationError extends Error {}

function readAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier impossible'))
    reader.readAsDataURL(blob)
  })
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const maxDim = 2200
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new FileValidationError("Compression de l'image impossible dans ce navigateur.")
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) throw new FileValidationError("Compression de l'image impossible dans ce navigateur.")
  return blob
}

/**
 * Valide un fichier déposé et le prépare pour l'API (base64, avec
 * recompression des grosses images pour rester sous la limite de requête).
 */
export async function prepareFile(file: File): Promise<PrecheckFile> {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    throw new FileValidationError(`Format non accepté (${file.type || 'inconnu'}). Formats acceptés : PDF, JPG et PNG.`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError('Fichier trop volumineux : 5 Mo maximum.')
  }
  if (file.type === 'application/pdf' && file.size > MAX_PDF_SIZE) {
    throw new FileValidationError('PDF trop volumineux pour le pré-contrôle (3 Mo maximum pour ce POC).')
  }

  let blob: Blob = file
  let mimeType = file.type
  if (file.type.startsWith('image/') && file.size > IMAGE_COMPRESSION_THRESHOLD) {
    blob = await compressImage(file)
    mimeType = 'image/jpeg'
  }

  return { name: file.name, mimeType, dataBase64: await readAsBase64(blob) }
}
