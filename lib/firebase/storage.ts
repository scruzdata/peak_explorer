// Funciones para gestionar archivos en Firebase Storage
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, StorageReference } from 'firebase/storage'
import { initializeApp, getApps } from 'firebase/app'

// Inicializar Firebase Storage
function getFirebaseStorage() {
  // Obtener la app de Firebase (debe estar inicializada en config.ts)
  const apps = getApps()
  if (apps.length === 0) {
    throw new Error('Firebase no está inicializado. Asegúrate de que lib/firebase/config.ts esté configurado.')
  }
  
  const storage = getStorage(apps[0])
  return storage
}

/**
 * Intenta extraer el path interno de Firebase Storage a partir de una URL pública
 * generada por `getPublicStorageURL`.
 * Devuelve null si la URL no pertenece a este bucket o no tiene el formato esperado.
 */
function extractStoragePathFromPublicURL(url: string): string | null {
  try {
    const storage = getFirebaseStorage()
    const bucket = storage.app.options.storageBucket
    if (!bucket) return null

    const parsed = new URL(url)

    // Solo manejamos URLs del dominio oficial de Firebase Storage
    if (!parsed.hostname.includes('firebasestorage.googleapis.com')) {
      return null
    }

    const marker = `/v0/b/${bucket}/o/`
    const markerIndex = parsed.pathname.indexOf(marker)
    if (markerIndex === -1) {
      return null
    }

    // Obtener la parte codificada después de `/o/`
    const encodedPath = parsed.pathname.substring(markerIndex + marker.length)
    if (!encodedPath) return null

    // Revertir la codificación que hicimos en getPublicStorageURL
    const pathSegments = encodedPath.split('%2F').map(segment => decodeURIComponent(segment))
    const fullPath = pathSegments.join('/')

    return fullPath
  } catch (error) {
    console.error('Error extrayendo storage path desde URL:', error)
    return null
  }
}

/**
 * Genera una URL pública sin tokens para una imagen en Firebase Storage
 * @param path Ruta completa del archivo en Storage (ej: "Blog/blog-123.jpg")
 * @returns URL pública sin tokens
 */
function getPublicStorageURL(path: string): string {
  const storage = getFirebaseStorage()
  const bucket = storage.app.options.storageBucket
  
  if (!bucket) {
    throw new Error('Storage bucket no configurado')
  }
  
  // Codificar el path: cada segmento debe codificarse, pero las barras se mantienen como %2F
  // Dividir por /, codificar cada parte, y unir con %2F
  const pathSegments = path.split('/')
  const encodedPath = pathSegments.map(segment => encodeURIComponent(segment)).join('%2F')
  
  // Construir URL pública sin tokens
  // Formato: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`
}

/**
 * Sube una imagen a Firebase Storage en la carpeta "Blog"
 * @param file Archivo de imagen a subir
 * @param filename Nombre del archivo (opcional, se genera automáticamente si no se proporciona)
 * @param blogFolderName Nombre de la subcarpeta dentro de Blog (slug o ID del blog). Si no se proporciona, se guarda directamente en Blog
 * @returns URL de descarga de la imagen
 */
export async function uploadBlogImage(
  file: File,
  filename?: string,
  blogFolderName?: string
): Promise<{ url: string; path: string }> {
  try {
    const storage = getFirebaseStorage()
    
    // Generar nombre único si no se proporciona
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const finalFilename = filename || `blog-${timestamp}-${randomString}.${fileExtension}`
    
    // Crear referencia en la carpeta "Blog" o en "Blog/{blogFolderName}"
    // Firebase Storage crea automáticamente las carpetas al subir archivos
    const storagePath = blogFolderName 
      ? `Blog/${blogFolderName}/${finalFilename}`
      : `Blog/${finalFilename}`
    const storageRef = ref(storage, storagePath)
    
    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file)
    
    // Generar URL pública sin tokens (las imágenes son públicas según las reglas)
    const publicURL = getPublicStorageURL(snapshot.ref.fullPath)
    
    return {
      url: publicURL,
      path: snapshot.ref.fullPath,
    }
  } catch (error) {
    console.error('Error subiendo imagen de blog:', error)
    throw error
  }
}

/**
 * Elimina una imagen de Firebase Storage
 * @param path Ruta completa del archivo en Storage (ej: "Blog/blog-123.jpg")
 */
