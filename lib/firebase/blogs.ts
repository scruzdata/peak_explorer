// Funciones para gestionar blogs en Firestore
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'
import { BlogPost, BlogStatus } from '@/types'
import { generateSlug } from '@/lib/utils'

const BLOGS_COLLECTION = 'blogs'

/**
 * Convierte un documento de Firestore a BlogPost
 */
function firestoreToBlogPost(docData: any, id: string): BlogPost {
  const data = docData.data()
  
  // Convertir timestamps de Firestore a strings ISO
  const createdAt = data.createdAt?.toDate?.()?.toISOString() || 
                    (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString())
  const updatedAt = data.updatedAt?.toDate?.()?.toISOString() || 
                    (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString())
  const publishedAt = data.publishedAt?.toDate?.()?.toISOString() || 
                      (typeof data.publishedAt === 'string' ? data.publishedAt : undefined)
  
  // Asegurar que todos los campos requeridos estén presentes
  const blogPost: BlogPost = {
    id,
    slug: data.slug || generateSlug(data.title || 'sin-titulo'),
    title: data.title || 'Sin título',
    excerpt: data.excerpt || '',
    content: data.content || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    status: data.status || 'draft',
    featuredImage: data.featuredImage && typeof data.featuredImage === 'object' && data.featuredImage.url 
      ? {
          url: data.featuredImage.url,
          alt: data.featuredImage.alt || '',
          width: data.featuredImage.width || 1200,
          height: data.featuredImage.height || 800,
          lqip: data.featuredImage.lqip,
          source: data.featuredImage.source,
        }
      : undefined,
    images: Array.isArray(data.images) ? data.images : undefined,
    author: data.author || { name: 'Peak Explorer' },
    seo: data.seo || {
      metaTitle: data.title || '',
      metaDescription: data.excerpt || '',
      keywords: [],
    },
    createdAt,
    updatedAt,
    publishedAt,
    views: data.views || 0,
    readingTime: data.readingTime || undefined,
  }
  
  return blogPost
}

/**
 * Elimina campos undefined de un objeto (Firestore no acepta undefined)
 * Pero preserva objetos que tienen algunos campos undefined (como ImageData con campos opcionales)
 */
function removeUndefinedFields(obj: any, depth = 0): any {
  if (depth > 10) {
    return null
  }
  
  if (obj === null) {
    return null
  }
  
  if (obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item, depth + 1)).filter(item => item !== undefined)
  }
  
  if (obj instanceof Date) {
    return Timestamp.fromDate(obj)
  }
  
  if (typeof obj !== 'object') {
    if (typeof obj === 'function' || typeof obj === 'symbol') {
      return null
    }
    return obj
  }
  
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Si el valor es undefined, omitirlo completamente
    if (value === undefined) {
      continue
    }
    
    // Si es un objeto que parece ser ImageData (tiene url, alt, width, height), preservarlo aunque tenga campos opcionales undefined
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      const imageObj = value as any
      // Si tiene estructura de ImageData, limpiar solo los campos undefined dentro de él
      if (imageObj.url && imageObj.alt !== undefined && imageObj.width !== undefined && imageObj.height !== undefined) {
        const cleanedImage: any = {
          url: imageObj.url,
          alt: imageObj.alt,
          width: imageObj.width,
          height: imageObj.height,
        }
        // Añadir campos opcionales solo si existen
        if (imageObj.lqip !== undefined) cleanedImage.lqip = imageObj.lqip
        if (imageObj.source !== undefined) cleanedImage.source = imageObj.source
        cleaned[key] = cleanedImage
        continue
      }
    }
    
    const cleanedValue = removeUndefinedFields(value, depth + 1)
    if (cleanedValue !== undefined && cleanedValue !== null) {
      cleaned[key] = cleanedValue
    }
  }
  
  return cleaned
}

/**
 * Convierte un BlogPost a formato Firestore
 */
function blogPostToFirestore(blog: Omit<BlogPost, 'id' | 'slug' | 'createdAt' | 'updatedAt'>): any {
  const now = Timestamp.now()
  const blogData = {
    ...blog,
    createdAt: now,
    updatedAt: now,
  }
  
  // Si se publica, establecer publishedAt
  if (blog.status === 'published' && !blog.publishedAt) {
    blogData.publishedAt = now
  }
  
  return removeUndefinedFields(blogData)
}

/**
 * Obtiene todos los blogs desde Firestore (solo publicados para uso público)
 */
