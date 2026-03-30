import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          fontWeight: 900,
          fontSize: 14,
          color: 'white',
          letterSpacing: '-0.5px',
        }}
      >
        PE
      </div>
    ),
    { ...size }
  )
}
