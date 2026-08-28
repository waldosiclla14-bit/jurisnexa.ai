import { blogPosts, getBlogPost } from '@/lib/blog';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  
  if (!post) {
    return { title: 'Artículo no encontrado | JurisNexa.ai' };
  }

  return {
    title: `${post.title} | JurisNexa.ai`,
    description: post.description,
    keywords: post.tags.join(', '),
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `/blog/${slug}`,
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-4">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-semibold text-white mt-6 mb-3">{line.slice(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="text-zinc-400 ml-4 mb-1 list-disc">{line.slice(2)}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="text-zinc-400 ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-4 border-emerald-500 pl-4 py-2 my-4 bg-emerald-500/5 text-zinc-300 italic">
            {line.slice(2)}
          </blockquote>
        );
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="text-zinc-400 mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader />

      <main className="mx-auto max-w-3xl px-4 py-16">
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded">
                {post.category}
              </span>
              <span className="text-sm text-zinc-500">
                {new Date(post.publishedAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="text-sm text-zinc-500">• {post.readingTime} min de lectura</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{post.title}</h1>
            <p className="text-lg text-zinc-400">{post.description}</p>
          </div>

          <div className="prose prose-invert max-w-none">
            {renderContent(post.content)}
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                JN
              </div>
              <div>
                <p className="text-white font-medium">{post.author}</p>
                <p className="text-sm text-zinc-500">Asistente Jurídico IA</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-zinc-800 text-zinc-400 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>

        <div className="mt-12 p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-white mb-2">¿Necesitas asesoramiento legal?</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Usa nuestro asistente IA para obtener información sobre tu caso específico.
          </p>
          <a
            href="/chat"
            className="inline-block px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Consultar Ahora
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
