import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studia Academy — Centre d'Excellence | Libreville, Gabon",
  description:
    "Studia Academy, centre d'excellence basé à Libreville (Gabon). Formations, tests de compétences, universités chinoises, audit IA entreprises et accompagnement pédagogique pour l'Afrique Centrale.",
  keywords: [
    "formation",
    "emploi",
    "CV",
    "entretien",
    "compétences",
    "Gabon",
    "Libreville",
    "Afrique Centrale",
    "universités chinoises",
    "Sowax Group",
    "Studia Lab",
    "audit IA",
    "digitalisation",
  ],
  authors: [{ name: "Studia Academy — Sowax Group" }],
  openGraph: {
    title: "Studia Academy — Centre d'Excellence | Libreville, Gabon",
    description:
      "Centre d'excellence basé à Libreville pour la formation, les tests de compétences et l'accompagnement pédagogique en Afrique Centrale.",
    type: "website",
    locale: "fr_GA",
    siteName: "Studia Academy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${poppins.variable} ${inter.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
