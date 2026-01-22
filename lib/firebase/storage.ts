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
 * Sube una imagen a Firebase Storage en la carpeta "Blog"
 * @param file Archivo de imagen a subir
 * @param filename Nombre del archivo (opcional, se genera automáticamente si no se proporciona)
 * @returns URL de descarga de la imagen
 */
export async function uploadBlogImage(
  file: File,
  filename?: string
): Promise<{ url: string; path: string }> {
  try {
    const storage = getFirebaseStorage()
    
    // Generar nombre único si no se proporciona
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const finalFilename = filename || `blog-${timestamp}-${randomString}.${fileExtension}`
    
    // Crear referencia en la carpeta "Blog"
    const storageRef = ref(storage, `Blog/${finalFilename}`)
    
    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file)
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return {
      url: downloadURL,
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
 * Obtiene la URL de descarga de una imagen desde su path
 * @param path Ruta completa del archivo en Storage
 */
export async function getBlogImageURL(path: string): Promise<string> {
  try {
    const storage = getFirebaseStorage()
    const imageRef = ref(storage, path)
    return await getDownloadURL(imageRef)
  } catch (error) {
    console.error('Error obteniendo URL de imagen:', error)
    throw error
  }
}
