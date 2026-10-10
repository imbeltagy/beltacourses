import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Geist has no Arabic glyphs. This one is loaded as its own `unicode-range`
// subset, so a page with no Arabic text never downloads it.
const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${arabic.variable}`;
