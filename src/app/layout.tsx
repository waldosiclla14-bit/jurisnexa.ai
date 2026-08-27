import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JurisNexa.ai | Asistente Jurídico IA - Perú y Chile",
    template: "%s | JurisNexa.ai",
  },
  description: "Plataforma de inteligencia artificial jurídica especializada en legislación de Perú y Chile. Consultas legales, análisis de documentos y comparación jurídica.",
  keywords: ["asistente jurídico", "inteligencia artificial", "legislación Perú", "legislación Chile", "derecho", "consulta legal", "abogado IA"],
  authors: [{ name: "JurisNexa.ai" }],
  creator: "JurisNexa.ai",
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://jurisnexa.ai",
    siteName: "JurisNexa.ai",
    title: "JurisNexa.ai | Asistente Jurídico IA",
    description: "Consultas legales inteligentes especializadas en Perú y Chile",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JurisNexa.ai - Asistente Jurídico IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JurisNexa.ai | Asistente Jurídico IA",
    description: "Consultas legales inteligentes especializadas en Perú y Chile",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body className="min-h-full bg-zinc-950 text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
