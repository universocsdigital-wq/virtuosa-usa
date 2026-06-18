import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

// ─── FONTES ───────────────────────────────────────────────────────────
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

// ─── SEO METADATA ─────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL("https://virtuosausa.com"),
  title: {
    default: "Virtuosa USA — Elegant Women's Boutique",
    template: "%s | Virtuosa USA",
  },
  description:
    "Timeless pieces for women who value femininity, sophistication, and presence. Premium dresses, skirts, and sets crafted with artisanal care.",
  keywords: [
    "women's boutique",
    "premium women's clothing",
    "elegant dresses",
    "conservative fashion",
    "feminine clothing USA",
    "Virtuosa USA",
    "modest fashion",
    "Christian women fashion",
  ],
  authors: [{ name: "Virtuosa USA" }],
  creator: "Virtuosa USA",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://virtuosausa.com",
    siteName: "Virtuosa USA",
    title: "Virtuosa USA — Elegance with Purpose",
    description:
      "Timeless pieces for women who value femininity, sophistication, and presence.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Virtuosa USA — Elegant Women's Boutique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtuosa USA — Elegance with Purpose",
    description:
      "Timeless pieces for women who value femininity, sophistication, and presence.",
    images: ["/images/og-image.jpg"],
  },
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F5EFE7",
};

// ─── LAYOUT ROOT ──────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-virtuosa-warm-beige text-virtuosa-deep-brown font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
