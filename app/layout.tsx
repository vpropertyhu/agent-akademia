import type { Metadata } from "next";
import "./globals.css";
import "./daily.css";
import "./simple.css";
import "./ai.css";
import "./brand.css";
import "./module-builder.css";

export const metadata: Metadata = {
  title: "Agent Akadémia | Miben segítsen neked az AI?",
  description: "Válassz feladatokat, írd le, mit szeretnél, és próbáld ki a saját AI-segítődet. Közérthető útmutatóval vezetünk végig.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className="antialiased">{children}</body>
    </html>
  );
}
