import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const poppins = localFont({
  variable: "--font-poppins",
  display: "swap",
  src: [
    { path: "./fonts/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: "./fonts/inter-latin-wght-normal.woff2",
});

const SITE_URL = process.env.APP_URL ?? "https://comunidadfasta.cloud";
const SITE_DESCRIPTION =
  "Un espacio para descubrir talentos, servicios, comercios y proyectos de las familias que forman parte de la comunidad FASTA — Colegio Boisdron, Tucumán.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Comunidad FASTA — Lo que somos, lo que hacemos, lo que compartimos.",
    template: "%s — Comunidad FASTA",
  },
  description: SITE_DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Comunidad FASTA",
    locale: "es_AR",
    url: SITE_URL,
    title: "Comunidad FASTA — Lo que somos, lo que hacemos, lo que compartimos.",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Comunidad FASTA",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${poppins.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--color-bg)]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
