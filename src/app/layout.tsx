import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Chapa Certa — Central de Gestão",
  description: "Central gerencial da Chapa Certa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
