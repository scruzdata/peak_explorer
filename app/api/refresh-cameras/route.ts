import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { DgtCameraData } from '@/lib/firebase/cameras'

interface DgtCamera {
  latitud: string
  longitud: string
  sentido: string
  imagen: string
  carretera: string
  id: string
  pk: string
  provincia: string
  fecha: string
}

interface DgtResponse {
  camaras: DgtCamera[]
}

const DGT_URL = 'https://www.dgt.es/.content/.assets/json/camaras.json'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.email !== process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const response = await fetch(DGT_URL, {
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://www.dgt.es/conoce-el-estado-del-trafico/camaras-de-trafico/',
    },
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: `Error al obtener datos de la DGT: ${response.status} ${response.statusText}` },
      { status: 502 }
    )
  }

  const data: DgtResponse = await response.json()

  if (!data.camaras || !Array.isArray(data.camaras)) {
    return NextResponse.json({ error: 'Formato de respuesta inesperado de la DGT' }, { status: 502 })
  }

  const cameras: DgtCameraData[] = data.camaras.map((cam) => ({
    latitud: cam.latitud,
    longitud: cam.longitud,
    imagen: cam.imagen,
    carretera: cam.carretera,
    pk: cam.pk,
    provincia: cam.provincia,
    source: 'dgt',
  }))

  return NextResponse.json({ cameras })
}
