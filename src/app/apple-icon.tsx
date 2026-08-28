import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c0c0f',
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 30,
            background: '#10b981',
            color: '#052e1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 76,
            fontWeight: 800,
          }}
        >
          J
        </div>
      </div>
    ),
    { ...size }
  )
}