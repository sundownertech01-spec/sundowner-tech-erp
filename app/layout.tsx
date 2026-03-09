import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. IMPORTAMOS EL GAFETE VIRTUAL (AuthProvider)
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Cambiamos el título para que la pestaña del navegador luzca profesional
export const metadata: Metadata = {
  title: "Sundowner Tech | ERP",
  description: "Sistema de gestión y control operativo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 2. ENVOLVEMOS TODA LA APLICACIÓN PARA QUE CONOZCA AL USUARIO */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}