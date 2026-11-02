import type { Metadata } from "next";
import { Bodoni_Moda, Geist, Special_Elite } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// High-contrast serif: thin, sharp strokes for titles and painted stall signs.
const signFont = Bodoni_Moda({
  variable: "--font-sign",
  subsets: ["latin"],
});

// Police typewriter for anything that belongs in the case file.
const typewriterFont = Special_Elite({
  variable: "--font-typewriter",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Shuk Recipe Heist",
  description: "Search the case files, question the suspects and catch the recipe thief.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${signFont.variable} ${typewriterFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
