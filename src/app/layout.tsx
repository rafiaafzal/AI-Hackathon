import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";

const headline = Playfair_Display({ subsets: ["latin"], variable: "--font-headline" });
const body = Source_Serif_4({ subsets: ["latin"], variable: "--font-body" });
const ui = Inter({ subsets: ["latin"], variable: "--font-ui" });

export const metadata: Metadata = {
  title: "Chai & News",
  description: "Your morning paper, brewed fresh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${headline.variable} ${body.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}