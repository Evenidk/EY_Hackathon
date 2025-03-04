// digital-seva\app\layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TranslationProvider } from "./lib/TranslationContext";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Digital Seva",
  description: "Access government schemes, track applications, and get personalized recommendations all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TranslationProvider>
        {children}
        </TranslationProvider>
        
      </body>
    </html>
  );
}
