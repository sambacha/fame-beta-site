import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"
import { PersonaProvider } from "@/components/persona-context"
import { Toaster } from "@/components/ui/toaster"
import { ARTICLES } from "@/lib/blog-content"
import { buildArticleLd, buildLdGraph, SITE, withBasePath } from "@/lib/seo"

// display=swap + size-adjusted fallback metrics (automatic in next/font)
// keep the font swap from shifting layout — the two workhorses of CLS control.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "FAME Protocol — Formally Verified Parametric Parlay Infrastructure",
    template: "%s | FAME Protocol",
  },
  description: SITE.description,
  keywords: [
    "parametric parlays",
    "formal verification",
    "DeFi infrastructure",
    "liquidity ratio",
    "emission cap",
    "institutional DeFi",
    "Solana",
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  alternates: {
    canonical: "/",
    types: { "text/markdown": withBasePath("/sources/home.md") },
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: "FAME Protocol — Formally Verified Parametric Parlay Infrastructure",
    description: SITE.description,
    locale: "en_US",
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: "FAME Protocol — one curve, no insiders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAME Protocol",
    description: SITE.tagline,
    images: [SITE.ogImage],
  },
  // Next does not base-path-prefix metadata icon hrefs on project-site hosting;
  // withBasePath keeps the favicon resolvable under /<repo>/ subpaths too.
  icons: { icon: withBasePath("/logo.svg") },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0e12",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const articleLd = ARTICLES.map((article) => buildArticleLd(article))

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildLdGraph(articleLd) }}
        />
        <PersonaProvider>
          <a
            href="#main"
            className="skip-link rounded-tremor-default bg-surface-accent-inverse px-4 py-2 text-mono-sm text-content-inverse"
          >
            Skip to main content
          </a>
          <Nav />
          {children}
          <Footer />
        </PersonaProvider>
        <Toaster />
      </body>
    </html>
  )
}