export async function getAllBlogsFromFirestore(includeDrafts = false): Promise<BlogPost[]> {
  try {
    const blogsRef = collection(db, BLOGS_COLLECTION)
    
    const constraints: QueryConstraint[] = []
    
    // Si no se incluyen borradores, filtrar solo publicados
    if (!includeDrafts) {
      constraints.push(where('status', '==', 'published'))
    }
    
    // Intentar ordenar, pero si falla (falta índice), obtener sin ordenar
    let querySnapshot
    try {
      if (!includeDrafts) {
        // Para blogs publicados, intentar ordenar por publishedAt
        try {
          const q = query(blogsRef, ...constraints, orderBy('publishedAt', 'desc'))
          querySnapshot = await getDocs(q)
        } catch (orderError: any) {
          // Si falla por falta de índice compuesto, intentar sin ordenar o por createdAt
          console.warn('⚠️ No se pudo ordenar por publishedAt, intentando sin ordenar:', orderError.message)
          const q = query(blogsRef, ...constraints)
          querySnapshot = await getDocs(q)
        }
      } else {
        // Si se incluyen borradores, ordenar por createdAt
        try {
          const q = query(blogsRef, ...constraints, orderBy('createdAt', 'desc'))
          querySnapshot = await getDocs(q)
        } catch (orderError: any) {
          console.warn('⚠️ No se pudo ordenar por createdAt, obteniendo sin ordenar:', orderError.message)
          const q = query(blogsRef, ...constraints)
          querySnapshot = await getDocs(q)
        }
      }
    } catch (queryError: any) {
      console.error('❌ Error ejecutando query:', queryError)
      // Si falla completamente, intentar obtener todos sin filtros
      if (!includeDrafts) {
        console.warn('⚠️ Intentando obtener todos los blogs y filtrar manualmente...')
        querySnapshot = await getDocs(blogsRef)
      } else {
        throw queryError
      }
    }
    
    console.log(`📊 Query ejecutada. Documentos encontrados: ${querySnapshot.docs.length}`)
    
    // Ordenar manualmente si hay problemas con el ordenamiento de Firestore
    const blogs = querySnapshot.docs.map((doc: any) => {
      try {
        const blog = firestoreToBlogPost(doc, doc.id)
        console.log(`✅ Blog convertido: ${blog.id} - ${blog.title} (${blog.status})`)
        return blog
      } catch (error) {
        console.error(`❌ Error convirtiendo blog ${doc.id}:`, error)
        console.error('Datos del documento:', doc.data())
        throw error
      }
    })
    
    // Si no se incluyen borradores pero obtuvimos todos, filtrar manualmente
    let filteredBlogs = blogs
    if (!includeDrafts) {
      filteredBlogs = blogs.filter((blog: BlogPost) => blog.status === 'published')
      console.log(`🔍 Blogs filtrados (solo publicados): ${filteredBlogs.length} de ${blogs.length}`)
    }
    
    // Ordenar manualmente: publicados primero por publishedAt, luego borradores por createdAt
    const sortedBlogs = filteredBlogs.sort((a: BlogPost, b: BlogPost) => {
      if (a.status === 'published' && b.status === 'published') {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        return bDate - aDate
      }
      if (a.status === 'published' && b.status === 'draft') return -1
      if (a.status === 'draft' && b.status === 'published') return 1
      // Ambos son borradores, ordenar por createdAt
      const aDate = new Date(a.createdAt).getTime()
      const bDate = new Date(b.createdAt).getTime()
      return bDate - aDate
    })
    
    console.log(`✅ Total blogs retornados: ${sortedBlogs.length}`)
    return sortedBlogs
  } catch (error) {
    console.error('❌ Error obteniendo blogs desde Firestore:', error)
    return []
  }
}

/**
 * Obtiene un blog por slug desde Firestore
 */
export async function getBlogBySlugFromFirestore(
  slug: string,
  includeDrafts = false
): Promise<BlogPost | null> {
  try {
    const blogsRef = collection(db, BLOGS_COLLECTION)
    const constraints: QueryConstraint[] = [where('slug', '==', slug)]
    
    if (!includeDrafts) {
      constraints.push(where('status', '==', 'published'))
    }
    
    const q = query(blogsRef, ...constraints)
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    return firestoreToBlogPost(doc, doc.id)
  } catch (error) {
    console.error(`Error obteniendo blog con slug ${slug} desde Firestore:`, error)
    return null
  }
}

/**
 * Obtiene un blog por ID desde Firestore
 */
export async function getBlogByIdFromFirestore(id: string): Promise<BlogPost | null> {
  try {
    const blogRef = doc(db, BLOGS_COLLECTION, id)
    const blogSnap = await getDoc(blogRef)
    
    if (!blogSnap.exists()) {
      return null
    }
    
    return firestoreToBlogPost(blogSnap, blogSnap.id)
  } catch (error) {
    console.error(`Error obteniendo blog con ID ${id} desde Firestore:`, error)
    return null
  }
}

