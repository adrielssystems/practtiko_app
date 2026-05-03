import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import LayoutShell from "@/components/LayoutShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Practiiko App - Autogestión",
  description: "Panel de administración y autogestión de Practiiko.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable}`}>
      <body>
        <Providers>
          <LayoutShell>
            {children}
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
