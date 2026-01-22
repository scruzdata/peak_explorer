'use client'

import { useState, useId } from 'react'
import { Upload, Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { Route } from '@/types'

interface GPXUploaderProps {
  onSuccess: (routeData: Partial<Route>) => void
  onError?: (error: string) => void
  skipAI?: boolean // Si es true, solo parsea el GPX sin enriquecimiento con IA
}

/**
 * Componente para subir y procesar archivos GPX
 * Extrae datos base del GPX y enriquece metadatos usando IA
 */
export function GPXUploader({ onSuccess, onError, skipAI = false }: GPXUploaderProps) {
  const inputId = useId()
  const fileInputId = `gpx-file-input-${inputId}`
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  /**
   * Maneja la selección de archivo
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    console.log('Archivo seleccionado:', selectedFile?.name, selectedFile?.size)
    
    if (selectedFile) {
      // Validar extensión
      if (!selectedFile.name.toLowerCase().endsWith('.gpx')) {
        setStatus('error')
        setStatusMessage('El archivo debe ser un archivo GPX (.gpx)')
        if (onError) {
          onError('El archivo debe ser un archivo GPX (.gpx)')
        }
        setFile(null)
        return
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (selectedFile.size > maxSize) {
        setStatus('error')
        setStatusMessage('El archivo es demasiado grande. Máximo 10MB')
        if (onError) {
          onError('El archivo es demasiado grande. Máximo 10MB')
        }
        setFile(null)
        return
      }

      setFile(selectedFile)
      setStatus('idle')
      setStatusMessage('')
      console.log('Archivo válido establecido:', selectedFile.name)
    } else {
      console.log('No se seleccionó ningún archivo')
      setFile(null)
    }
  }

  /**
   * Procesa el archivo GPX enviándolo al endpoint API
   */
  const handleUpload = async () => {
    console.log('handleUpload llamado, file:', file?.name, 'loading:', loading)
    
    if (!file) {
      console.log('No hay archivo seleccionado')
      setStatus('error')
      setStatusMessage('Por favor selecciona un archivo GPX')
      return
    }

    setLoading(true)
    setStatus('idle')
    setLogs([])
    
    // Mensajes de progreso simulados mientras se procesa
    const progressMessages = skipAI
      ? [
          'Procesando archivo GPX...',
          'Parseando datos del GPX...',
          'Extrayendo coordenadas y elevación...',
          'Extrayendo waypoints...',
          'Calculando distancias...',
        ]
      : [
          'Procesando archivo GPX...',
          'Parseando datos del GPX...',
          'Extrayendo coordenadas y elevación...',
          'Llamando a IA para enriquecer metadatos...',
          'Generando imágenes...',
          'Guardando track en Firestore...',
        ]
    
    let progressIndex = 0
    const progressInterval = setInterval(() => {
      if (progressIndex < progressMessages.length - 1) {
        progressIndex++
        setStatusMessage(progressMessages[progressIndex])
      }
    }, 800)

    try {
      // Crear FormData
      const formData = new FormData()
      formData.append('file', file)
      
      // Si skipAI es true, indicar que no se debe usar IA
      if (skipAI) {
        formData.append('skipAI', 'true')
        console.log('📄 Modo: Solo parsear GPX (sin enriquecimiento con IA)')
      } else {
        console.log('🤖 Modo: Procesar GPX con enriquecimiento con IA')
      }

      // Enviar al endpoint API
      const response = await fetch('/api/process-gpx', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      // Limpiar intervalo de progreso
      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Error al procesar el archivo')
      }

      if (result.success && result.data) {
        setStatus('success')
        setStatusMessage('✅ Archivo procesado correctamente. Los datos se han cargado en el formulario.')
        
        // Mostrar logs si están disponibles
        if (result.logs && Array.isArray(result.logs)) {
          setLogs(result.logs)
          // Actualizar el mensaje de estado con el último log si hay logs
          if (result.logs.length > 0) {
            const lastLog = result.logs[result.logs.length - 1]
            setStatusMessage(`✅ ${lastLog}`)
          }
        }
        
        // Llamar al callback de éxito con los datos procesados
        onSuccess(result.data)
        
        // Resetear después de 5 segundos (más tiempo para leer logs)
        setTimeout(() => {
          setFile(null)
          setStatus('idle')
          setStatusMessage('')
          setLogs([])
          // Resetear el input
          const fileInput = document.getElementById(fileInputId) as HTMLInputElement
          if (fileInput) {
            fileInput.value = ''
          }
        }, 5000)
      } else {
        throw new Error('No se recibieron datos válidos del servidor')
      }
    } catch (error) {
      // Limpiar intervalo de progreso en caso de error
      clearInterval(progressInterval)
      
      console.error('Error procesando GPX:', error)
      setStatus('error')
      setStatusMessage(
        error instanceof Error 
          ? `❌ ${error.message}` 
          : '❌ Error al procesar el archivo GPX. Por favor, inténtalo de nuevo.'
      )
      if (onError) {
        onError(error instanceof Error ? error.message : 'Error desconocido')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center space-x-2">
        <Upload className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-800">Subir Archivo GPX</h2>
      </div>

      <div className="space-y-4">
        {/* Input de archivo */}
        <div>
          <label
            htmlFor={fileInputId}
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Seleccionar archivo GPX
          </label>
          <div className="flex items-center space-x-4">
            <label
              htmlFor={fileInputId}
              className="flex cursor-pointer items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <FileText className="h-4 w-4" />
              <span>Seleccionar archivo</span>
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".gpx"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
            {file && (
              <span className="text-sm text-gray-600">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
        </div>

        {/* Botón de procesar */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!file ? 'Selecciona un archivo GPX primero' : loading ? 'Procesando...' : 'Procesar archivo GPX'}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Procesar GPX</span>
            </>
          )}
        </button>

        {/* Mensaje de estado con logs */}
        {statusMessage && (
          <div
            className={`rounded-md p-3 ${
              status === 'success'
                ? 'bg-green-50 text-green-800'
                : status === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-blue-50 text-blue-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              {status === 'success' && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
              {status === 'error' && <XCircle className="h-5 w-5 flex-shrink-0" />}
              {status === 'idle' && <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />}
              <p className="text-sm font-medium">{statusMessage}</p>
            </div>
            
            {/* Mostrar logs durante el procesamiento y después */}
            {logs.length > 0 && (
              <div className="mt-3 rounded-md bg-gray-900 p-3 text-xs text-green-400 font-mono max-h-64 overflow-y-auto">
                <p className="text-gray-400 mb-3 font-semibold text-[10px] uppercase tracking-wide">
                  Logs del procesamiento:
                </p>
                <div className="space-y-2">
                  {logs.map((log: string, index: number) => (
                    <div 
                      key={index} 
                      className="text-[11px] leading-relaxed break-words whitespace-pre-wrap"
                      style={{ wordBreak: 'break-word' }}
                    >
                      <span className="text-gray-500 mr-2">[{index + 1}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información adicional */}
        <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          <p className="font-medium mb-1">Información:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>El archivo GPX será parseado para extraer distancia, elevación y coordenadas</li>
            <li>Los metadatos faltantes se enriquecerán automáticamente usando IA</li>
            <li>Tamaño máximo: 10MB</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

