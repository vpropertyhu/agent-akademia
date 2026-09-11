import type { Metadata } from "next";
import "./globals.css";
import "./daily.css";
import "./simple.css";
import "./ai.css";
import "./brand.css";
import "./module-builder.css";

export const metadata: Metadata = {
  title: "Agent Akadémia | Egy mező. A te összeállításod.",
  description: "Építs képességekből saját agenttervet. Egy mezőbe helyezhető képességelemek, újra használható modulok és érthető, lépésenkénti szemléltetés.",
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