/**
 * Crea un nuevo blog en Firestore
 */
export async function createBlogInFirestore(
  blogData: Omit<BlogPost, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    const slug = generateSlug(blogData.title)
    const blogRef = collection(db, BLOGS_COLLECTION)
    
    // Log para depuración
    console.log('📝 Datos del blog antes de convertir a Firestore:', {
      title: blogData.title,
      hasFeaturedImage: !!blogData.featuredImage,
      featuredImage: blogData.featuredImage,
    })
    
    const firestoreData = {
      ...blogPostToFirestore(blogData),
      slug,
    }
    
    // Log después de convertir
    console.log('📦 Datos convertidos para Firestore:', {
      hasFeaturedImage: !!firestoreData.featuredImage,
      featuredImage: firestoreData.featuredImage,
      keys: Object.keys(firestoreData),
    })
    
    const docRef = await addDoc(blogRef, firestoreData)
    
    console.log(`✅ Blog creado exitosamente con ID: ${docRef.id}`)
    return docRef.id
  } catch (error: any) {
    console.error('Error creando blog en Firestore:', error)
    throw error
  }
}

/**
 * Actualiza un blog existente en Firestore
 */
export async function updateBlogInFirestore(
  id: string,
  blogData: Partial<Omit<BlogPost, 'id' | 'slug' | 'createdAt' | 'updatedAt'>>
): Promise<boolean> {
  try {
    const blogRef = doc(db, BLOGS_COLLECTION, id)
    
    // Verificar que el documento existe
    const blogSnap = await getDoc(blogRef)
    if (!blogSnap.exists()) {
      console.error(`❌ Blog con ID ${id} no existe en Firestore`)
      throw new Error(`El blog con ID ${id} no existe en Firestore`)
    }
    
    // Preparar datos de actualización
    const updateData: any = {
      ...blogData,
      updatedAt: Timestamp.now(),
    }
    
    // Si se publica por primera vez, establecer publishedAt
    if (blogData.status === 'published') {
      const currentData = blogSnap.data()
      if (currentData.status !== 'published' || !currentData.publishedAt) {
        updateData.publishedAt = Timestamp.now()
      }
    }
    
    // Eliminar campos que no deben actualizarse
    delete updateData.id
    delete updateData.createdAt
    
    // Si se actualiza el título, regenerar el slug
    if (blogData.title) {
      updateData.slug = generateSlug(blogData.title)
    }
    
    // Log para depuración
    console.log('📝 Datos de actualización antes de limpiar:', {
      hasFeaturedImage: !!updateData.featuredImage,
      featuredImage: updateData.featuredImage,
    })
    
    // Limpiar campos undefined
    const cleanedData = removeUndefinedFields(updateData)
    
    // Log después de limpiar
    console.log('📦 Datos limpiados para actualizar:', {
      hasFeaturedImage: !!cleanedData.featuredImage,
      featuredImage: cleanedData.featuredImage,
      keys: Object.keys(cleanedData),
    })
    
    await updateDoc(blogRef, cleanedData)
    console.log(`✅ Blog ${id} actualizado exitosamente`)
    return true
  } catch (error: any) {
    console.error(`❌ Error actualizando blog ${id} en Firestore:`, error)
    throw error
  }
}

/**
 * Elimina un blog de Firestore
 */
export async function deleteBlogFromFirestore(id: string): Promise<boolean> {
  try {
    const blogRef = doc(db, BLOGS_COLLECTION, id)
    
    // Verificar que el documento existe
    const blogSnap = await getDoc(blogRef)
    if (!blogSnap.exists()) {
      console.error(`❌ Blog con ID ${id} no existe en Firestore`)
      return false
    }
    
    await deleteDoc(blogRef)
    console.log(`✅ Blog ${id} eliminado exitosamente`)
    return true
  } catch (error: any) {
    console.error(`❌ Error eliminando blog ${id} de Firestore:`, error)
    throw error
  }
}

/**
 * Incrementa el contador de visualizaciones de un blog
 */
export async function incrementBlogViews(id: string): Promise<void> {
  try {
    const blogRef = doc(db, BLOGS_COLLECTION, id)
    const blogSnap = await getDoc(blogRef)
    
    if (blogSnap.exists()) {
      const currentViews = blogSnap.data().views || 0
      await updateDoc(blogRef, {
        views: currentViews + 1,
      })
    }
  } catch (error) {
    console.error(`Error incrementando visualizaciones de blog ${id}:`, error)
  }
}
