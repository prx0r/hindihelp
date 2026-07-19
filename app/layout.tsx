import type { Metadata, Viewport } from "next";
import { Outfit, Noto_Sans_Devanagari } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  title: "HindiHelp — Learn Hindi",
  description: "Learn practical Hindi with an AI tutor, speech practice, and structured lessons",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a1a12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('dark');`,
          }}
        />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={`${outfit.variable} ${notoDevanagari.variable} font-sans bg-background text-foreground min-h-screen antialiased`}>
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-6 pb-20 bg-background">{children}</main>
      </body>
    </html>
  );
}
