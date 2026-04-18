import type { Metadata } from "next";
import localFont from "next/font/local";
import {
  Geist, Geist_Mono,
  // Inter,
  Inter_Tight, Instrument_Serif,
  Source_Serif_4
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/lib/theme-provider";

const interHeading = Inter_Tight({ subsets: ['latin'], variable: '--font-heading' });


// -----------------------------------------------------------------------------
// FONT CONFIGURATION
// Uncomment the font you want to use and comment out the others.
// Ensure only ONE font is active at a time to avoid conflicts.
// -----------------------------------------------------------------------------

// 1. INTER TIGHT (Current Active)
const inter = Inter_Tight({ subsets: ['latin'], variable: '--font-sans' });

const serif = localFont({
  src: "../../public/ScotchDeck-Light.woff2",
  variable: "--font-serif",
  weight: "300",
  style: "normal",
  display: "swap",
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

// const serif2 = Source_Serif_4({
//   variable: "--font-serif2",
//   subsets: ["latin"],
// });

const InstrumentalSerif = Instrument_Serif({
  variable: "--font-serif-instrumental",
  weight: ["400"],
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
  title: "ContentOSX",
  description: "Making your content creation easier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, interHeading.variable)}>
      <body
        className={`${serif.variable} ${inter.variable} font-sans antialiased overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
