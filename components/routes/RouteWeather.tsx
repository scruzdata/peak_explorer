'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets } from 'lucide-react'

interface RouteWeatherProps {
  lat: number
  lng: number
  useIframe?: boolean // Opción para usar iframe en lugar de API
}

interface DailyForecast {
  date: string
  maxTemp: number
  minTemp: number
  description: string
  icon: string
  precipitation: number
  windSpeed: number
}

interface WeatherData {
  current: {
    temp: number
    feelsLike: number
    description: string
    icon: string
    humidity: number
    windSpeed: number
    pressure: number
  }
  forecast: DailyForecast[]
}

/**
 * Componente que muestra información meteorológica de la ubicación de la ruta
 * Opción 1: Utiliza OpenWeatherMap API (requiere API key gratuita)
 * Opción 2: Utiliza iframe de meteoblue (no requiere API key)
 */
export function RouteWeather({ lat, lng, useIframe = false }: RouteWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si se usa iframe, no hacer fetch
    if (useIframe) {
      setLoading(false)
      return
    }

    /**
     * Obtiene los datos meteorológicos desde Open-Meteo (gratis, sin API key)
     * Alternativa: OpenWeatherMap (requiere API key)
     */
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        // Intentar primero con Open-Meteo (gratis, sin API key) - pronóstico de 7 días
        const openMeteoResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`
        )

        if (openMeteoResponse.ok) {
          const data = await openMeteoResponse.json()
          const current = data.current
          const daily = data.daily
          
          // Mapear códigos de tiempo de WMO a descripciones
          const weatherDescriptions: { [key: number]: string } = {
            0: 'despejado',
            1: 'mayormente despejado',
            2: 'parcialmente nublado',
            3: 'nublado',
            45: 'niebla',
            48: 'niebla helada',
            51: 'llovizna ligera',
            53: 'llovizna moderada',
            55: 'llovizna densa',
            56: 'llovizna helada ligera',
            57: 'llovizna helada densa',
            61: 'lluvia ligera',
            63: 'lluvia moderada',
            65: 'lluvia intensa',
            71: 'nieve ligera',
            73: 'nieve moderada',
            75: 'nieve intensa',
            77: 'granizo',
            80: 'chubascos ligeros',
            81: 'chubascos moderados',
            82: 'chubascos intensos',
            85: 'chubascos de nieve ligeros',
            86: 'chubascos de nieve intensos',
            95: 'tormenta',
            96: 'tormenta con granizo',
            99: 'tormenta intensa con granizo',
          }

          const getDescription = (code: number) => weatherDescriptions[code] || 'desconocido'
          const getIconCode = (code: number) => code <= 1 ? '01' : code <= 3 ? '02' : code >= 61 ? '10' : '03'
          
          // Procesar pronóstico diario
          const forecast: DailyForecast[] = daily.time.map((date: string, index: number) => ({
            date,
            maxTemp: Math.round(daily.temperature_2m_max[index]),
            minTemp: Math.round(daily.temperature_2m_min[index]),
            description: getDescription(daily.weather_code[index]),
            icon: getIconCode(daily.weather_code[index]),
            precipitation: Math.round(daily.precipitation_sum[index] * 10) / 10,
            windSpeed: Math.round(daily.wind_speed_10m_max[index] * 3.6),
          }))
          
          setWeather({
            current: {
              temp: Math.round(current.temperature_2m),
              feelsLike: Math.round(current.temperature_2m),
              description: getDescription(current.weather_code),
              icon: getIconCode(current.weather_code),
              humidity: Math.round(current.relative_humidity_2m),
              windSpeed: Math.round(current.wind_speed_10m * 3.6),
              pressure: Math.round(current.pressure_msl),
            },
            forecast,
          })
          setLoading(false)
          return
        }

        // Si Open-Meteo falla, intentar con OpenWeatherMap (si hay API key)
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
        if (API_KEY && API_KEY !== 'YOUR_API_KEY') {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=es`
          )

          if (response.ok) {
            const data = await response.json()
            
            // OpenWeatherMap solo devuelve datos actuales, crear pronóstico básico
            setWeather({
              current: {
                temp: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind.speed * 3.6),
                pressure: data.main.pressure,
              },
              forecast: [], // OpenWeatherMap requiere plan de pago para pronóstico extendido
            })
            setLoading(false)
            return
          }
        }

        throw new Error('No se pudo obtener datos meteorológicos')
      } catch (err) {
        setError('No se pudo cargar la información meteorológica')
        console.error('Error fetching weather:', err)
        setLoading(false)
      }
    }

    fetchWeather()
  }, [lat, lng, useIframe])

  /**
   * Obtiene el icono correspondiente según el código del tiempo
   */
  const getWeatherIcon = (iconCode: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
    if (iconCode.includes('01')) return <Sun className={`${sizeClass} text-yellow-500`} />
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) {
      return <Cloud className={`${sizeClass} text-gray-500`} />
    }
    if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) {
      return <CloudRain className={`${sizeClass} text-blue-500`} />
    }
    return <Cloud className={`${sizeClass} text-gray-400`} />
  }

  /**
   * Formatea la fecha para mostrar
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana'
    }
    
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`
  }

  // Si se usa iframe, mostrar widget embebido (no recomendado, mejor usar API)
  if (useIframe) {
    // Nota: Los widgets iframe a menudo no respetan las coordenadas correctamente
    // Se recomienda usar useIframe=false para usar la API de Open-Meteo
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">Meteorología</h3>
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Ubicación de la ruta:</strong> {lat.toFixed(4)}°N, {lng.toFixed(4)}°W
            </p>
            <p className="text-xs text-gray-600 mb-3">
              Los widgets iframe no siempre respetan las coordenadas. Se recomienda usar la API directamente.
            </p>
            <p className="text-xs text-gray-500">
              Cambia <code className="bg-gray-100 px-1 rounded">useIframe={false}</code> en RouteDetail.tsx para usar datos precisos de la ubicación.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">Meteorología</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">Meteorología</h3>
        <div className="py-4 text-center text-sm text-gray-500">
          <p>{error}</p>
          <p className="mt-2 text-xs">
            <a
              href="https://openweathermap.org/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Obtén una API key gratuita aquí
            </a>
          </p>
          <p className="mt-2 text-xs text-gray-400">
            O usa <code className="text-primary-600">useIframe=true</code> para mostrar un widget sin API key
          </p>
        </div>
      </div>
    )
  }

  if (!weather) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Meteorología</h3>
      
      <div className="space-y-4">
        {/* Temperatura actual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.current.icon, 'lg')}
            <div>
              <div className="text-3xl font-bold text-gray-900">{weather.current.temp}°C</div>
              <div className="text-sm text-gray-600 capitalize">{weather.current.description}</div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Sensación térmica</div>
            <div className="font-medium text-gray-700">{weather.current.feelsLike}°C</div>
          </div>
        </div>

        {/* Detalles actuales */}
        <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-xs text-gray-500">Humedad</div>
              <div className="text-sm font-medium text-gray-900">{weather.current.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Viento</div>
              <div className="text-sm font-medium text-gray-900">{weather.current.windSpeed} km/h</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <div>
              <div className="text-xs text-gray-500">Presión</div>
              <div className="text-sm font-medium text-gray-900">{weather.current.pressure} hPa</div>
            </div>
          </div>
        </div>

        {/* Pronóstico de 7 días */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Pronóstico 7 días</h4>
          <div className="space-y-2">
            {weather.forecast.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-2 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-16 text-xs font-medium text-gray-600">
                    {formatDate(day.date)}
                  </div>
                  {getWeatherIcon(day.icon, 'sm')}
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 capitalize">{day.description}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {day.precipitation > 0 && (
                        <span className="flex items-center gap-1">
                          <Droplets className="h-3 w-3" />
                          {day.precipitation}mm
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Wind className="h-3 w-3" />
                        {day.windSpeed} km/h
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{day.maxTemp}°</span>
                  <span className="text-sm text-gray-400">{day.minTemp}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

