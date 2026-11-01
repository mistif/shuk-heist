import type { Metadata } from "next";
import { Alfa_Slab_One, Geist, Special_Elite } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Heavy slab for painted stall signs.
const signFont = Alfa_Slab_One({
  variable: "--font-sign",
  weight: "400",
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