export async function deleteBlogImage(path: string): Promise<void> {
  try {
    const storage = getFirebaseStorage()
    const imageRef = ref(storage, path)
    await deleteObject(imageRef)
  } catch (error) {
    console.error('Error eliminando imagen de blog:', error)
    throw error
  }
}

/**
 * Obtiene la URL pública de una imagen desde su path (sin tokens)
 * @param path Ruta completa del archivo en Storage
 */
export async function getBlogImageURL(path: string): Promise<string> {
  try {
    // Usar URL pública sin tokens
    return getPublicStorageURL(path)
  } catch (error) {
    console.error('Error obteniendo URL de imagen:', error)
    throw error
  }
}

/**
 * Sube una imagen a Firebase Storage en la carpeta "Rutas"
 * @param file Archivo de imagen a subir
 * @param routeFolderName Nombre de la subcarpeta dentro de Rutas (slug o ID de la ruta). Si no se proporciona, se guarda directamente en Rutas
 * @param filename Nombre del archivo (opcional, se genera automáticamente si no se proporciona)
 * @returns URL de descarga de la imagen
 */
export async function uploadRouteImage(
  file: File,
  routeFolderName?: string,
  filename?: string
): Promise<{ url: string; path: string }> {
  try {
    const storage = getFirebaseStorage()
    
    // Generar nombre único si no se proporciona
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const finalFilename = filename || `route-${timestamp}-${randomString}.${fileExtension}`
    
    // Crear referencia en la carpeta "Rutas" o en "Rutas/{routeFolderName}"
    // Firebase Storage crea automáticamente las carpetas al subir archivos
    const storagePath = routeFolderName 
      ? `Rutas/${routeFolderName}/${finalFilename}`
      : `Rutas/${finalFilename}`
    const storageRef = ref(storage, storagePath)
    
    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file)
    
    // Generar URL pública sin tokens (las imágenes son públicas según las reglas)
    const publicURL = getPublicStorageURL(snapshot.ref.fullPath)
    
    return {
      url: publicURL,
      path: snapshot.ref.fullPath,
    }
  } catch (error) {
    console.error('Error subiendo imagen de ruta:', error)
    throw error
  }
}

/**
 * Sube una imagen a Firebase Storage en la carpeta "Vias_ferratas"
 * @param file Archivo de imagen a subir
 * @param ferrataFolderName Nombre de la subcarpeta dentro de Vias_ferratas (slug o ID de la vía ferrata). Si no se proporciona, se guarda directamente en Vias_ferratas
 * @param filename Nombre del archivo (opcional, se genera automáticamente si no se proporciona)
 * @returns URL de descarga de la imagen
 */
export async function uploadFerrataImage(
  file: File,
  ferrataFolderName?: string,
  filename?: string
): Promise<{ url: string; path: string }> {
  try {
    const storage = getFirebaseStorage()
    
    // Generar nombre único si no se proporciona
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const finalFilename = filename || `ferrata-${timestamp}-${randomString}.${fileExtension}`
    
    // Crear referencia en la carpeta "Vias_ferratas" o en "Vias_ferratas/{ferrataFolderName}"
    // Firebase Storage crea automáticamente las carpetas al subir archivos
    const storagePath = ferrataFolderName 
      ? `Vias_ferratas/${ferrataFolderName}/${finalFilename}`
      : `Vias_ferratas/${finalFilename}`
    const storageRef = ref(storage, storagePath)
    
    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file)
    
    // Generar URL pública sin tokens (las imágenes son públicas según las reglas)
    const publicURL = getPublicStorageURL(snapshot.ref.fullPath)
    
    return {
      url: publicURL,
      path: snapshot.ref.fullPath,
    }
  } catch (error) {
    console.error('Error subiendo imagen de vía ferrata:', error)
    throw error
  }
}

/**
 * Elimina cualquier archivo de Firebase Storage a partir de su URL pública
 * (solo funciona con URLs generadas por getPublicStorageURL de este mismo bucket).
 */
export async function deleteStorageFileByUrl(url: string): Promise<void> {
  try {
    const storagePath = extractStoragePathFromPublicURL(url)
    if (!storagePath) {
      // URL externa o no compatible, no hacemos nada
      return
    }

    const storage = getFirebaseStorage()
    const fileRef = ref(storage, storagePath)
    await deleteObject(fileRef)
  } catch (error) {
    console.error('Error eliminando archivo de Storage por URL:', error)
    throw error
  }
}
