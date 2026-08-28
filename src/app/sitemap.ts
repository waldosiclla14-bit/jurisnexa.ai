import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date('2026-08-27'), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${SITE_URL}/precios`, lastModified: new Date('2026-08-27'), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${SITE_URL}/sobre-nosotros`, lastModified: new Date('2026-08-20'), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${SITE_URL}/ia`, lastModified: new Date('2026-08-27'), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${SITE_URL}/contacto`, lastModified: new Date('2026-08-20'), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${SITE_URL}/terminos`, lastModified: new Date('2026-08-10'), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${SITE_URL}/privacidad`, lastModified: new Date('2026-08-10'), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${SITE_URL}/blog`, lastModified: new Date('2026-08-27'), changeFrequency: 'weekly' as const, priority: 0.9 },
  ];

  const blogPosts = [
    { slug: 'despido-injustificado-peru', lastModified: new Date('2025-01-15') },
    { slug: 'divorcio-chile-proceso', lastModified: new Date('2025-01-10') },
    { slug: 'contrato-laboral-peru-derechos', lastModified: new Date('2025-01-05') },
  ];

  const blogPages = blogPosts.map(post => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}