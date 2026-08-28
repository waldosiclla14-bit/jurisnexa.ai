import { blogPosts } from '@/lib/blog';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | JurisNexa.ai',
  description: 'Artículos sobre derecho, legislación y consultas legales en Perú y Chile.',
  alternates: {
    canonical: '/blog',
  },
};


export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Blog</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Artículos sobre derecho, legislación y consultas legales en Perú y Chile.
          </p>
        </div>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded">
                  {post.category}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(post.publishedAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="text-xs text-zinc-500">• {post.readingTime} min de lectura</span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                <a href={`/blog/${post.slug}`} className="hover:text-emerald-400 transition-colors">
                  {post.title}
                </a>
              </h2>

              <p className="text-zinc-400 text-sm mb-4">{post.description}</p>

              <div className="flex items-center gap-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-zinc-700/50 text-zinc-400 text-xs rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
