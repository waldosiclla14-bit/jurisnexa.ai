import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/site'

export const alt = 'JurisNexa.ai - Asistente Jurídico IA para Perú y Chile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0c0c0f 0%, #18181b 55%, #052e1e 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: 64,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 42,
              fontWeight: 800,
              color: '#052e1e',
            }}
          >
            J
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: 1 }}>
            {SITE_NAME}
          </div>
        </div>
        <div style={{ fontSize: 38, fontWeight: 600, textAlign: 'center', maxWidth: 980 }}>
          Asistente Jurídico IA para Perú y Chile
        </div>
        <div style={{ fontSize: 24, color: '#a1a1aa', textAlign: 'center', marginTop: 22, maxWidth: 900 }}>
          Respuestas verificadas contra legislación oficial. Sin alucinaciones, con fuentes trazables.
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 40,
          }}
        >
          <div
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              background: '#10b981',
              color: '#052e1e',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Sin alucinaciones
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              border: '2px solid #10b981',
              color: '#10b981',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Fuentes verificables
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}