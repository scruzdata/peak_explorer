// Utilidades de optimización de imágenes en el navegador usando <canvas>
// No depende de librerías de Node ni de Cloud Functions.

export interface OptimizedImageVariant {
  width: number
  height: number
  blob: Blob
  filenameSuffix: string // Ej: "400", "800", "1600"
}

export interface OptimizedImageResult {
  originalWidth: number
  originalHeight: number
  aspectRatio: number
  variants: OptimizedImageVariant[]
}

/**
 * Carga una imagen en memoria a partir de un File usando APIs del navegador.
 */
async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (err) => reject(err)
      img.src = reader.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

/**
 * Convierte el contenido de un canvas a Blob WebP con la calidad indicada.
 */
async function canvasToWebPBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo generar Blob WebP desde el canvas'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      quality
    )
  })
}

/**
 * Genera versiones optimizadas de una imagen:
 *  - Manteniendo proporción
 *  - En formato WebP
 *  - Sin hacer upscale (no se generan tamaños mayores que el original)
 */
export async function generateOptimizedImagesInBrowser(
  file: File,
  targetWidths: number[] = [400, 800, 1600],
  quality: number = 0.8
): Promise<OptimizedImageResult> {
  if (typeof window === 'undefined') {
    throw new Error('generateOptimizedImagesInBrowser solo puede ejecutarse en el navegador')
  }

  const img = await loadImageFromFile(file)
  const originalWidth = img.naturalWidth || img.width
  const originalHeight = img.naturalHeight || img.height

  if (!originalWidth || !originalHeight) {
    throw new Error('No se pudieron obtener las dimensiones de la imagen')
  }

  const aspectRatio = originalWidth / originalHeight

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del canvas')
  }

  const uniqueWidths = Array.from(
    new Set(
      targetWidths
        .map((w) => Math.min(w, originalWidth))
        .filter((w) => w > 0)
    )
  ).sort((a, b) => a - b)

  const variants: OptimizedImageVariant[] = []

  for (const width of uniqueWidths) {
    const scale = width / originalWidth
    const targetWidth = Math.round(originalWidth * scale)
    const targetHeight = Math.round(originalHeight * scale)

    canvas.width = targetWidth
    canvas.height = targetHeight

    ctx.clearRect(0, 0, targetWidth, targetHeight)
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

    const blob = await canvasToWebPBlob(canvas, quality)

    variants.push({
      width: targetWidth,
      height: targetHeight,
      blob,
      filenameSuffix: String(width),
    })
  }

  return {
    originalWidth,
    originalHeight,
    aspectRatio,
    variants,
  }
}

