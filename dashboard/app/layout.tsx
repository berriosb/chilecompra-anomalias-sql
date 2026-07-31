import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChileCompra — Análisis de Compras Públicas",
  description:
    "918K órdenes de compra del Estado chileno en 2024. Detección de concentración de proveedores (HHI), top anómalos, estacionalidad y equidad territorial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
