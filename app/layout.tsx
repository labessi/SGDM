import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SGDM - Système de Gestion Médicale",
  description: "Plateforme de gestion médicale pour les médecins et les administrateurs.",
  themeColor: "#8936FF", // ✅ obligatoire pour PWA
  manifest: "/manifest.json", // ✅ utilisé automatiquement par Next.js (mais on le remet dans <head> aussi par sécurité)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
    <html lang="fr" className="h-full bg-gray-100 text-gray-900">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8936FF" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/icons/icon512_rounded.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col relative overflow-hidden`}>
        <main className="flex-1">{children}</main>
      </body>
    </html>
    </AuthProvider>
  );
}
