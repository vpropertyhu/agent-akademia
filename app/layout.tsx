import type { Metadata } from "next";
import "./globals.css";
import "./daily.css";
import "./simple.css";
import "./ai.css";
import "./brand.css";

export const metadata: Metadata = {
  title: "Agent Akadémia | Kész agentek, a te munkádra",
  description: "Tanuld meg használni az első AI-munkatársadat. Vezetett első feladat, céges háttér, új tartalom és saját gépre letölthető Tartalomkészítő.",
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
