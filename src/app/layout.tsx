import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JurisNexa.ai | Asistente Jurídico IA - Perú y Chile",
    template: "%s | JurisNexa.ai",
  },
  description: "Plataforma de inteligencia artificial jurídica especializada en legislación de Perú y Chile. Consultas legales, análisis de documentos y comparación jurídica.",
  keywords: ["asistente jurídico", "inteligencia artificial", "legislación Perú", "legislación Chile", "derecho", "consulta legal", "abogado IA"],
  authors: [{ name: "JurisNexa.ai" }],
  creator: "JurisNexa.ai",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "/",
    siteName: "JurisNexa.ai",
    title: "JurisNexa.ai | Asistente Jurídico IA",
    description: "Consultas legales inteligentes especializadas en Perú y Chile",
  },
  twitter: {
    card: "summary_large_image",
    title: "JurisNexa.ai | Asistente Jurídico IA",
    description: "Consultas legales inteligentes especializadas en Perú y Chile",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'JurisNexa.ai',
  url: SITE_URL,
  description: 'Asistente jurídico IA especializado en legislación de Perú y Chile',
  areaServed: [{ '@type': 'Country', name: 'Peru' }, { '@type': 'Country', name: 'Chile' }],
  availableLanguage: ['es-PE', 'es-CL'],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-full bg-zinc-950 text-white antialiased">
        <a href="#main-content" className="sr-only left-2 top-2 z-[100] rounded bg-white px-3 py-2 text-sm text-black focus:not-sr-only focus:absolute">
          Saltar al contenido principal
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
