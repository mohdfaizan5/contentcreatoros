import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Inter_Tight, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// -----------------------------------------------------------------------------
// FONT CONFIGURATION
// Uncomment the font you want to use and comment out the others.
// Ensure only ONE font is active at a time to avoid conflicts.
// -----------------------------------------------------------------------------

// 1. INTER TIGHT (Current Active)
const fontSans = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
});

// 2. GOOGLE SANS FLEX (Commented)
// Note: Requires font files in /public/fonts/ or /src/app/fonts/
// import localFont from "next/font/local";
// const fontSans = localFont({
//   src: [
//     { path: './fonts/GoogleSansFlex-Regular.woff2', weight: '400', style: 'normal' },
//     { path: './fonts/GoogleSansFlex-Medium.woff2', weight: '500', style: 'normal' },
//     { path: './fonts/GoogleSansFlex-Bold.woff2', weight: '700', style: 'normal' },
//   ],
//   variable: "--font-sans",
// });

// 3. EXISTING INTER (Commented)
// const fontSans = Inter({
//   subsets: ['latin'],
//   variable: '--font-sans'
// });

// -----------------------------------------------------------------------------

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

// Unused but kept for reference
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContentCreatorOS",
  description: "Making your content creation easier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body
        className={`${serif.variable} ${fontSans.variable} font-sans antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
