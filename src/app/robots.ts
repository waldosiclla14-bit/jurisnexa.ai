import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jurisnexa.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/historial/', '/documentos/', '/perfil/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
