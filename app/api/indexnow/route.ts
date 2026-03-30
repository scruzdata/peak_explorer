import { NextResponse } from 'next/server'

const INDEXNOW_API_KEY = process.env.INDEXNOW_API_KEY
const SITE_HOST = 'www.peakexplorer.es'

export async function POST(request: Request) {
  if (!INDEXNOW_API_KEY) {
    return NextResponse.json({ error: 'INDEXNOW_API_KEY not configured' }, { status: 501 })
  }

  let urls: string[]
  try {
    const body = await request.json()
    urls = body.urls
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'urls must be a non-empty array' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_API_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_API_KEY}.txt`,
        urlList: urls,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('IndexNow error:', response.status, text)
      return NextResponse.json({ error: 'IndexNow submission failed', status: response.status }, { status: 502 })
    }

    return NextResponse.json({ ok: true, submitted: urls.length })
  } catch (err) {
    console.error('IndexNow fetch error:', err)
    return NextResponse.json({ error: 'Network error contacting IndexNow' }, { status: 502 })
  }
}
